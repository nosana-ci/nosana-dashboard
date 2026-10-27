// Quick start: deploy a model straight from its registry.
//
// The deploy page's quick start searches a model registry (the Ollama library,
// Hugging Face) and turns the chosen model into a template-shaped workload, so
// the rest of the create flow treats it like any template. The registries are
// read from the browser: Hugging Face's API allows that, ollama.com's does
// not, so its library is a snapshot (see scripts/fetch-ollama-library.mjs).
import type { JobDefinition } from "@nosana/kit";
import type { Template, TemplateVariant } from "~/composables/useTemplates";
import type { OllamaLibraryModel } from "./ollamaLibrary";

export type QuickStartSource = "ollama" | "huggingface";
/** How a Hugging Face model is served; the Ollama library always runs on Ollama. */
export type QuickStartApp = "vllm" | "sglang" | "ollama";

export interface QuickStartSelection {
  source: QuickStartSource;
  /** "qwen3:8b" for Ollama, "Qwen/Qwen3-8B" for Hugging Face. */
  model: string;
  app?: QuickStartApp;
}

/** What a quick-start template was built from, kept to rebuild it for another variant. */
export interface QuickStart extends QuickStartSelection {
  /** The hub's record of a Hugging Face model. */
  details?: HuggingFaceModel;
  /** The model card or readme, as markdown. */
  card?: string;
  /** A token for a gated Hugging Face repo, put in the job's HF_TOKEN. */
  token?: string;
}

export interface QuickStartSourceInfo {
  id: QuickStartSource;
  name: string;
  /** The small label above the name on its tile. */
  label: string;
  logo: string;
  /** The brand colour, for the tile's glow. */
  accent: string;
  blurb: string;
  placeholder: string;
}

export const QUICK_START_SOURCES: QuickStartSourceInfo[] = [
  {
    id: "ollama",
    name: "Ollama",
    label: "Model library",
    logo: "https://ollama.com/public/ollama.png",
    accent: "#10e80c",
    blurb: "Any model from the Ollama library, served on the Ollama API.",
    placeholder: "Search the Ollama library, or type a model like qwen3:8b",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    label: "Model hub",
    logo: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg",
    accent: "#ffd21e",
    blurb: "Any chat model from the Hub, served with vLLM, SGLang or Ollama.",
    placeholder: "Search Hugging Face models, e.g. Qwen/Qwen3-8B",
  },
];

export const QUICK_START_APPS: Record<
  QuickStartApp,
  { name: string; blurb: string; port: number }
> = {
  vllm: {
    name: "vLLM",
    blurb: "OpenAI-compatible API, the fastest for most GPUs",
    port: 8000,
  },
  sglang: {
    name: "SGLang",
    blurb: "OpenAI-compatible API with structured output and prefix caching",
    port: 30000,
  },
  ollama: {
    name: "Ollama",
    blurb: "Runs the repo's GGUF weights on the Ollama API",
    port: 11434,
  },
};

const isSource = (value: unknown): value is QuickStartSource =>
  QUICK_START_SOURCES.some((source) => source.id === value);
const isApp = (value: unknown): value is QuickStartApp =>
  typeof value === "string" && value in QUICK_START_APPS;

// Pinned like the templates are; bump together with them.
const OLLAMA_IMAGE = "docker.io/ollama/ollama:0.40.2";
const VLLM_IMAGE = "docker.io/vllm/vllm-openai:v0.31.0";
const SGLANG_IMAGE = "docker.io/lmsysorg/sglang:v0.5.21";
// Caps the KV cache so a long-context model fits the recommended GPU.
const CONTEXT_LENGTH = "16384";
const MIN_VRAM_GB = 4;
// Weights plus room for the KV cache and activations.
const VRAM_OVERHEAD = 1.25;
const GB = 1024 ** 3;
export const TOKEN_PLACEHOLDER = "<your-hf-token>";

