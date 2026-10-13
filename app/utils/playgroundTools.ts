import { tool, type ToolSet } from "ai";
import { z } from "zod";

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
];

export const DEFAULT_TOOLS = TOOL_CATALOG.map((entry) => entry.id);

/** The tools the model may call, out of those switched on. */
export function buildTools(ids: string[], apiBase: string): ToolSet {
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
      description: "Evaluate an arithmetic expression exactly. Supports + - * / % ^ and parentheses.",
      inputSchema: z.object({
        expression: z.string().describe("Such as (12.5 * 4) ^ 2 / 3"),
      }),
      execute: async ({ expression }) => ({ expression, result: evaluate(expression) }),
    }),
    nosana_gpu_markets: tool({
      description:
        "List the GPU markets on Nosana with their hourly USD price and how many nodes are online. Use it for any question about GPU availability or cost on Nosana.",
      inputSchema: z.object({
        search: z.string().optional().describe("Filter by name, such as 4090 or H100"),
      }),
      execute: ({ search }) => fetchMarkets(apiBase, search),
    }),
  };
  return Object.fromEntries(ids.filter((id) => id in all).map((id) => [id, all[id]!]));
}

/** Arithmetic only: anything but numbers and operators is refused before it runs. */
function evaluate(expression: string): number {
  const source = expression.replace(/\^/g, "**").replace(/×/g, "*").replace(/÷/g, "/");
  if (!/^[\d\s+\-*/%().eE]+$/.test(source)) {
    throw new Error("Only numbers, + - * / % ^ and parentheses are supported.");
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
    .filter((market) => !needle || `${market.name} ${market.slug}`.toLowerCase().includes(needle))
    .slice(0, 30)
    .map((market) => ({
      name: market.name,
      type: market.type,
      // The price a job pays, network fee included.
      usdPerHour: Number(
        (market.usd_reward_per_hour * (1 + (market.network_fee_percentage ?? 10) / 100)).toFixed(3),
      ),
      nodesOnline: market.nodes?.length ?? 0,
    }));
}
