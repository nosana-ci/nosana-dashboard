import { z } from "zod";
import type { Template, TemplateVariant } from "~/composables/useTemplates";
import type { GpuListing } from "~/composables/useNodeRequirements";
import {
  fetchHuggingFaceModel,
  huggingFaceApps,
  loadHuggingFaceTemplate,
  loadOllamaLibrary,
  loadOllamaTemplate,
  searchHuggingFace,
} from "./quickStart";

/**
 * What a description of a deployment resolves to: a template from the catalogue as it is
 * (with its variant), a model from the Ollama library or Hugging Face served the way the
 * quick start serves it, or a job: the closest template's job definition adapted to the
 * request, or one written from scratch when no template runs anything similar.
 */
export const PickSchema = z
  .object({
    kind: z.enum(["template", "ollama", "huggingface", "job"]),
    /** The template to deploy, or for a job the template to adapt. */
    templateId: z.string().nullable().optional(),
    variantId: z.string().nullable().optional(),
    /** For "ollama" a library "name:size", for "huggingface" a repo id. */
    model: z.string().nullable().optional(),
    /** How a Hugging Face model is served; the first runtime that can when null. */
    app: z.enum(["vllm", "sglang", "ollama"]).nullable().optional(),
    /** Only when the request names a GPU; otherwise the page recommends one. */
    gpuName: z.string().nullable().optional(),
    name: z.string().min(1).max(100),
    /** For the person deploying: what will run, in one or two sentences. */
    why: z.string().min(1),
  })
  .refine((p) => p.kind !== "template" || !!p.templateId, {
    message: "a template proposal needs templateId",
  })
  .refine((p) => (p.kind !== "ollama" && p.kind !== "huggingface") || !!p.model?.trim(), {
    message: "an ollama or huggingface proposal needs model",
  });

const JobSchema = z.object({
  jobDefinition: z.record(z.unknown()),
  /** Anything the person must fill in themselves, such as a token. */
  note: z.string().nullable().optional(),
});

export type DeployProposal = z.infer<typeof PickSchema> & {
  jobDefinition?: Record<string, unknown> | null;
  /** For an Ollama or Hugging Face model: the quick-start template that serves it. */
  template?: Template | null;
};

/** A proposal's template and variant, as the catalogue the page shows holds them. */
export function proposalTemplate(
  proposal: DeployProposal,
  templates: Template[],
): { template: Template; variant: TemplateVariant | null } | null {
  if (proposal.kind !== "template") return null;
  const template = templates.find((t) => String(t.id) === proposal.templateId);
  if (!template) return null;
  if (!template.variants?.length) return { template, variant: null };
  const variant =
    template.variants.find((v) => v.variant_id === proposal.variantId) ?? template.variants[0]!;
  return { template, variant };
}

/** A template as the prompt lists it: its variants, or its own VRAM need, in MB. */
export type CatalogueTemplate = {
  id: string;
  name: string;
  category: string;
  description?: string;
  vramMb: number | null;
  variants: { id: string; name: string; vramMb: number | null }[];
};

/** An Ollama library model as the prompt lists it: its sizes and their VRAM need, in MB. */
export type CatalogueOllamaModel = {
  name: string;
  sizes: { tag: string; vramMb: number | null }[];
  capabilities: string[];
};

/** A Hugging Face search result as the prompt lists it, with the runtimes that can serve it. */
export type CatalogueHuggingFaceModel = {
  id: string;
  apps: string[];
  vramMb: number | null;
  gated: boolean;
};

// Words that describe how to deploy rather than which model; searching for them finds forks named after them.
const SEARCH_FILLER = new Set(
  "a an the and or of to for in on with using via me i want need run deploy serve host hosting please can that which model models llm server api inference fast cheap best latest new gpu vram nvidia geforce rtx gtx vllm sglang ollama hugging face huggingface hf".split(
    " ",
  ),
);

/**
 * What to search Hugging Face for: a repo id the request names, or its words without the
 * ones about deploying and GPUs (such as "vllm" or "4090"). Empty when nothing is left.
 */
export function huggingFaceSearchTerm(request: string): string {
  const repo = request.match(/[\w.-]+\/[\w.-]+/)?.[0];
  if (repo) return repo;
  return request
    .toLowerCase()
    .split(/[^\w.-]+/)
    .filter((word) => word && !SEARCH_FILLER.has(word) && !/^[a-z]?\d{3,4}$/.test(word) && !/^\d+gb$/.test(word))
    .join(" ");
}