const httpHealth = (path: string, port: number) => ({
  port,
  health_checks: [
    {
      type: "http" as const,
      method: "GET" as const,
      path,
      expected_status: 200,
      continuous: false,
    },
  ],
});

const withRequirements = (
  job: JobDefinition,
  vramMb: number | null,
): JobDefinition => ({
  ...job,
  meta: {
    trigger: "dashboard",
    ...(vramMb ? { system_requirements: { vram_total_mb: vramMb } } : {}),
  },
});

/** "8.2B" / "350M": a parameter count the way model cards write it. */
export const formatParams = (params: number): string =>
  params >= 1e9
    ? `${(params / 1e9).toFixed(params >= 1e11 ? 0 : 1)}B`
    : `${Math.round(params / 1e6)}M`;

/** "9.8M" / "12k": a download or like count. */
export const formatCount = (count: number): string =>
  count >= 1e6
    ? `${(count / 1e6).toFixed(1)}M`
    : count >= 1e3
      ? `${(count / 1e3).toFixed(count >= 1e4 ? 0 : 1)}k`
      : String(count);

/** The GPU memory to ask for, in MB, from a parameter count and bytes per parameter. */
const estimateVramMb = (
  params: number | null,
  bytesPerParam: number,
): number | null => {
  if (!params) return null;
  const gb = Math.ceil((params * bytesPerParam * VRAM_OVERHEAD) / GB);
  return Math.max(gb, MIN_VRAM_GB) * 1024;
};

/* ---------- Ollama ---------- */

const OLLAMA_LIMIT = 8;
// Ollama's weights are Q4_K_M by default: just under 5 bits a parameter.
const OLLAMA_BYTES_PER_PARAM = 0.6;

/** "name" or "name:tag", the way Ollama names a model. */
export const isOllamaModelRef = (value: string): boolean =>
  /^[a-z0-9][\w.-]*(?::[\w.-]+)?$/i.test(value.trim());

// The snapshot is about 60 KB, so it loads on first use rather than with the page.
// A failed load is forgotten, so the next use tries again.
let libraryRequest: Promise<OllamaLibraryModel[]> | null = null;
export const loadOllamaLibrary = (): Promise<OllamaLibraryModel[]> =>
  (libraryRequest ??= import("./ollamaLibrary").then(
    (module) => module.OLLAMA_LIBRARY,
    (error) => {
      libraryRequest = null;
      throw error;
    },
  ));

/** The library models matching the term, most pulled first; the top of the library with no term. */
export const searchOllamaLibrary = (
  library: OllamaLibraryModel[],
  term: string,
): OllamaLibraryModel[] => {
  const needle = term.trim().toLowerCase().split(":")[0] ?? "";
  if (!needle) return library.slice(0, OLLAMA_LIMIT);
  const byName = library.filter((model) =>
    model.name.toLowerCase().includes(needle),
  );
  const byDescription = library.filter(
    (model) =>
      !byName.includes(model) &&
      model.description.toLowerCase().includes(needle),
  );
  return [...byName, ...byDescription].slice(0, OLLAMA_LIMIT);
};

/** The parameter count a size tag names: "8b" → 8e9, "2x7b" → 14e9, "335m" → 335e6, "e4b" → 8e9. */
export const ollamaSizeParams = (size: string): number | null => {
  const match = /^(?:(\d+)x|(e))?([\d.]+)([bm])$/i.exec(size.trim());
  if (!match) return null;
  const [, experts, effective, count, unit] = match;
  const scale = unit!.toLowerCase() === "b" ? 1e9 : 1e6;
  // An "effective" size (e4b) holds about twice that in weights.
  const factor = experts ? Number(experts) : effective ? 2 : 1;
  return Number(count) * scale * factor;
};

/** The GPU memory an Ollama model needs, from the size in its tag; null without one. */
export const ollamaVramMb = (model: string): number | null => {
  const tag = model.split(":")[1];
  // A tag like "8b-q8_0" carries the size first.
  const size = tag?.split("-")[0] ?? "";
  return estimateVramMb(ollamaSizeParams(size), OLLAMA_BYTES_PER_PARAM);
};

