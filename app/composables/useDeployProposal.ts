import { computed, ref, type Ref } from "vue";
import { streamText, type ModelMessage } from "ai";
import { requiredVramMb, templateReadmeSnippet, type Template } from "~/composables/useTemplates";
import type { GpuListing } from "~/composables/useNodeRequirements";
import { nosaRunModel } from "~/composables/useNosaTools";
import { sponsoredProvider } from "~/utils/playgroundTransport";
import {
  huggingFaceApps,
  huggingFaceVramMb,
  isGated,
  loadOllamaLibrary,
  ollamaVramMb,
  searchHuggingFace,
} from "~/utils/quickStart";
import {
  huggingFaceSearchTerm,
  resolveModel,
  runProposal,
  type CatalogueHuggingFaceModel,
  type CatalogueJobs,
  type CatalogueOllamaModel,
  type CatalogueTemplate,
  type DeployProposal,
} from "~/utils/deployProposal";

/** How much of the Ollama library, most pulled first, the prompt lists. */
const OLLAMA_CATALOGUE_SIZE = 100;

/** Where a proposal is: the model writing an answer, or the validator checking a job. */
export type ProposalPhase = "idle" | "writing" | "checking";

/** One line of the progress log: a step, how it went, and what it took or found. */
export type ProposalStep = {
  label: string;
  state: "active" | "done" | "failed";
  detail: string;
  /** The run's tokens and seconds when the step started, to count the step's own. */
  startTokens: number;
  startSeconds: number;
};

/** What the person waiting sees: the steps so far, how much the model has produced, and for how long. */
export type ProposalProgress = {
  steps: ProposalStep[];
  /** Streamed pieces across every call, about one token each. */
  tokens: number;
  seconds: number;
};

/** One call to the model while describing a deployment, for the console trace. */
type TraceAttempt = {
  step: string;
  answer: string;
  /** Why the answer was not taken: unparseable, a failed check, or the validator's errors. */
  problems: string[];
  tokens: number;
  seconds: number;
};

/**
 * A run in the console while developing: the request, each attempt's answer and
 * problems, and how it ended, to see where the model goes wrong.
 */
