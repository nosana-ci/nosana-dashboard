export type Starter = { icon: string; title: string; text: string };

/** The empty chat's cards for a plain model, answered from what the model knows. */
export const STARTERS: Starter[] = [
  {
    icon: "i-lucide-gauge",
    title: "Pick a GPU",
    text: "How much VRAM does a 70B model need at 16-bit, 8-bit and 4-bit, and which GPUs could run each?",
  },
  {
    icon: "i-lucide-cpu",
    title: "How inference works",
    text: "Explain how a GPU runs a large language model, for someone who knows how a CPU works.",
  },
  {
    icon: "i-lucide-scale",
    title: "A100 or H100",
    text: "Compare the A100 and the H100 for serving LLMs: memory, throughput and when each is worth it.",
  },
  {
    icon: "i-lucide-file-code-2",
    title: "Serve with vLLM",
    text: "Write a Dockerfile that serves a model with vLLM's OpenAI-compatible server, and explain each line.",
  },
];

/** The cards when the playground runs as Nosa. */
export const NOSA_STARTERS: Starter[] = [
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
    icon: "i-lucide-rocket",
    title: "Run a model",
    text: "Help me deploy an Ollama server with a small chat model on Nosana.",
  },
  {
    icon: "i-lucide-book-open",
    title: "How does it work?",
    text: "How do Nosana deployments, jobs and markets fit together?",
  },
];