/** The model's readme from the library snapshot (see scripts/fetch-ollama-library.mjs), or "". */
export const fetchOllamaReadme = async (
  model: string,
  signal?: AbortSignal,
): Promise<string> => {
  const name = model.split(":")[0] ?? model;
  const response = await fetch(
    `/quickstart/ollama/${encodeURIComponent(name)}.md`,
    { signal },
  );
  // A missing file comes back as the app's page on some hosts.
  const isHtml = response.headers.get("content-type")?.includes("text/html");
  if (!response.ok || isHtml) return "";
  return (await response.text()).trim();
};

/** The job serving a model on Ollama, which pulls it as a resource. */
export const ollamaJob = (
  model: string,
  vramMb: number | null,
): JobDefinition =>
  withRequirements(
    {
      version: "0.1",
      type: "container",
      global: { variables: { MODEL: model } },
      ops: [
        {
          type: "container/run",
          id: "server",
          args: {
            gpu: true,
            image: OLLAMA_IMAGE,
            expose: [httpHealth("/api/tags", QUICK_START_APPS.ollama.port)],
            resources: [
              { type: "Ollama", model: "%%global.variables.MODEL%%" },
            ],
          },
        },
      ],
    },
    vramMb,
  );

/* ---------- Hugging Face ---------- */

export interface HuggingFaceModel {
  id: string;
  pipeline_tag?: string;
  library_name?: string;
  tags?: string[];
  gated?: boolean | string;
  downloads?: number;
  likes?: number;
  safetensors?: { total?: number };
  gguf?: { total?: number };
}

const HF_API = "https://huggingface.co/api/models";
const HF_FIELDS = [
  "gated",
  "safetensors",
  "gguf",
  "library_name",
  "downloads",
  "likes",
  "pipeline_tag",
  "tags",
];
const HF_LIMIT = 8;
// What the runtimes here serve: chat and vision-chat models.
const LLM_PIPELINES = new Set(["text-generation", "image-text-to-text"]);

const hfQuery = (params: Record<string, string>): string => {
  const query = new URLSearchParams(params);
  for (const field of HF_FIELDS) query.append("expand[]", field);
  return `${HF_API}?${query}`;
};

const hfFetch = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Hugging Face answered ${response.status}`);
  return response.json() as Promise<T>;
};

/** Models matching the term, most downloaded first; the most liked chat models with no term. */
export const searchHuggingFace = (
  term: string,
  signal?: AbortSignal,
): Promise<HuggingFaceModel[]> => {
  const search = term.trim();
  const url = search
    ? hfQuery({
        search,
        limit: String(HF_LIMIT),
        sort: "downloads",
        direction: "-1",
      })
    : hfQuery({
        pipeline_tag: "text-generation",
        limit: String(HF_LIMIT),
        sort: "likes",
        direction: "-1",
      });
  return hfFetch<HuggingFaceModel[]>(url, signal);
};

/** One model by its repo id, for a quick-start link reopened later. */
export const fetchHuggingFaceModel = (
  id: string,
  signal?: AbortSignal,
): Promise<HuggingFaceModel> => {
  const query = new URLSearchParams();
  for (const field of HF_FIELDS) query.append("expand[]", field);
  return hfFetch<HuggingFaceModel>(`${HF_API}/${id}?${query}`, signal);
};

/**
 * A model card's markdown without its front matter and title: the deploy
 * page names the model and shows the card under its lead.
 */
export const huggingFaceCardBody = (markdown: string): string =>
  markdown
    .replace(/^\s*---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
    .replace(/^\s*#\s+[^\n]*\n/, "")
    .trim();

/** The model card (its README), or "" when the repo has none. */
export const fetchHuggingFaceReadme = async (
  id: string,
  signal?: AbortSignal,
): Promise<string> => {
  const response = await fetch(
    `https://huggingface.co/${id}/raw/main/README.md`,
    { signal },
  );
  if (response.status === 404) return "";
  if (!response.ok) throw new Error(`Hugging Face answered ${response.status}`);
  return huggingFaceCardBody(await response.text());
};

