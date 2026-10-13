import {
  stepCountIs,
  streamText,
  tool,
  type LanguageModel,
  type ToolSet,
} from "ai";
import { z } from "zod";
import type { KnowledgeHit } from "~/utils/knowledgeBase";

/** A tool the reader can switch on. Each one runs in the browser. */
export type PlaygroundTool = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export const TOOL_CATALOG: PlaygroundTool[] = [
  {
    id: "current_time",
    label: "Current time",
    description: "The date, time and time zone of this browser.",
    icon: "i-lucide-clock",
  },
  {
    id: "calculate",
    label: "Calculator",
    description: "Exact arithmetic instead of a guess.",
    icon: "i-lucide-calculator",
  },
  {
    id: "nosana_gpu_markets",
    label: "Nosana GPU markets",
    description: "GPU types, hourly prices and nodes online.",
    icon: "i-lucide-cpu",
  },
  {
    id: "delegate",
    label: "Sub-agent",
    description: "Hands a task to a second model loop, with your approval.",
    icon: "i-lucide-bot",
  },
  {
    id: "search_knowledge",
    label: "Knowledge base",
    description: "Searches the documents you added under Knowledge.",
    icon: "i-lucide-book-open",
  },
  {
    id: "search_knowledge_base",
    label: "Nosana docs",
    description: "Nosana's own knowledge base: docs, SDK, templates, support cases, blog.",
    icon: "i-lucide-library",
  },
  {
    id: "get_official_links",
    label: "Official links",
    description: "Nosana's official site, socials, docs and dashboards.",
    icon: "i-lucide-link-2",
  },
];

export const DEFAULT_TOOLS = TOOL_CATALOG.map((entry) => entry.id);

/** One sub-agent's state, as the card shows it. */
export type AgentProgress = {
  name: string;
  task: string;
  status: "thinking" | "tool" | "writing" | "done" | "failed";
  steps: { label: string; state: "running" | "done" }[];
  /** What it has written so far, then its result. */
  text: string;
  error?: string;
};

/** What the delegation reports back: every agent, live, then all of them done. */
export type DelegateProgress = {
  status: "working" | "done";
  agents: AgentProgress[];
};

export type ToolContext = {
  apiBase: string;
  /** The Nosa backend, which searches Nosana's knowledge base for signed-in users. */
  nosaUrl?: string;
  /** The official links markdown from Nosa's profile, once loaded. */
  officialLinks?: () => string | null;
  /** The chat's model, for the sub-agents' own loops. */
  model: () => LanguageModel;
  /** The reader's documents, when there are any. */
  knowledge?: {
    count: () => number;
    search: (query: string, limit: number) => Promise<KnowledgeHit[]>;
  };
};

const AGENT_NAMES = ["Scout", "Analyst", "Builder", "Critic", "Runner", "Scribe"];

const SUB_AGENT_SYSTEM =
  "You are a focused sub-agent working for another assistant. Complete the task you are given using your tools, then reply with a concise, well-organised result the main assistant can relay. Do not ask questions; make reasonable assumptions and state them.";

