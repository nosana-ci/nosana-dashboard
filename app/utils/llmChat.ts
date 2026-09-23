import type { JobDefinition } from "@nosana/kit";

/**
 * Chat with a job's model, from the browser, over the OpenAI-compatible API.
 * vLLM, SGLang, TGI, llama.cpp and Ollama all serve `/v1/chat/completions`,
 * so there is one code path for every server.
 */

/** An exposed port the job definition marks as a chat-completions server. */
export type ChatEndpointCandidate = {
  opId: string;
  port: number;
  /** The model its health check asks for, when it names one. */
  model: string | null;
  /** Headers the health check sends, such as an API key. */
  headers: Record<string, string>;
};

export type ChatTurn = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** What one streamed chunk adds to the reply. */
export type ChatDelta = {
  content: string;
  reasoning: string;
  usage: { completionTokens: number } | null;
};

const CHAT_PATH = /\/v1\/chat\/completions\b|\/api\/chat\b/;

const parseBody = (body: unknown): Record<string, unknown> | null => {
  if (body && typeof body === "object") return body as Record<string, unknown>;
  if (typeof body !== "string") return null;
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const toArgv = (cmd: unknown): string[] =>
  Array.isArray(cmd)
    ? cmd.filter((arg): arg is string => typeof arg === "string")
    : typeof cmd === "string"
      ? cmd.trim().split(/\s+/)
      : [];

/**
 * A vLLM server started with an API key. Its chat routes need the key, so its
 * health check usually targets the open `/health` instead of a chat request,
 * and only the command line says it serves a model.
 */
function keyedVllm(
  args: Record<string, unknown>,
): { port: number; model: string | null } | null {
  if (!/vllm/i.test(String(args.image ?? ""))) return null;
  const argv = toArgv(args.cmd);
  const flag = (name: string): string | undefined => {
    const i = argv.findIndex((a) => a === name || a.startsWith(`${name}=`));
    if (i === -1) return undefined;
    return argv[i]!.startsWith(`${name}=`)
      ? argv[i]!.slice(name.length + 1)
      : (argv[i + 1] ?? "");
  };
  const env = (args.env ?? {}) as Record<string, unknown>;
  if (flag("--api-key") === undefined && !env.VLLM_API_KEY) return null;

  const port = Number(flag("--port") || 8000);
  const exposed = (Array.isArray(args.expose) ? args.expose : [args.expose]).map(
    (entry) => (entry && typeof entry === "object" ? (entry as { port?: unknown }).port : entry),
  );
  if (!exposed.includes(port)) return null;

  // `vllm serve <model>` takes the model first; older images take --model.
  const positional = argv.filter((a) => a !== "vllm" && a !== "serve")[0];
  const model =
    flag("--served-model-name") ||
    flag("--model") ||
    (positional && !positional.startsWith("-") ? positional : null);
  return { port, model: model ?? null };
}

/**
 * A port counts as a chat server when its HTTP health check POSTs a chat
 * request (a body with `model` and `messages`) or targets a chat path. That is
 * how every LLM template in the registry proves its model is up. A vLLM server
 * started with `--api-key` counts too, whatever its health check.
 */
export function findChatEndpoints(
  definition: JobDefinition | null | undefined,
): ChatEndpointCandidate[] {
  const found: ChatEndpointCandidate[] = [];
  for (const op of definition?.ops ?? []) {
    if (op.type !== "container/run") continue;
    const args = op.args as unknown as Record<string, unknown>;
    const before = found.length;
    const expose = args.expose;

    for (const entry of Array.isArray(expose) ? expose : []) {
      if (!entry || typeof entry !== "object" || !("port" in entry)) continue;
      const { port, health_checks } = entry as {
        port: unknown;
        health_checks?: Array<Record<string, unknown>>;
      };
      if (typeof port !== "number") continue;

      for (const check of health_checks ?? []) {
        if (check.type !== "http") continue;
        const body = parseBody(check.body);
        const isChatBody =
          !!body && !!body.model && Array.isArray(body.messages);
        const isChatPath =
          typeof check.path === "string" && CHAT_PATH.test(check.path);
        if (!isChatBody && !isChatPath) continue;

        found.push({
          opId: op.id,
          port,
          model: typeof body?.model === "string" ? body.model : null,
          headers: (check.headers as Record<string, string>) ?? {},
        });
        break;
      }
    }

    if (found.length === before) {
      const keyed = keyedVllm(args);
      if (keyed) found.push({ opId: op.id, ...keyed, headers: {} });
    }
  }
  return found;
}

const OPEN = "<think>";
const CLOSE = "</think>";

/**
 * Splits a reply into its reasoning and its answer. Reasoning models write it
 * inline as `<think>…</think>`; some chat templates open the tag in the prompt,
 * so the reply only carries the closing tag. `thinking` is true while the
 * block is still open.
 */
export function splitReasoning(text: string): {
  reasoning: string;
  answer: string;
  thinking: boolean;
} {
  const open = text.indexOf(OPEN);
  const close = text.indexOf(CLOSE);

  if (close === -1) {
    if (open === -1) return { reasoning: "", answer: text.trim(), thinking: false };
    return {
      reasoning: text.slice(open + OPEN.length).trim(),
      answer: text.slice(0, open).trim(),
      thinking: true,
    };
  }

  const opened = open !== -1 && open < close;
  return {
    reasoning: text.slice(opened ? open + OPEN.length : 0, close).trim(),
    answer: ((opened ? text.slice(0, open) : "") + text.slice(close + CLOSE.length)).trim(),
    thinking: false,
  };
}

/**
 * Parses one server-sent-events line of a streamed completion. Returns null
 * for anything that carries no data (blank lines, comments, keep-alives),
 * "done" for the terminator. Reasoning comes as `reasoning_content` from vLLM
 * and SGLang, `reasoning` from Ollama and newer vLLM.
 */
export function parseStreamLine(line: string): ChatDelta | "done" | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const data = trimmed.slice(5).trim();
  if (data === "[DONE]") return "done";

  let chunk: {
    choices?: Array<{
      delta?: { content?: string | null; reasoning_content?: string | null; reasoning?: string | null };
    }>;
    usage?: { completion_tokens?: number } | null;
  };
  try {
    chunk = JSON.parse(data);
  } catch {
    return null;
  }

  const delta = chunk.choices?.[0]?.delta;
  return {
    content: delta?.content ?? "",
    reasoning: delta?.reasoning_content ?? delta?.reasoning ?? "",
    usage:
      typeof chunk.usage?.completion_tokens === "number"
        ? { completionTokens: chunk.usage.completion_tokens }
        : null,
  };
}