/** The runtimes that can serve the model, best first. */
export const huggingFaceApps = (model: HuggingFaceModel): QuickStartApp[] => {
  const tags = model.tags ?? [];
  const apps: QuickStartApp[] = [];
  if (
    tags.includes("safetensors") &&
    LLM_PIPELINES.has(model.pipeline_tag ?? "")
  )
    apps.push("vllm", "sglang");
  if (tags.includes("gguf")) apps.push("ollama");
  return apps;
};

export const huggingFaceParams = (model: HuggingFaceModel): number | null =>
  model.safetensors?.total ?? model.gguf?.total ?? null;

// How the weights are stored, from the repo's tags and name.
const bytesPerParam = (model: HuggingFaceModel, app: QuickStartApp): number => {
  if (app === "ollama" || !model.safetensors?.total)
    return OLLAMA_BYTES_PER_PARAM;
  const hints = [...(model.tags ?? []), model.id].join(" ").toLowerCase();
  if (/awq|gptq|int4|4bit|4-bit|nvfp4|bnb/.test(hints)) return 0.55;
  if (/fp8|int8|8bit|8-bit/.test(hints)) return 1;
  return 2;
};

export const huggingFaceVramMb = (
  model: HuggingFaceModel,
  app: QuickStartApp,
): number | null =>
  estimateVramMb(huggingFaceParams(model), bytesPerParam(model, app));

export const isGated = (model: HuggingFaceModel): boolean =>
  Boolean(model.gated);

/** Whether the runtime reads HF_TOKEN; Ollama pulls GGUF repos without one. */
export const takesToken = (app: QuickStartApp): boolean => app !== "ollama";

export const huggingFaceJob = (
  model: HuggingFaceModel,
  app: QuickStartApp,
  token = "",
): JobDefinition => {
  const vramMb = huggingFaceVramMb(model, app);
  if (app === "ollama") return ollamaJob(`hf.co/${model.id}`, vramMb);
  const serve =
    app === "vllm"
      ? {
          image: VLLM_IMAGE,
          cmd: [model.id, "--port", "8000", "--max-model-len", CONTEXT_LENGTH],
        }
      : {
          image: SGLANG_IMAGE,
          cmd: [
            "python3",
            "-m",
            "sglang.launch_server",
            "--model-path",
            model.id,
            "--host",
            "0.0.0.0",
            "--port",
            "30000",
            "--context-length",
            CONTEXT_LENGTH,
          ],
        };
  // A gated repo needs a token; without one the placeholder marks where it goes.
  const env = isGated(model)
    ? { env: { HF_TOKEN: token.trim() || TOKEN_PLACEHOLDER } }
    : {};
  return withRequirements(
    {
      version: "0.1",
      type: "container",
      ops: [
        {
          type: "container/run",
          id: "server",
          args: {
            gpu: true,
            ...serve,
            ...env,
            expose: [httpHealth("/health", QUICK_START_APPS[app].port)],
          },
        },
      ],
    },
    vramMb,
  );
};

/* ---------- The template the create flow works with ---------- */

export const quickStartId = (selection: QuickStartSelection): string =>
  ["quickstart", selection.source, selection.app, selection.model]
    .filter(Boolean)
    .join(":");

/** The selection a quick-start id names, or null for any other id. */
export const parseQuickStartId = (id: string): QuickStartSelection | null => {
  const [prefix, source, ...rest] = id.split(":");
  if (prefix !== "quickstart") return null;
  if (source === "ollama" && rest.length)
    return { source, model: rest.join(":") };
  const [app, ...model] = rest;
  if (source === "huggingface" && isApp(app) && model.length)
    return { source, model: model.join(":"), app };
  return null;
};

