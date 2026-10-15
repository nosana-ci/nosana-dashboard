export type Starter = { icon: string; title: string; text: string };

/** The empty chat's cards; every model can answer them with the Nosana tools. */
export const STARTERS: Starter[] = [
  {
    icon: "i-lucide-rocket",
    title: "Run a model",
    text: "Help me deploy an Ollama server with a small chat model on Nosana.",
  },
  {
    icon: "i-lucide-server",
    title: "My deployments",
    text: "Which of my deployments are running right now, and what do they cost per hour?",
  },
  {
    icon: "i-lucide-cpu",
    title: "Cheapest GPU",
    text: "Which Nosana GPU market is the cheapest per hour right now, and how many nodes does it have online?",
  },
  {
    icon: "i-lucide-book-open",
    title: "How does it work?",
    text: "How do Nosana deployments, jobs and markets fit together?",
  },
];