const gb = (mb: number | null) => (mb === null ? "?" : `${Math.ceil(mb / 1024)} GB`);
const oneLine = (text: string | undefined, length: number) =>
  (text ?? "").replace(/\s+/g, " ").trim().slice(0, length);

/** The catalogue and the GPUs, compact enough to sit in the prompt. */
export function catalogueText(
  templates: CatalogueTemplate[],
  gpus: GpuListing[],
  ollama: CatalogueOllamaModel[] = [],
  huggingFace: CatalogueHuggingFaceModel[] = [],
): string {
  // The smallest GPU that holds the need, worked out here: the model answers without
  // reasoning and compares VRAM unreliably.
  const vramGbs = [...new Set(gpus.map((g) => g.vramGb))].sort((a, b) => a - b);
  const need = (mb: number | null) => {
    if (mb === null || !vramGbs.length) return gb(mb);
    const smallest = vramGbs.find((vram) => vram * 1024 >= mb);
    return `${gb(mb)}, ${smallest ? `smallest GPU ${smallest} GB` : "more than any GPU"}`;
  };
  const templateLines = templates.map((t) => {
    const sizes = t.variants.length
      ? `variants: ${t.variants.map((v) => `${v.id}=${v.name} (${need(v.vramMb)})`).join(", ")}`
      : need(t.vramMb);
    return `- ${t.id} | ${t.name} | ${t.category} | ${sizes} | ${oneLine(t.description, 160)}`;
  });
  const ollamaLines = ollama.map((m) => {
    const sizes = m.sizes.length ? m.sizes.map((s) => `${s.tag} (${need(s.vramMb)})`).join(", ") : "one size";
    return `- ${m.name} | ${sizes} | ${m.capabilities.join(", ")}`;
  });
  const gpuLines = gpus.map(
    (g) =>
      `- ${g.name} | ${g.vramGb} GB | ${g.usd ? `$${g.usd.min.toFixed(3)}/h` : "unpriced"} | ${g.available} hosts free`,
  );
  const ollamaText = ollamaLines.length
    ? `\n\nOLLAMA LIBRARY, most pulled first (name | sizes | capabilities)\n${ollamaLines.join("\n")}`
    : "";
  const huggingFaceLines = huggingFace.map(
    (m) => `- ${m.id} | ${m.apps.join(", ")} | ${need(m.vramMb)}${m.gated ? " | gated" : ""}`,
  );
  const huggingFaceText = huggingFaceLines.length
    ? `\n\nHUGGING FACE, search results for the request, possibly unrelated to it (repo id | runtimes | VRAM)\n${huggingFaceLines.join("\n")}`
    : "";
  return `TEMPLATES (id | name | category | variants or VRAM | description)\n${templateLines.join("\n")}${ollamaText}${huggingFaceText}\n\nGPUS (name | VRAM | price | free hosts)\n${gpuLines.join("\n")}`;
}

export const PICK_SYSTEM = `You set up deployments on Nosana, a GPU network. From the user's request and the catalogue below it, choose one:

1. "ollama": a language model from the Ollama library list, when the request does not ask for another server such as vLLM. Set "model" to "name:size" with a size from its list, or just "name" when it has one size; for "small" or "cheap", the size with the least VRAM that does the job; for "best" or "strongest", the newest and largest model that fits.
2. "template": a template that does what was asked as it is, for what the Ollama library does not have, such as image generation or a model only a template serves. For a template with variants, also choose the variant, the way you would an Ollama size. Templates whose category includes Ollama or vLLM are model servers with that model built in.
3. "huggingface": a model from Hugging Face, when the request names a repo, asks for vLLM or SGLang, or wants a model neither the Ollama library nor the templates have. Set "model" to a repo id from the Hugging Face search results when one is the model asked for, otherwise the exact repo id, such as "Qwen/Qwen3-8B"; and "app" to "vllm" (the default), "sglang", or "ollama" for a GGUF repo.
4. "job": anything else no template does as it is, such as an image that is not a model server. Set templateId and variantId to the closest template to adapt: one running the same kind of software. Set templateId to null only when no template runs anything similar. The job definition is written in the next step.

Prefer them in that order: the Ollama library, then a template, then Hugging Face, then a job. Always check the Ollama library first: when it has the model asked for, even under a slightly different name (such as "clef-flash" for Clef Flash), choose it, not the same model from a template or Hugging Face. Leave "model" and "app" null unless the kind uses them.

Set "gpuName" only when the request names a GPU, to a name from the GPU list; otherwise null, and the cheapest GPU that fits is chosen for the user. Give a short deployment "name". Write "why" for the person deploying, in one or two plain sentences: what will run, and anything they should know; not how you chose it. Leave out VRAM, GPUs and sizes: the page shows those.

Answer with one JSON object and nothing else:
{"kind": "template" | "ollama" | "huggingface" | "job", "templateId": string | null, "variantId": string | null, "model": string | null, "app": "vllm" | "sglang" | "ollama" | null, "gpuName": string | null, "name": string, "why": string}`;