const sourceInfo = (source: QuickStartSource): QuickStartSourceInfo =>
  QUICK_START_SOURCES.find((candidate) => candidate.id === source)!;

// A template flattened onto the chosen variant, the way the gallery does it,
// keeping the parent's description.
const flattened = (
  parent: Template,
  variants: TemplateVariant[],
  variant: TemplateVariant,
): Template => ({
  ...parent,
  id: variant.id,
  name: `${parent.name} - ${variant.name}`,
  jobDefinition: variant.jobDefinition,
  variants,
  selectedVariant: variant,
});

/**
 * An Ollama model as a template. A library model's sizes are its variants:
 * the tag's one, or the first without a tag. A tag the library does not
 * list, or a model it does not know, is served as typed.
 */
export const ollamaTemplate = (
  model: string,
  library: OllamaLibraryModel[],
  card = "",
): Template => {
  const [name = model, tag] = model.split(":");
  const listed = library.find((entry) => entry.name === name)?.sizes ?? [];
  // ollama.com lists only effective sizes (e4b) for some models whose untagged
  // model is something else (nemotron-3.5-bolt: 74B); keep that reachable.
  const sizes =
    listed.length && listed.every((size) => size.startsWith("e"))
      ? ["latest", ...listed]
      : listed;
  const variants: TemplateVariant[] = sizes.map((size) => ({
    id: quickStartId({ source: "ollama", model: `${name}:${size}` }),
    variant_id: size,
    name: size,
    jobDefinition: ollamaJob(
      `${name}:${size}`,
      ollamaVramMb(`${name}:${size}`),
    ),
  }));
  const variant = tag
    ? variants.find((candidate) => candidate.variant_id === tag)
    : variants[0];
  const served = variant ? `${name}:${variant.variant_id}` : model;
  const parent: Template = {
    id: quickStartId({ source: "ollama", model: served }),
    name: variant ? name : model,
    description: `${served} from the Ollama library, served on the Ollama API.`,
    category: "Ollama|LLM",
    icon: sourceInfo("ollama").logo,
    readme: [
      `# ${served}`,
      `Pulls \`${served}\` from [ollama.com](https://ollama.com/library/${name}) and serves it on port ${QUICK_START_APPS.ollama.port}: the Ollama API, with OpenAI-compatible chat at \`/v1/chat/completions\`.`,
      `Once the deployment is running, call it with \`"model": "${served}"\`.`,
      card,
    ]
      .filter(Boolean)
      .join("\n\n"),
    jobDefinition: ollamaJob(served, ollamaVramMb(served)),
    quickStart: { source: "ollama", model: served, card },
  };
  return variant && variants.length > 1
    ? flattened(parent, variants, variant)
    : parent;
};

/**
 * A Hugging Face model served with the chosen runtime, as a template. The
 * runtimes that can serve it are its variants. The model card, when fetched,
 * follows the lines on how it is served.
 */