function logTrace(
  request: string,
  model: string,
  outcome: string,
  attempts: TraceAttempt[],
  ms: number,
  catalogue: { templates: CatalogueTemplate[]; gpus: GpuListing[]; jobs: CatalogueJobs; ollama: CatalogueOllamaModel[]; huggingFace: CatalogueHuggingFaceModel[] },
) {
  console.groupCollapsed(
    `[describe] ${outcome} · ${attempts.length} attempt(s) · ${Math.round(ms / 1000)}s · ${model} · "${request}"`,
  );
  // The catalogue as the model saw it, to reproduce a run.
  console.log("catalogue", JSON.stringify(catalogue));
  attempts.forEach((attempt, i) => {
    console.groupCollapsed(
      `${i + 1}. ${attempt.step}: ${attempt.problems.length ? `${attempt.problems.length} problem(s)` : "ok"} · ${attempt.tokens} tokens · ${attempt.seconds}s`,
    );
    if (attempt.problems.length) console.log("problems", attempt.problems);
    console.log("answer", attempt.answer);
    console.groupEnd();
  });
  console.groupEnd();
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/**
 * A deployment from a description, on Nosa's model through the sponsored playground
 * proxy (see runProposal), with the progress the person waiting sees.
 */
export const useDeployProposal = (templates: Ref<Template[]>, gpus: Ref<GpuListing[]>) => {
  const config = useRuntimeConfig().public;
  const apiBase = config.apiBase as string;
  const { models, loadingModels } = useLlmGateway();
  // Loaded on the first description, not with the page: only its persona's model is used.
  const nosa = useNosaTools();

  const model = computed(() => nosaRunModel(models.value, nosa.model.value));
  const catalogue = computed<CatalogueTemplate[]>(() =>
    templates.value.map((t) => ({
      id: String(t.id),
      name: t.name,
      category: t.category,
      // Templates rarely carry a description; the README's first paragraph says what they are.
      description: t.description || templateReadmeSnippet(t) || undefined,
      vramMb: requiredVramMb(t.jobDefinition),
      variants: (t.variants ?? []).map((v) => ({
        id: v.variant_id,
        name: v.name,
        vramMb: requiredVramMb(v.jobDefinition),
      })),
    })),
  );
  const jobs = computed<CatalogueJobs>(() =>
    Object.fromEntries(
      templates.value.flatMap((t) =>
        t.variants?.length
          ? t.variants.map((v) => [`${t.id}:${v.variant_id}`, v.jobDefinition])
          : t.jobDefinition
            ? [[String(t.id), t.jobDefinition]]
            : [],
      ),
    ),
  );
  const phase = ref<ProposalPhase>("idle");
  const progress = ref<ProposalProgress>({ steps: [], tokens: 0, seconds: 0 });
  const proposal = ref<DeployProposal | null>(null);
  const error = ref<string | null>(null);

  /** Starts a line in the progress log; `end` closes the open one. */
  function begin(label: string) {
    const { tokens, seconds } = progress.value;
    progress.value.steps.push({ label, state: "active", detail: "", startTokens: tokens, startSeconds: seconds });
  }
  /** A finished line that took no time of its own. */
  function note(label: string, state: "done" | "failed", detail = "") {
    begin(label);
    end(state, detail);
  }
  function end(state: "done" | "failed", detail = "", label?: string) {
    const step = progress.value.steps.at(-1);
    if (!step || step.state !== "active") return;
    step.state = state;
    step.detail = detail;
    if (label) step.label = label;
  }

  async function propose(request: string) {
    const text = request.trim();
    if (!text || phase.value !== "idle") return;
    proposal.value = null;
    error.value = null;
    // Busy while Nosa's persona loads, so the run uses the model admins chose.
    phase.value = "checking";
    if (nosa.enabled) await nosa.load();
    if (!model.value) {
      phase.value = "idle";
      error.value = "No model is available right now. Try again later.";
      return;
    }
    progress.value = { steps: [], tokens: 0, seconds: 0 };
    const started = Date.now();
    const clock = setInterval(() => {
      progress.value.seconds = Math.round((Date.now() - started) / 1000);
    }, 1000);
    const trace: TraceAttempt[] = [];
    let outcome = "failed";
    let ollama: CatalogueOllamaModel[] = [];
    let huggingFace: CatalogueHuggingFaceModel[] = [];
    try {
      [ollama, huggingFace] = await Promise.all([ollamaCatalogue(), huggingFaceCatalogue(text)]);
      const result = await runProposal(text, {
        templates: catalogue.value,
        gpus: gpus.value,
        jobs: jobs.value,
        ollama,
        huggingFace,
        async resolve(pick) {
          phase.value = "checking";
          const source = pick.kind === "ollama" ? "the Ollama library" : "Hugging Face";
          begin(`Looking up ${pick.model} on ${source}`);
          const resolved = await resolveModel(pick);
          // Its problems follow in the rejected step.
          end(resolved.template ? "done" : "failed");
          return resolved;
        },
        async ask(system, messages, step) {
          phase.value = "writing";
          begin(step);
          const attemptStarted = Date.now();
          const tokensBefore = progress.value.tokens;
          const answer = await streamAnswer(system, messages);
          const attempt: TraceAttempt = {
            step,
            answer,
            problems: [],
            tokens: progress.value.tokens - tokensBefore,
            seconds: Math.round((Date.now() - attemptStarted) / 1000),
          };
          trace.push(attempt);
          end("done", `${attempt.tokens.toLocaleString()} tokens · ${attempt.seconds}s`);
          return answer;
        },
        async validate(jobDefinition) {
          phase.value = "checking";
          begin("Checking the job definition");
          const { valid, errors } = await $fetch<{ valid: boolean; errors: string[] }>(
            `${apiBase}/deployments/validate`,
            { method: "POST", credentials: "include", body: { job_definition: jobDefinition } },
          );
          if (valid) end("done", "", "The job definition is valid");
          else end("failed", errors.join("; "), `The validator found ${plural(errors.length, "problem")}`);
          if (!valid) trace.at(-1)!.problems = errors;
          return valid ? [] : errors;
        },
        rejected(label, problems) {
          note(label, "failed", problems.join("; "));
          trace.at(-1)!.problems = problems;
        },
      });
      if (!result) {
        error.value = "Could not put together a deployment for that. Try describing it differently.";
        return;
      }
      if (result.kind === "template") note(`Picked ${result.templateId}`, "done");
      else if (result.template) note(`Picked ${result.template.quickStart?.model ?? result.model}`, "done");
      proposal.value = result;
      outcome = trace.some((attempt) => attempt.problems.length) ? "accepted after a fix" : "accepted";
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause);
      end("failed", error.value);
      outcome = `error: ${error.value}`;
    } finally {
      clearInterval(clock);
      phase.value = "idle";
      if (import.meta.dev) {
        logTrace(text, model.value, outcome, trace, Date.now() - started, {
          templates: catalogue.value,
          gpus: gpus.value,
          jobs: jobs.value,
          ollama,
          huggingFace,
        });
      }
    }
  }

  /** The top of the Ollama library with each size's VRAM need, for the prompt. */
  async function ollamaCatalogue(): Promise<CatalogueOllamaModel[]> {
    const library = await loadOllamaLibrary();
    return library.slice(0, OLLAMA_CATALOGUE_SIZE).map((m) => ({
      name: m.name,
      sizes: m.sizes.map((tag) => ({ tag, vramMb: ollamaVramMb(`${m.name}:${tag}`) })),
      capabilities: m.capabilities,
    }));
  }

  /** Hugging Face repos matching the request that the quick start can serve; none when the search fails. */
  async function huggingFaceCatalogue(request: string): Promise<CatalogueHuggingFaceModel[]> {
    const term = huggingFaceSearchTerm(request);
    if (!term) return [];
    const found = await searchHuggingFace(term).catch(() => []);
    return found.flatMap((m) => {
      const apps = huggingFaceApps(m);
      if (!apps.length) return [];
      return [{ id: m.id, apps, vramMb: huggingFaceVramMb(m, apps[0]!), gated: isGated(m) }];
    });
  }

  /** One answer, streamed so the token count shows the wait is moving. */
  async function streamAnswer(system: string, messages: ModelMessage[]): Promise<string> {
    const result = streamText({
      model: sponsoredProvider(apiBase).chatModel(model.value),
      system,
      messages,
      temperature: 0.2,
      // No reasoning: the catalogue precomputes VRAM fit and every answer is checked, so
      // it would add a long wait without changing the result.
      providerOptions: { nosana: { chat_template_kwargs: { enable_thinking: false } } },
      // A retry spends another request against the proxy's per-user limit.
      maxRetries: 0,
    });
    let answer = "";
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        answer += part.text;
        progress.value.tokens += 1;
      } else if (part.type === "error") {
        throw part.error;
      }
    }
    return answer;
  }

  function reset() {
    proposal.value = null;
    error.value = null;
    progress.value = { steps: [], tokens: 0, seconds: 0 };
  }

  return { model, loadingModels, phase, progress, proposal, error, propose, reset };
};