/**
 * The most recent turns that fit in `maxChars`, oldest dropped first. The
 * newest turn is always kept, however long.
 */
export function trimHistory(turns: ChatTurn[], maxChars: number): ChatTurn[] {
  const kept: ChatTurn[] = [];
  let used = 0;
  for (let i = turns.length - 1; i >= 0; i--) {
    used += turns[i]!.content.length;
    if (kept.length > 0 && used > maxChars) break;
    kept.unshift(turns[i]!);
  }
  return kept;
}

/** Where a conversation is kept in localStorage, per job or deployment. */
export const chatHistoryKey = (sessionKey: string) =>
  `nosana-chat-history:${sessionKey}`;

/**
 * Where an API key the reader entered is kept: sessionStorage, so it lasts
 * for the browser tab and is never saved with the conversation.
 */
export const chatKeyStorageKey = (sessionKey: string) =>
  `nosana-chat-key:${sessionKey}`;

/** Whether this browser holds a conversation for the job or deployment. */
export function hasChatHistory(sessionKey: string): boolean {
  try {
    const raw = localStorage.getItem(chatHistoryKey(sessionKey));
    return !!raw && raw !== "[]";
  } catch {
    return false;
  }
}

export class ChatRequestError extends Error {
  /** The HTTP status the endpoint answered with, 0 when it didn't answer. */
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

/**
 * Streams a chat completion, calling `onDelta` for each chunk. Beyond
 * Content-Type it sends only the headers the job's own health check uses, so
 * the node's proxy has the simplest possible CORS preflight to answer.
 */
export async function streamChat(
  url: string,
  body: {
    model: string;
    messages: ChatTurn[];
    temperature: number;
    max_tokens: number;
  },
  onDelta: (delta: ChatDelta) => void,
  signal: AbortSignal,
  headers: Record<string, string> = {},
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${url.replace(/\/+$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        stream: true,
        stream_options: { include_usage: true },
      }),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new ChatRequestError(
      "Couldn't reach the endpoint. The job may be restarting, or its server refused a request from the browser.",
    );
  }

  if (!response.ok || !response.body) {
    let detail = "";
    try {
      const text = await response.text();
      const error = parseBody(text)?.error as { message?: string } | string | undefined;
      detail = typeof error === "string" ? error : (error?.message ?? text.slice(0, 200));
    } catch {
      /* no body */
    }
    throw new ChatRequestError(
      `The endpoint answered ${response.status}${detail ? `: ${detail}` : "."}`,
      response.status,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const parsed = parseStreamLine(line);
      if (parsed === "done") return;
      if (parsed) onDelta(parsed);
    }
  }
}
