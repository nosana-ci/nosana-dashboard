export type Starter = { icon: string; kicker: string; title: string; text: string };

/** The empty chat's cards; they lean on the built-in tools for live numbers. */
export const STARTERS: Starter[] = [
  {
    icon: "i-lucide-cpu",
    kicker: "Markets",
    title: "Cheapest GPU",
    text: "Which Nosana GPU market is the cheapest per hour right now, and how many nodes does it have online?",
  },
  {
    icon: "i-lucide-calculator",
    kicker: "Cost",
    title: "Price a run",
    text: "What would a 72-hour job cost on the cheapest Nosana market with an RTX 4090? Show the sum.",
  },
  {
    icon: "i-lucide-gauge",
    kicker: "Sizing",
    title: "Pick a GPU",
    text: "How much VRAM does a 70B model need at 16-bit, 8-bit and 4-bit, and which Nosana GPU markets could run the 4-bit version?",
  },
  {
    icon: "i-lucide-table",
    kicker: "Compare",
    title: "Compare markets",
    text: "Make a table of the five cheapest Nosana GPU markets with their hourly price, the price for a full day and the nodes online.",
  },
];

/** The cards when the playground runs as Nosa. */
export const NOSA_STARTERS: Starter[] = [
  {
    icon: "i-lucide-server",
    kicker: "Your account",
    title: "My deployments",
    text: "Which of my deployments are running right now, and what do they cost per hour?",
  },
  {
    icon: "i-lucide-cpu",
    kicker: "Markets",
    title: "Cheapest GPU",
    text: "Which Nosana GPU market is the cheapest per hour right now, and how many nodes does it have online?",
  },
  {
    icon: "i-lucide-rocket",
    kicker: "Deploy",
    title: "Run a model",
    text: "Help me deploy an Ollama server with a small chat model on Nosana.",
  },
  {
    icon: "i-lucide-book-open",
    kicker: "Docs",
    title: "How does it work?",
    text: "How do Nosana deployments, jobs and markets fit together?",
  },
];
