import {
  convertToModelMessages,
  generateText,
  RetryError,
  stepCountIs,
  streamText,
  type ChatTransport,
  type ToolSet,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type ModelRequest = {
  /** The OpenAI-compatible base, up to and including `/v1`. */
  baseURL: string;
  /** The user's own Nosana API key; the gateway authenticates a Bearer token. */
  apiKey: string;
  model: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  /** Tools the model may call; they run in the browser between steps. */
  tools?: ToolSet;
  /** USD per token, from the catalog, to price the reply. */
  pricing?: { prompt: string; completion: string };
};

/** What a reply records about itself, shown under the message. */
export type ReplyStats = {
  model: string;
  /** Seconds to the first token. */
  ttft?: number;
  /** Seconds from the first token to the end. */
  duration?: number;
  inputTokens?: number;
  outputTokens?: number;
  /** What the reply cost at the catalog's prices. */
  costUsd?: number;
  finishReason?: string;
};

export type ModelUIMessage = UIMessage<ReplyStats>;

/** A reply that failed before anything arrived has no parts; it is not a turn. */
export const hasContent = (message: ModelUIMessage): boolean =>
  message.role !== "assistant" || message.parts.length > 0;

/** The gateway's own message, out from under the SDK's retry wrapper. */
function describe(error: unknown): string {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  return cause instanceof Error ? cause.message : String(cause);
}

/** A reply may call tools a few times over before it answers. */
const MAX_STEPS = 12;

/**
 * `useChat` transport that talks straight to an OpenAI-compatible endpoint from the
 * browser. The dashboard is a static site with no server of its own, so the AI SDK
 * runs the model call here, signed with the user's API key.
 */
export class ModelChatTransport implements ChatTransport<ModelUIMessage> {
  constructor(private readonly request: () => ModelRequest) {}

  async sendMessages({
    messages,
    abortSignal,
  }: Parameters<ChatTransport<ModelUIMessage>["sendMessages"]>[0]) {
    const {
      baseURL,
      apiKey,
      model,
      system,
      temperature,
      maxTokens,
      tools,
      pricing,
    } = this.request();
    const provider = createOpenAICompatible({
      name: "nosana",
      baseURL,
      apiKey,
      includeUsage: true,
    });
    const result = streamText({
      model: provider.chatModel(model),
      system: system?.trim() || undefined,
      messages: await convertToModelMessages(messages.filter(hasContent)),
      temperature,
      maxOutputTokens: maxTokens,
      tools,
      stopWhen: stepCountIs(MAX_STEPS),
      abortSignal,
    });
    return result
      .toUIMessageStream({
        sendReasoning: true,
        onError: describe,
        messageMetadata: ({ part }) => {
          if (part.type === "start") return { model };
          if (part.type === "finish") {
            const { inputTokens, outputTokens } = part.totalUsage;
            return {
              model,
              inputTokens,
              outputTokens,
              costUsd: pricing && cost(pricing, inputTokens, outputTokens),
              finishReason: part.finishReason,
            };
          }
        },
      })
      .pipeThrough(timing(model));
  }

  async reconnectToStream() {
    return null;
  }
}

const cost = (
  pricing: { prompt: string; completion: string },
  inputTokens = 0,
  outputTokens = 0,
): number =>
  inputTokens * Number(pricing.prompt) + outputTokens * Number(pricing.completion);

/** Measures the reply as it streams and folds the timings into its metadata. */
function timing(
  model: string,
): TransformStream<UIMessageChunk, UIMessageChunk> {
  const started = performance.now();
  let first = 0;
  return new TransformStream({
    transform(chunk, controller) {
      if (
        !first &&
        (chunk.type === "text-delta" ||
          chunk.type === "reasoning-delta" ||
          chunk.type === "tool-input-start")
      ) {
        first = performance.now();
      }
      if (chunk.type === "finish") {
        const now = performance.now();
        const stats: ReplyStats = {
          model,
          ...(chunk.messageMetadata as ReplyStats | undefined),
          ttft: first ? (first - started) / 1000 : undefined,
          duration: first ? (now - first) / 1000 : undefined,
        };
        controller.enqueue({ ...chunk, messageMetadata: stats });
        return;
      }
      controller.enqueue(chunk);
    },
  });
}

/** The chat's model as a bare language model, for calls outside the chat loop. */
export function languageModel(baseURL: string, apiKey: string, model: string) {
  return createOpenAICompatible({ name: "nosana", baseURL, apiKey }).chatModel(
    model,
  );
}

/**
 * Rewrites a draft into a clearer, more specific prompt, with the same model and
 * key the chat uses. One short, non-streamed call.
 */
export async function improvePrompt(
  request: ModelRequest,
  draft: string,
): Promise<string> {
  const provider = createOpenAICompatible({
    name: "nosana",
    baseURL: request.baseURL,
    apiKey: request.apiKey,
  });
  const { text } = await generateText({
    model: provider.chatModel(request.model),
    system:
      "You improve prompts for a large language model. Rewrite the user's draft so it is clear, specific and complete: state the goal, the context that matters, the format wanted and any constraints. Keep the user's intent and language. Reply with the improved prompt only, no preamble, no quotes.",
    prompt: draft,
    temperature: 0.3,
    // A reasoning model thinks before it writes, and the thinking counts.
    maxOutputTokens: 2500,
  });
  const improved = text.trim();
  if (!improved) throw new Error("The model sent nothing back; try again.");
  return improved;
}