export const JOB_SYSTEM = `You write job definitions for Nosana, a GPU network. You get a request and, when there is one, the job definition of a tested template to start from.

With a template: change only what the request needs, such as the model it serves, the image tag, command arguments, environment, ports and vram_total_mb. Keep everything else as it is, including how the server is started and its health checks.

Without one: write it for a well-known public container image, in exactly this shape:
{"version": "0.1", "type": "container", "meta": {"trigger": "dashboard", "system_requirements": {"vram_total_mb": 8192}}, "ops": [{"type": "container/run", "id": "server", "args": {"image": "docker.io/org/image:tag", "gpu": true, "cmd": ["..."], "env": {"KEY": "value"}, "expose": [{"port": 8080, "health_checks": [{"type": "http", "method": "GET", "path": "/health", "expected_status": 200, "continuous": false}]}]}}]}
Every op has "type", "id" and "args" side by side; "image", "cmd", "gpu", "env" and "expose" go inside "args". Leave out cmd, env and health_checks when not needed, and set "gpu" to false for work without a GPU. "expose" is the port the service listens on; Nosana gives it a public HTTPS address.

Either way, set vram_total_mb to what the work needs: weights in GB are about the parameters in billions x 2 at 16-bit, x 0.6 at 4-bit, plus 20%. A model that needs a Hugging Face token to download (such as Meta's Llama) gets an "HF_TOKEN" env entry left empty, and a "note" telling the person to fill it in.

Answer with one JSON object and nothing else:
{"jobDefinition": object, "note": string | null}`;

/** The first message: the catalogue, then what the person asked for. */
export const proposalRequest = (catalogue: string, request: string) =>
  `${catalogue}\n\nREQUEST\n${request}`;

/** The JSON object in a model's answer, fenced or bare; throws with the reason when there is none. */
function answerJson<T>(text: string, schema: z.ZodType<T>): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1];
  const raw = fenced ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("The answer was not a JSON object.");
  }
  const result = schema.safeParse(json);
  if (!result.success) throw new Error(result.error.issues.map((i) => i.message).join("; "));
  return result.data;
}

/** The model's pick as a proposal; throws with the reason when it is not one. */
export const parseProposal = (text: string): DeployProposal => answerJson(text, PickSchema);

/**
 * Why a proposal does not fit the GPU it names, or null when it fits or names none:
 * the model picks variants larger than the card it was asked for.
 */
export function gpuFitProblem(
  proposal: DeployProposal,
  templates: CatalogueTemplate[],
  gpus: GpuListing[],
): string | null {
  if (!proposal.gpuName) return null;
  const gpu = gpus.find((g) => g.name === proposal.gpuName);
  if (!gpu) return `gpuName "${proposal.gpuName}" is not in the GPU list`;
  let needMb: number | null = null;
  if (proposal.kind === "template") {
    const template = templates.find((t) => t.id === proposal.templateId);
    const variant = template?.variants.find((v) => v.id === proposal.variantId) ?? template?.variants[0];
    needMb = variant ? variant.vramMb : (template?.vramMb ?? null);
  } else {
    // A job, or the job the quick start built for a model.
    const meta = proposal.jobDefinition?.meta as { system_requirements?: { vram_total_mb?: unknown } } | undefined;
    needMb = Number(meta?.system_requirements?.vram_total_mb) || null;
  }
  if (needMb === null || needMb <= gpu.vramGb * 1024) return null;
  return `this needs ${gb(needMb)} of VRAM but the ${gpu.name} has ${gpu.vramGb} GB; choose a variant that fits it, or a GPU with enough VRAM if the request allows`;
}

/** The follow-up that asks the model to fix what was wrong with its last answer. */
const retryPrompt = (problems: string[]) =>
  `That does not work:\n${problems.map((p) => `- ${p}`).join("\n")}\n\nFix exactly these problems and answer with the whole JSON object again.`;

