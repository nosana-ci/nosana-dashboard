import { dynamicTool, jsonSchema, type JSONSchema7, type ToolSet } from "ai";

/**
 * A small Model Context Protocol client over Streamable HTTP, enough to list a
 * server's tools and call them from the browser with the dashboard session cookie.
 * Nosa's /dashboard/mcp is stateless and answers plain JSON.
 */
export type McpToolInfo = {
  name: string;
  description?: string;
  inputSchema: JSONSchema7;
  annotations?: { readOnlyHint?: boolean };
};

type JsonRpcResponse = {
  result?: unknown;
  error?: { code: number; message: string };
};

export class McpClient {
  private nextId = 1;

  constructor(private readonly url: string) {}

  async listTools(): Promise<McpToolInfo[]> {
    const result = (await this.request("tools/list", {})) as { tools?: McpToolInfo[] };
    return result.tools ?? [];
  }

  async callTool(name: string, args: unknown): Promise<unknown> {
    const result = (await this.request("tools/call", { name, arguments: args ?? {} })) as {
      content?: { type: string; text?: string }[];
      isError?: boolean;
    };
    const text = (result.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("\n");
    if (result.isError) throw new Error(text || `${name} failed`);
    return text;
  }

  private async request(method: string, params: unknown): Promise<unknown> {
    const response = await fetch(this.url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: this.nextId++, method, params }),
    });
    if (!response.ok) throw new Error(`${method}: HTTP ${response.status}`);
    const message = (await response.json()) as JsonRpcResponse;
    if (message.error) throw new Error(message.error.message);
    return message.result;
  }
}

/**
 * A server's tools as AI SDK tools, called through the client. Only a tool the
 * server marks read-only runs without the reader's approval.
 */
export function mcpToolSet(client: McpClient, tools: McpToolInfo[]): ToolSet {
  return Object.fromEntries(
    tools.map((info) => [
      info.name,
      dynamicTool({
        description: info.description ?? info.name,
        inputSchema: jsonSchema(info.inputSchema ?? { type: "object" }),
        needsApproval: info.annotations?.readOnlyHint !== true,
        execute: (input) => client.callTool(info.name, input),
      }),
    ]),
  );
}
