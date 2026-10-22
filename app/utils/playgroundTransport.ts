import {
  convertToModelMessages,
  stepCountIs,
  type FinishReason,
  streamText,
  type ChatTransport,
  type ToolSet,
  type UIMessage,
} from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** Why a reply ended before the model finished its answer. */
export type StopCause = "step-limit" | "length" | "content-filter" | "error" | "other";

/** What a reply records about itself, kept with the chat. */
export type ReplyMetadata = {
  /** Seconds each reasoning step took, in the order they appear. */
  reasoningSeconds?: number[];
  /** Set only when the reply was cut short. */
  stopped?: { cause: StopCause; detail?: string };
};

export type PlaygroundRequest = {
  model: string;
  system?: string;
  temperature?: number;
  /** Tools the model may call; they run in the browser between steps. */
  tools?: ToolSet;
};

/**
 * The models through client-manager's sponsored playground proxy, with the dashboard
 * session: nobody needs an API key, and the proxy counts the requests.
 */
export function sponsoredProvider(apiBase: string) {
  return createOpenAICompatible({
    name: "nosana",
    baseURL: `${apiBase}/playground/v1`,
    includeUsage: true,
    fetch: (input, init) => fetch(input, { ...init, credentials: "include" }),
  });
}

/** A reply may call tools a few times over before it answers. */
export const MAX_STEPS = 20;

/** How much of the conversation the follow-up questions are drawn from. */
const SUGGEST_TURNS = 6;
const SUGGEST_CHARS = 6000;

const SUGGEST_SYSTEM =
  "Suggest three short follow-up questions the user might ask next, based on the conversation. Write them as the user would, one per line, each ending in a question mark, at most twelve words. No numbering, no other text.";

const TITLE_SYSTEM =
  "Write a title of two to six words for a conversation that starts with the user's message. Reply with the title only: no quotes, no full stop.";

/** Longer than this is not a title the chat list can show. */
const TITLE_CHARS = 60;

const textOf = (message: UIMessage) =>
  message.parts.map((part) => (part.type === "text" ? part.text : "")).join(" ").trim();

/**
 * `useChat` transport for the sponsored playground. The dashboard is a static site,
 * so the AI SDK runs the loop here, and each model call goes to client-manager's
 * playground proxy with the session cookie: the proxy holds the inference key, sets
 * the token limit and counts the requests.
 */
export class PlaygroundTransport implements ChatTransport<UIMessage> {
  private readonly provider;

  constructor(
    apiBase: string,
    private readonly request: () => PlaygroundRequest,
  ) {
    this.provider = sponsoredProvider(apiBase);
  }

  async sendMessages({
    messages,
    abortSignal,
  }: Parameters<ChatTransport<UIMessage>["sendMessages"]>[0]) {
    const { model, system, temperature, tools } = this.request();
    const result = streamText({
      model: this.provider.chatModel(model),
      system: system?.trim() || undefined,
      messages: await convertToModelMessages(messages),
      temperature,
      tools,
      stopWhen: stepCountIs(MAX_STEPS),
      // A retry spends another request against the proxy's per-user limit.
      maxRetries: 0,
      abortSignal,
    });
    // Timed here because the reply component only times what it watched stream live.
    const started = new Map<string, number>();
    const reasoningSeconds: number[] = [];
    let steps = 0;
    return result.toUIMessageStream({
      sendReasoning: true,
      onError: (error) => (error instanceof Error ? error.message : String(error)),
      messageMetadata: ({ part }): ReplyMetadata | undefined => {
        if (part.type === "reasoning-start") started.set(part.id, performance.now());
        if (part.type === "reasoning-end") {
          const start = started.get(part.id);
          if (start !== undefined)
            reasoningSeconds.push(Math.max(1, Math.round((performance.now() - start) / 1000)));
        }
        if (part.type === "finish-step") steps += 1;
        if (part.type === "finish")
          return { reasoningSeconds, stopped: stopCause(part.finishReason, part.rawFinishReason, steps) };
        return undefined;
      },
    });
  }

  async reconnectToStream() {
    return null;
  }

  /** A short name for a chat, from its first question. */
  async title(question: string, abortSignal?: AbortSignal): Promise<string> {
    const result = streamText({
      model: this.provider.chatModel(this.request().model),
      system: TITLE_SYSTEM,
      prompt: question.slice(0, SUGGEST_CHARS),
      maxRetries: 0,
      abortSignal,
    });
    const line = (await result.text).trim().split("\n")[0] ?? "";
    return line.replace(/^["'“”‘’]+|["'“”‘’.]+$/g, "").trim().slice(0, TITLE_CHARS);
  }

  /** Up to three questions the reader might ask next, from the latest turns. */
  async suggest(messages: UIMessage[], abortSignal: AbortSignal): Promise<string[]> {
    const transcript = messages
      .slice(-SUGGEST_TURNS)
      .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${textOf(message)}`)
      .join("\n\n")
      .slice(-SUGGEST_CHARS);
    const result = streamText({
      model: this.provider.chatModel(this.request().model),
      system: SUGGEST_SYSTEM,
      prompt: transcript,
      maxRetries: 0,
      abortSignal,
    });
    return (await result.text)
      .split("\n")
      .map((line) => line.replace(/^[\s\-*•\d.)]+/, "").trim())
      .filter((line) => line.endsWith("?") && line.length <= 120)
      .slice(0, 3);
  }
}

/**
 * A reply that ends on tool calls is either waiting for the reader's approval, which
 * resumes it, or out of steps; only the step count tells them apart.
 */
function stopCause(reason: FinishReason, raw: string | undefined, steps: number): ReplyMetadata["stopped"] {
  if (reason === "stop") return undefined;
  if (reason === "tool-calls") return steps >= MAX_STEPS ? { cause: "step-limit" } : undefined;
  return { cause: reason, detail: reason === "other" ? raw : undefined };
}