/** The job definitions of the catalogue, keyed by template id, or "id:variant" for a variant. */
export type CatalogueJobs = Record<string, Record<string, unknown>>;

/** The job definition of a template's variant, or of its first variant when none is named. */
export function baseJob(
  jobs: CatalogueJobs,
  templateId: string,
  variantId?: string | null,
): Record<string, unknown> | null {
  const variant = Object.keys(jobs).find((key) => key.startsWith(`${templateId}:`));
  return jobs[`${templateId}:${variantId}`] ?? (variant ? jobs[variant]! : null) ?? jobs[templateId] ?? null;
}

/** The quick-start template serving a proposal's model, or why there is none. */
export type ResolvedModel = { template: Template | null; problems: string[] };

const unresolved = (problem: string): ResolvedModel => ({ template: null, problems: [problem] });

/**
 * The quick-start template for an "ollama" or "huggingface" proposal. The model names
 * repos from memory, so one Hugging Face does not have comes back with ones it does.
 */
export async function resolveModel(proposal: DeployProposal): Promise<ResolvedModel> {
  const model = proposal.model?.trim() ?? "";
  if (proposal.kind === "ollama") {
    const [name = model, tag] = model.split(":");
    const entry = (await loadOllamaLibrary()).find((m) => m.name === name);
    if (!entry) return unresolved(`"${name}" is not in the Ollama library`);
    // The model sometimes puts the size in variantId instead of the model's tag.
    const size = tag ?? (entry.sizes.includes(proposal.variantId ?? "") ? proposal.variantId : undefined);
    // A tag like "8b-q8_0" starts with the size.
    if (size && entry.sizes.length && !entry.sizes.includes(size.split("-")[0]!)) {
      return unresolved(`"${name}" has no size "${size}"; its sizes are ${entry.sizes.join(", ")}`);
    }
    if (!size && entry.sizes.length > 1) {
      return unresolved(
        `"${name}" comes in sizes ${entry.sizes.join(", ")}; set model to "${name}:<size>"`,
      );
    }
    return { template: await loadOllamaTemplate(size ? `${name}:${size}` : name), problems: [] };
  }
  const details = await fetchHuggingFaceModel(model).catch(() => null);
  if (!details) {
    const found = await searchHuggingFace(model.split("/").pop() ?? model).catch(() => []);
    const servable = found.filter((m) => huggingFaceApps(m).length).map((m) => m.id);
    return unresolved(
      `"${model}" is not on Hugging Face${servable.length ? `; repos that are: ${servable.join(", ")}` : ""}`,
    );
  }
  const apps = huggingFaceApps(details);
  if (!apps.length) {
    return unresolved(
      `${model} is not a chat model in safetensors or GGUF, so it cannot be served as "huggingface"; answer with kind "job" to write a job definition for it instead`,
    );
  }
  const app = proposal.app ?? apps[0]!;
  if (!apps.includes(app)) return unresolved(`${model} cannot be served with ${app}, only with ${apps.join(" or ")}`);
  return { template: await loadHuggingFaceTemplate(details, app), problems: [] };
}

type Message = { role: "user" | "assistant"; content: string };

/** What a run needs from the page or the eval: the model, the validator, and the catalogue. */
export type ProposalHost = {
  templates: CatalogueTemplate[];
  gpus: GpuListing[];
  jobs: CatalogueJobs;
  ollama: CatalogueOllamaModel[];
  huggingFace: CatalogueHuggingFaceModel[];
  /** The quick-start template for a model proposal; resolveModel, logged by the page. */
  resolve: (proposal: DeployProposal) => Promise<ResolvedModel>;
  /** One answer to the conversation so far; `step` names it for the progress log. */
  ask: (system: string, messages: Message[], step: string) => Promise<string>;
  /** The validator's objections to a job definition; none when it is valid. */
  validate: (jobDefinition: Record<string, unknown>) => Promise<string[]>;
  /** A check that failed between answers, for the progress log. */
  rejected: (label: string, problems: string[]) => void;
};

/**
 * A deployment from a description: the model picks a template, a registry model (built
 * as the quick start builds it), or the template to adapt; for a job it then writes the
 * definition from that template's, which the validator checks. Each step gets one retry
 * with the reasons; nothing unchecked comes back.
 */
export async function runProposal(request: string, host: ProposalHost): Promise<DeployProposal | null> {
  const pick = await pickStep(request, host);
  if (!pick || pick.kind !== "job") return pick;
  return jobStep(request, pick, host);
}