/** The tools the model may call, by name, out of those switched on. */
export function buildTools(ids: string[], context: ToolContext): ToolSet {
  const apiBase = context.apiBase;
  const all: ToolSet = {
    current_time: tool({
      description: "The current date and time where the user is.",
      inputSchema: z.object({}),
      execute: async () => {
        const now = new Date();
        return {
          iso: now.toISOString(),
          local: now.toLocaleString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      },
    }),
    calculate: tool({
      description:
        "Evaluate an arithmetic expression exactly. Supports + - * / % ^ and parentheses.",
      inputSchema: z.object({
        expression: z.string().describe("Such as (12.5 * 4) ^ 2 / 3"),
      }),
      execute: async ({ expression }) => ({
        expression,
        result: evaluate(expression),
      }),
    }),
    nosana_gpu_markets: tool({
      description:
        "List the GPU markets on Nosana with their hourly USD price and how many nodes are online. Use it for any question about GPU availability or cost on Nosana.",
      inputSchema: z.object({
        search: z
          .string()
          .optional()
          .describe("Filter by name, such as 4090 or H100"),
      }),
      execute: ({ search }) => fetchMarkets(apiBase, search),
    }),
    search_knowledge: tool({
      description:
        "Search the user's own documents for passages relevant to a question. Use it whenever the question could be answered from material they added, and quote what you find. Returns the best-matching passages with the document names.",
      inputSchema: z.object({
        query: z.string().describe("What to look for, in natural language"),
        limit: z.number().int().min(1).max(8).optional().describe("How many passages"),
      }),
      execute: async ({ query, limit }) => {
        const knowledge = context.knowledge;
        if (!knowledge || knowledge.count() === 0)
          return { passages: [], note: "The knowledge base is empty." };
        const hits = await knowledge.search(query, limit ?? 4);
        return {
          passages: hits.map((hit) => ({
            document: hit.name,
            text: hit.text,
            score: Number(hit.score.toFixed(3)),
          })),
        };
      },
    }),
    search_knowledge_base: tool({
      description:
        "Search Nosana's knowledge base: official documentation, the template catalogue, SDK reference, on-chain program interfaces, resolved community support cases and blog posts. Call it before any factual claim about Nosana features, templates, GPU or VRAM requirements, pricing, the SDK, or host and node problems. Results with a URL may be cited; those without are context only.",
      inputSchema: z.object({
        query: z.string().min(1).describe("A natural-language question; include error names verbatim"),
        source_kind: z
          .array(z.enum(["markdown", "tsdoc", "idl", "discord-qa", "manual", "blog"]))
          .optional()
          .describe("Narrow to these sources only if a broad search came back noisy"),
      }),
      execute: async ({ query, source_kind }) => {
        if (!context.nosaUrl) return { error: "Nosana's knowledge base is not configured here." };
        const response = await fetch(`${context.nosaUrl}/dashboard/knowledge/search`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, source_kind }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Knowledge search failed: HTTP ${response.status}`);
        }
        const { hits } = (await response.json()) as {
          hits: { title: string; url: string | null; source_kind: string; snippet: string; score: number }[];
        };
        return {
          results: hits.map((hit) => ({
            title: hit.title,
            source: hit.source_kind,
            url: hit.url ?? undefined,
            text: hit.snippet,
          })),
        };
      },
    }),
    get_official_links: tool({
      description:
        "Fetch the list of official Nosana links: website, socials, docs, dashboards and token details. Call it when the user asks for official links, socials, the token contract, dashboard URLs or contact details. Return only the links asked for, not the whole list, unless they ask for all of them.",
      inputSchema: z.object({}),
      execute: async () => {
        const markdown = context.officialLinks?.();
        if (!markdown) return { error: "The official links are not available here." };
        return { markdown };
      },
    }),
    delegate: tool({
      description:
        "Hand one or more self-contained sub-tasks to sub-agents that work on them in parallel with their own tools and report back. Split independent work into several tasks so they run at once. Use it for research or multi-step lookups rather than doing them inline. It costs extra credits, so the user approves it first.",
      inputSchema: z.object({
        tasks: z
          .array(
            z.string().describe("A sub-task, with all the context it needs"),
          )
          .min(1)
          .max(4)
          .describe("Independent sub-tasks; each gets its own agent"),
      }),
      needsApproval: true,
      // Runs every task at once; yields a snapshot each time any agent moves.
      execute: async function* ({ tasks }) {
        const workers = Object.fromEntries(
          Object.entries(all).filter(([name]) => name !== "delegate"),
        );
        const agents: AgentProgress[] = tasks.map((task, i) => ({
          name: AGENT_NAMES[i % AGENT_NAMES.length]!,
          task,
          status: "thinking",
          steps: [],
          text: "",
        }));
        const snapshot = (): DelegateProgress => ({
          status: agents.every((a) => a.status === "done" || a.status === "failed")
            ? "done"
            : "working",
          agents: agents.map((a) => ({ ...a, steps: a.steps.map((s) => ({ ...s })) })),
        });
        // Agents tick in the background; the generator wakes on every change.
        let wake: (() => void) | null = null;
        const changed = () => {
          wake?.();
          wake = null;
        };
        const runs = agents.map((agent) =>
          runAgent(agent, workers, context, changed).catch((cause) => {
            agent.status = "failed";
            agent.error = cause instanceof Error ? cause.message : String(cause);
            changed();
          }),
        );
        let settled = false;
        Promise.all(runs).then(() => {
          settled = true;
          changed();
        });
        yield snapshot();
        while (!settled) {
          await new Promise<void>((resolve) => (wake = resolve));
          yield snapshot();
        }
        yield snapshot();
      },
    }),
  };
  return Object.fromEntries(
    ids.filter((id) => id in all).map((id) => [id, all[id]!]),
  );
}

/** One agent's loop: tool calls become steps, its answer streams into `text`. */
async function runAgent(
  agent: AgentProgress,
  tools: ToolSet,
  context: ToolContext,
  changed: () => void,
) {
  const run = streamText({
    model: context.model(),
    system: SUB_AGENT_SYSTEM,
    prompt: agent.task,
    tools,
    stopWhen: stepCountIs(6),
    temperature: 0.3,
  });
  for await (const chunk of run.fullStream) {
    if (chunk.type === "tool-call") {
      const meta = TOOL_CATALOG.find((entry) => entry.id === chunk.toolName);
      const input = chunk.input as Record<string, unknown> | undefined;
      const detail =
        input && Object.values(input).find((v) => typeof v === "string");
      agent.steps.push({
        label: `${meta?.label ?? chunk.toolName}${detail ? `: ${detail}` : ""}`,
        state: "running",
      });
      agent.status = "tool";
    } else if (chunk.type === "tool-result") {
      const running = agent.steps.find((s) => s.state === "running");
      if (running) running.state = "done";
      agent.status = "thinking";
    } else if (chunk.type === "text-delta") {
      agent.text += chunk.text;
      agent.status = "writing";
    } else if (chunk.type === "error") {
      throw chunk.error instanceof Error
        ? chunk.error
        : new Error(String(chunk.error));
    } else {
      continue;
    }
    changed();
  }
  agent.text = agent.text.trim();
  agent.status = "done";
  changed();
}

/** Arithmetic only: anything but numbers and operators is refused before it runs. */
function evaluate(expression: string): number {
  const source = expression
    .replace(/\^/g, "**")
    .replace(/×/g, "*")
    .replace(/÷/g, "/");
  if (!/^[\d\s+\-*/%().eE]+$/.test(source)) {
    throw new Error(
      "Only numbers, + - * / % ^ and parentheses are supported.",
    );
  }
  const value = new Function(`"use strict"; return (${source});`)() as unknown;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("That does not evaluate to a number.");
  }
  return value;
}

type Market = {
  name: string;
  slug: string;
  type?: string;
  usd_reward_per_hour: number;
  network_fee_percentage?: number;
  nodes?: unknown[];
};

async function fetchMarkets(apiBase: string, search?: string) {
  const markets = await $fetch<Market[]>("/markets", { baseURL: apiBase });
  const needle = search?.trim().toLowerCase();
  return markets
    .filter(
      (market) =>
        !needle || `${market.name} ${market.slug}`.toLowerCase().includes(needle),
    )
    .slice(0, 30)
    .map((market) => ({
      name: market.name,
      type: market.type,
      // The price a job pays, network fee included.
      usdPerHour: Number(
        (
          market.usd_reward_per_hour *
          (1 + (market.network_fee_percentage ?? 10) / 100)
        ).toFixed(3),
      ),
      nodesOnline: market.nodes?.length ?? 0,
    }));
}
