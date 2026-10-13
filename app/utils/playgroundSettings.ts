import type { ChatSettings } from "~/utils/llmChat";
import { DEFAULT_TOOLS } from "~/utils/playgroundTools";

/** What the reader can tune, kept in this browser. */
export type Persona = "default" | "nosa";

export type PlaygroundSettings = ChatSettings & {
  /** Ids from the tool catalog that the model may call. */
  tools: string[];
  /** "nosa" runs Nosa's own instructions and tools on the chosen model. */
  persona: Persona;
};

/** What Nosa needs on top of whatever else is switched on. */
export const NOSA_TOOLS = ["search_knowledge_base", "get_official_links"];

/** A max-tokens of 0 means the model's own limit. */
export const DEFAULT_SETTINGS: PlaygroundSettings = {
  systemPrompt: "",
  temperature: 0.7,
  maxTokens: 0,
  tools: DEFAULT_TOOLS,
  persona: "default",
};

/** Starting points, filled into the prompt from the sidebar or the palette. */
export const PROMPTS = [
  {
    label: "Explain this code",
    text: "Explain what this code does, step by step, and point out anything risky:\n\n```\n\n```",
  },
  {
    label: "Reasoning check",
    text: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost? Show your reasoning.",
  },
  {
    label: "Try the tools",
    text: "What time is it for me right now, and what is (1024 * 3.5) / 7?",
  },
  {
    label: "Cheapest GPU on Nosana",
    text: "Which Nosana GPU market is the cheapest per hour right now, and how many nodes does it have online?",
  },
  {
    label: "Summarise",
    text: "Summarise the following in three bullet points, then suggest one follow-up question:\n\n",
  },
];

/** The empty chat's cards: one per thing the playground can show off. */
export const STARTERS = [
  {
    icon: "i-lucide-wrench",
    kicker: "Tools",
    title: "Call the tools",
    text: "What time is it for me right now, and what is 17.5% of 2,480?",
  },
  {
    icon: "i-lucide-bot",
    kicker: "Sub-agents",
    title: "Spin up a team",
    text: "Use the delegate tool with three parallel sub-agents: one finds the cheapest Nosana GPU market per hour, one works out what 24 hours on the priciest market costs, one reports the current date and time. Then combine their findings.",
  },
  {
    icon: "i-lucide-brain",
    kicker: "Reasoning",
    title: "Watch it think",
    text: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost? Show your reasoning.",
  },
  {
    icon: "i-lucide-file-code-2",
    kicker: "Markdown · Code",
    title: "Rich markdown",
    text: "Write a Python function that reverses a linked list. Add a table of its time and space complexity, then a task list of edge cases to test.",
  },
];

/** The limit to send: the setting, capped at what the model can write. */
export const resolveMaxTokens = (
  settings: PlaygroundSettings,
  modelMax: number | undefined,
): number => {
  const cap = modelMax || 8192;
  return Math.min(settings.maxTokens || cap, cap);
};