/** Whether the request names the GPU by its model number, such as "4090" or "A100". */
const namesGpu = (request: string, gpuName: string) =>
  gpuName
    .toLowerCase()
    .split(/\s+/)
    .some((word) => /\d/.test(word) && request.toLowerCase().includes(word));

/** What is wrong with a pick; a model pick gets its template and job on the way. */
async function pickProblems(request: string, pick: DeployProposal, host: ProposalHost): Promise<string[]> {
  // The model names a GPU for most requests, whatever the prompt says; keep only one the
  // request asked for. With no GPUs listed there is nothing to name.
  if (!host.gpus.length || (pick.gpuName && !namesGpu(request, pick.gpuName))) pick.gpuName = null;
  if (pick.kind === "ollama" || pick.kind === "huggingface") {
    const { template, problems } = await host.resolve(pick);
    if (!template) return problems;
    pick.template = template;
    pick.jobDefinition = template.jobDefinition as unknown as Record<string, unknown>;
  } else if (pick.templateId) {
    const template = host.templates.find((t) => t.id === pick.templateId);
    if (!template) return [`templateId "${pick.templateId}" is not in the catalogue`];
    // The catalogue lists variants as "id=name"; the model sometimes copies all of it.
    if (pick.variantId) pick.variantId = pick.variantId.split("=")[0]!.trim();
    if (pick.variantId && template.variants.length && !template.variants.some((v) => v.id === pick.variantId)) {
      return [
        `variantId "${pick.variantId}" is not a variant of ${template.id}; its variants are ${template.variants.map((v) => v.id).join(", ")}`,
      ];
    }
  }
  return [gpuFitProblem(pick, host.templates, host.gpus)].filter((p): p is string => !!p);
}

async function pickStep(request: string, host: ProposalHost): Promise<DeployProposal | null> {
  const messages: Message[] = [
    { role: "user", content: proposalRequest(catalogueText(host.templates, host.gpus, host.ollama, host.huggingFace), request) },
  ];
  for (let attempt = 0; attempt < 2; attempt++) {
    const answer = await host.ask(PICK_SYSTEM, messages, attempt ? "Fixing the choice" : "Choosing a model");
    messages.push({ role: "assistant", content: answer });
    let problems: string[];
    let pick: DeployProposal | null = null;
    try {
      pick = parseProposal(answer);
      problems = await pickProblems(request, pick, host);
    } catch (cause) {
      problems = [cause instanceof Error ? cause.message : String(cause)];
    }
    if (pick && !problems.length) return pick;
    host.rejected(pick ? "The choice does not work" : "The answer was not usable", problems);
    messages.push({ role: "user", content: retryPrompt(problems) });
  }
  return null;
}

async function jobStep(request: string, pick: DeployProposal, host: ProposalHost): Promise<DeployProposal | null> {
  const base = pick.templateId ? baseJob(host.jobs, pick.templateId, pick.variantId) : null;
  const start = base
    ? `TEMPLATE TO ADAPT: ${pick.templateId}${pick.variantId ? ` (${pick.variantId})` : ""}\n${JSON.stringify(base)}`
    : "No template to start from.";
  const messages: Message[] = [{ role: "user", content: `REQUEST\n${request}\n\n${start}` }];
  const label = base ? `Adapting ${pick.templateId}` : "Writing a job definition";
  for (let attempt = 0; attempt < 2; attempt++) {
    const answer = await host.ask(JOB_SYSTEM, messages, attempt ? "Fixing the job definition" : label);
    messages.push({ role: "assistant", content: answer });
    let problems: string[];
    let job: z.infer<typeof JobSchema> | null = null;
    try {
      job = answerJson(answer, JobSchema);
    } catch (cause) {
      problems = [cause instanceof Error ? cause.message : String(cause)];
    }
    if (job) {
      const proposal: DeployProposal = {
        ...pick,
        jobDefinition: job.jobDefinition,
        why: job.note ? `${pick.why} ${job.note}` : pick.why,
      };
      problems = await host.validate(job.jobDefinition);
      const misfit = problems.length ? null : gpuFitProblem(proposal, host.templates, host.gpus);
      if (misfit) {
        problems = [misfit];
        host.rejected(`Does not fit the ${pick.gpuName}`, problems);
      }
      if (!problems.length) return proposal;
    } else {
      host.rejected("The answer was not usable", problems!);
    }
    messages.push({ role: "user", content: retryPrompt(problems!) });
  }
  return null;
}