export const huggingFaceTemplate = (
  model: HuggingFaceModel,
  app: QuickStartApp,
  card = "",
  token = "",
): Template => {
  const selection: QuickStartSelection = {
    source: "huggingface",
    model: model.id,
    app,
  };
  const runtime = QUICK_START_APPS[app];
  const served = app === "ollama" ? `hf.co/${model.id}` : model.id;
  const gated =
    isGated(model) && takesToken(app) && !token.trim()
      ? " This repo is gated: put a Hugging Face token that has accepted its terms in the job's HF_TOKEN before deploying."
      : "";
  const variants: TemplateVariant[] = huggingFaceApps(model).map(
    (candidate) => ({
      id: quickStartId({ ...selection, app: candidate }),
      variant_id: candidate,
      name: QUICK_START_APPS[candidate].name,
      description: QUICK_START_APPS[candidate].blurb,
      jobDefinition: huggingFaceJob(model, candidate, token),
    }),
  );
  const parent: Template = {
    id: quickStartId(selection),
    name: model.id.split("/").pop() ?? model.id,
    description: `${model.id} from Hugging Face, served with ${runtime.name}.${gated}`,
    category: `Hugging Face|LLM|${runtime.name}`,
    icon: sourceInfo("huggingface").logo,
    readme: [
      `# ${model.id}`,
      `Serves [${model.id}](https://huggingface.co/${model.id}) with ${runtime.name} on port ${runtime.port}, an OpenAI-compatible API at \`/v1/chat/completions\`.`,
      `Once the deployment is running, call it with \`"model": "${served}"\`.`,
      card,
    ]
      .filter(Boolean)
      .join("\n\n"),
    jobDefinition: huggingFaceJob(model, app, token),
    quickStart: { ...selection, details: model, card, token },
  };
  const variant = variants.find((candidate) => candidate.variant_id === app);
  return variant && variants.length > 1
    ? flattened(parent, variants, variant)
    : parent;
};

/** The quick-start template rebuilt for one of its variants, or null when it is not one. */
export const quickStartWithVariant = async (
  current: Template,
  variant: TemplateVariant,
): Promise<Template | null> => {
  const selection = parseQuickStartId(variant.id);
  const quickStart = current.quickStart;
  if (!selection || !quickStart) return null;
  if (selection.source === "ollama")
    return ollamaTemplate(
      selection.model,
      await loadOllamaLibrary(),
      quickStart.card,
    );
  return quickStart.details
    ? huggingFaceTemplate(
        quickStart.details,
        selection.app!,
        quickStart.card,
        quickStart.token,
      )
    : null;
};

/* ---------- Loading a quick start ---------- */

/** An Ollama model as a template, with its readme from the snapshot when there is one. */
export const loadOllamaTemplate = async (model: string): Promise<Template> => {
  const [library, card] = await Promise.all([
    loadOllamaLibrary(),
    fetchOllamaReadme(model).catch(() => ""),
  ]);
  return ollamaTemplate(model, library, card);
};

/**
 * A Hugging Face model served with the runtime, as a template, with its model
 * card when there is one. A repo id is looked up on the hub first; throws when
 * it cannot be, or when the runtime cannot serve it.
 */
export const loadHuggingFaceTemplate = async (
  model: HuggingFaceModel | string,
  app: QuickStartApp,
  token = "",
): Promise<Template> => {
  const id = typeof model === "string" ? model : model.id;
  const [details, card] = await Promise.all([
    typeof model === "string" ? fetchHuggingFaceModel(model) : model,
    fetchHuggingFaceReadme(id).catch(() => ""),
  ]);
  if (!huggingFaceApps(details).includes(app))
    throw new Error(`${id} cannot be served with ${QUICK_START_APPS[app].name}`);
  return huggingFaceTemplate(details, app, card, token);
};

/** The template a quick-start selection names, as a link to it rebuilds it. */
export const loadQuickStartTemplate = (
  selection: QuickStartSelection,
): Promise<Template> =>
  selection.source === "ollama"
    ? loadOllamaTemplate(selection.model)
    : loadHuggingFaceTemplate(selection.model, selection.app!);

/* ---------- The address of a quick-start page ---------- */

/** `?quickstart=huggingface&model=Qwen/Qwen3-8B&app=vllm`, so a reload keeps the page. */
export const quickStartQuery = (
  selection: QuickStartSelection,
): Record<string, string> => ({
  quickstart: selection.source,
  model: selection.model,
  ...(selection.app ? { app: selection.app } : {}),
});

export const parseQuickStartQuery = (
  query: Record<string, unknown>,
): QuickStartSelection | null => {
  const { quickstart: source, model, app } = query;
  if (!isSource(source) || typeof model !== "string" || !model) return null;
  if (source === "ollama") return { source, model };
  return isApp(app) ? { source, model, app } : null;
};
