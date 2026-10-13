import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type ChatTransport,
  type ToolSet,
  type UIMessage,
} from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type PlaygroundRequest = {
  model: string;
  system?: string;
  temperature?: number;
  /** Tools the model may call; they run in the browser between steps. */
  tools?: ToolSet;
};

/** A reply may call tools a few times over before it answers. */
const MAX_STEPS = 8;

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
    this.provider = createOpenAICompatible({
      name: "nosana",
      baseURL: `${apiBase}/playground/v1`,
      includeUsage: true,
      fetch: (input, init) => fetch(input, { ...init, credentials: "include" }),
    });
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
    return result.toUIMessageStream({
      sendReasoning: true,
      onError: (error) => (error instanceof Error ? error.message : String(error)),
    });
  }

  async reconnectToStream() {
    return null;
  }
}
