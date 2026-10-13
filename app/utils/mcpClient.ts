import { dynamicTool, jsonSchema, type JSONSchema7, type ToolSet } from "ai";

/**
 * A small Model Context Protocol client over Streamable HTTP, enough to list a
 * server's tools and call them from the browser: JSON-RPC posts, answers as JSON
 * or as a server-sent event stream. The server has to allow cross-origin calls.
 */
export type McpToolInfo = {
  name: string;
  description?: string;
  inputSchema: JSONSchema7;
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
};

type JsonRpcResponse = {
  id?: number | string;
  result?: unknown;
  error?: { code: number; message: string };
};

const PROTOCOL = "2025-03-26";

/** The server wants a sign-in before it will talk. */
export class McpUnauthorized extends Error {
  constructor() {
    super("Sign in to use this server.");
    this.name = "McpUnauthorized";
  }
}

export class McpClient {
  private sessionId: string | null = null;
  private nextId = 1;
  serverName = "";

  constructor(
    private readonly url: string,
    /** Extra headers, or a function that makes them, for tokens that refresh. */
    private readonly headers:
      | Record<string, string>
      | (() => Promise<Record<string, string>>) = {},
    /** "include" sends the browser's cookies, for a server that knows the session. */
    private readonly credentials: RequestCredentials = "same-origin",
  ) {}

  async initialize(): Promise<{ name: string; version?: string }> {
    const result = (await this.request("initialize", {
      protocolVersion: PROTOCOL,
      capabilities: {},
      clientInfo: { name: "nosana-playground", version: "0.1" },
    })) as { serverInfo?: { name: string; version?: string } };
    await this.notify("notifications/initialized");
    this.serverName = result.serverInfo?.name ?? "";
    return result.serverInfo ?? { name: this.url };
  }

  async listTools(): Promise<McpToolInfo[]> {
    const result = (await this.request("tools/list", {})) as {
      tools?: McpToolInfo[];
    };
    return result.tools ?? [];
  }

  async callTool(name: string, args: unknown): Promise<unknown> {
    const result = (await this.request("tools/call", {
      name,
      arguments: args ?? {},
    })) as {
      content?: { type: string; text?: string; [key: string]: unknown }[];
      isError?: boolean;
      structuredContent?: unknown;
    };
    if (result.isError) {
      const text = result.content?.map((c) => c.text ?? "").join("\n");
      throw new Error(text || `${name} failed`);
    }
    if (result.structuredContent !== undefined) return result.structuredContent;
    const texts = (result.content ?? [])
      .filter((c) => c.type === "text" && typeof c.text === "string")
      .map((c) => c.text as string);
    return texts.length === 1 ? texts[0] : texts.length ? texts : result.content;
  }

  private async post(body: unknown): Promise<Response> {
    const extra =
      typeof this.headers === "function" ? await this.headers() : this.headers;
    const response = await fetch(this.url, {
      method: "POST",
      credentials: this.credentials,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...(this.sessionId ? { "Mcp-Session-Id": this.sessionId } : {}),
        ...extra,
      },
      body: JSON.stringify(body),
    });
    const session = response.headers.get("mcp-session-id");
    if (session) this.sessionId = session;
    return response;
  }

  private async notify(method: string) {
    await this.post({ jsonrpc: "2.0", method });
  }

  private async request(method: string, params: unknown): Promise<unknown> {
    const id = this.nextId++;
    const response = await this.post({ jsonrpc: "2.0", id, method, params });
    if (response.status === 401) throw new McpUnauthorized();
    if (!response.ok) {
      throw new Error(`${method}: HTTP ${response.status}`);
    }
    const type = response.headers.get("content-type") ?? "";
    const text = await response.text();
    const message = type.includes("text/event-stream")
      ? pickFromEvents(text, id)
      : (JSON.parse(text) as JsonRpcResponse);
    if (!message) throw new Error(`${method}: no response`);
    if (message.error) throw new Error(message.error.message);
    return message.result;
  }
}

/** The JSON-RPC reply with this id, out of an event stream's data lines. */
function pickFromEvents(stream: string, id: number): JsonRpcResponse | null {
  for (const block of stream.split(/\r?\n\r?\n/)) {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!data) continue;
    try {
      const parsed = JSON.parse(data) as JsonRpcResponse;
      if (parsed.id === id) return parsed;
    } catch {
      // Not JSON; keep looking.
    }
  }
  return null;
}

/** A server's tools as AI SDK tools, called through the client. */
export function mcpToolSet(
  client: McpClient,
  tools: McpToolInfo[],
  options: {
    prefix?: string;
    /** Tools the reader must approve before they run, such as anything that changes an account. */
    needsApproval?: (tool: McpToolInfo) => boolean;
  } = {},
): ToolSet {
  const prefix = options.prefix ?? "";
  return Object.fromEntries(
    tools.map((info) => [
      `${prefix}${info.name}`,
      dynamicTool({
        description: info.description ?? info.name,
        inputSchema: jsonSchema(info.inputSchema ?? { type: "object" }),
        needsApproval: options.needsApproval?.(info) ?? false,
        execute: (input) => client.callTool(info.name, input),
      }),
    ]),
  );
}

/** Only a tool its server marks read-only runs without the reader's approval. */
export const needsApproval = (tool: McpToolInfo) => tool.annotations?.readOnlyHint !== true;
