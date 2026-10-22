import { z } from "zod";
import type { Template, TemplateVariant } from "~/composables/useTemplates";
import type { GpuListing } from "~/composables/useNodeRequirements";

/**
 * What a description of a deployment resolves to: a template from the catalogue as it is
 * (with its variant), or a job: the closest template's job definition adapted to the
 * request, or one written from scratch when no template runs anything similar.
 */
export const PickSchema = z
  .object({
    kind: z.enum(["template", "job"]),
    /** The template to deploy, or for a job the template to adapt. */
    templateId: z.string().nullable().optional(),
    variantId: z.string().nullable().optional(),
    /** Only when the request names a GPU; otherwise the page recommends one. */
    gpuName: z.string().nullable().optional(),
    name: z.string().min(1).max(100),
    /** For the person deploying: what will run, in one or two sentences. */
    why: z.string().min(1),
  })
  .refine((p) => p.kind === "job" || !!p.templateId, {
    message: "a template proposal needs templateId",
  });

const JobSchema = z.object({
  jobDefinition: z.record(z.unknown()),
  /** Anything the person must fill in themselves, such as a token. */
  note: z.string().nullable().optional(),
});

export type DeployProposal = z.infer<typeof PickSchema> & {
  jobDefinition?: Record<string, unknown> | null;
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

const gb = (mb: number | null) => (mb === null ? "?" : `${Math.ceil(mb / 1024)} GB`);
const oneLine = (text: string | undefined, length: number) =>
  (text ?? "").replace(/\s+/g, " ").trim().slice(0, length);

/** The catalogue and the GPUs, compact enough to sit in the prompt. */
export function catalogueText(templates: CatalogueTemplate[], gpus: GpuListing[]): string {
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
  const gpuLines = gpus.map(
    (g) =>
      `- ${g.name} | ${g.vramGb} GB | ${g.usd ? `$${g.usd.min.toFixed(3)}/h` : "unpriced"} | ${g.available} hosts free`,
  );
  return `TEMPLATES (id | name | category | variants or VRAM | description)\n${templateLines.join("\n")}\n\nGPUS (name | VRAM | price | free hosts)\n${gpuLines.join("\n")}`;
}

export const PICK_SYSTEM = `You set up deployments on Nosana, a GPU network. From the user's request and the catalogue below it, choose one:

1. "template": a template that does what was asked as it is. For a template with variants, also choose the variant; for "small" or "cheap", the one with the least VRAM that does the job; for "best" or "strongest", the newest and largest model that fits. Templates whose category includes Ollama or vLLM are model servers with that model built in.
2. "job": when no template does it as it is, such as a model or image the catalogue does not have. Set templateId and variantId to the closest template to adapt: one running the same kind of software, such as a vLLM template for another model served with vLLM, or an Ollama template for another Ollama model. Set templateId to null only when no template runs anything similar. The job definition is written in the next step.

Set "gpuName" only when the request names a GPU, to a name from the GPU list; otherwise null, and the cheapest GPU that fits is chosen for the user. Give a short deployment "name". Write "why" for the person deploying, in one or two plain sentences: what will run, and anything they should know; not how you chose it.

Answer with one JSON object and nothing else:
{"kind": "template" | "job", "templateId": string | null, "variantId": string | null, "gpuName": string | null, "name": string, "why": string}`;

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

type Message = { role: "user" | "assistant"; content: string };

/** What a run needs from the page or the eval: the model, the validator, and the catalogue. */
export type ProposalHost = {
  templates: CatalogueTemplate[];
  gpus: GpuListing[];
  jobs: CatalogueJobs;
  /** One answer to the conversation so far; `step` names it for the progress log. */
  ask: (system: string, messages: Message[], step: string) => Promise<string>;
  /** The validator's objections to a job definition; none when it is valid. */
  validate: (jobDefinition: Record<string, unknown>) => Promise<string[]>;
  /** A check that failed between answers, for the progress log. */
  rejected: (label: string, problems: string[]) => void;
};

/**
 * A deployment from a description: the model picks a template, or the template to adapt;
 * for a job it then writes the definition from that template's, which the validator
 * checks. Each step gets one retry with the reasons; nothing unchecked comes back.
 */
export async function runProposal(request: string, host: ProposalHost): Promise<DeployProposal | null> {
  const pick = await pickStep(request, host);
  if (!pick || pick.kind === "template") return pick;
  return jobStep(request, pick, host);
}

async function pickStep(request: string, host: ProposalHost): Promise<DeployProposal | null> {
  const messages: Message[] = [
    { role: "user", content: proposalRequest(catalogueText(host.templates, host.gpus), request) },
  ];
  for (let attempt = 0; attempt < 2; attempt++) {
    const answer = await host.ask(PICK_SYSTEM, messages, attempt ? "Fixing the choice" : "Choosing from the catalogue");
    messages.push({ role: "assistant", content: answer });
    let problems: string[];
    let pick: DeployProposal | null = null;
    try {
      pick = parseProposal(answer);
      const known = !pick.templateId || host.templates.some((t) => t.id === pick!.templateId);
      problems = known
        ? [gpuFitProblem(pick, host.templates, host.gpus)].filter((p): p is string => !!p)
        : [`templateId "${pick.templateId}" is not in the catalogue`];
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
