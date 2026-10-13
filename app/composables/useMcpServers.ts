import { computed, reactive } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { ToolSet } from "ai";
import {
  McpClient,
  McpUnauthorized,
  mcpToolSet,
  needsApproval,
  type McpToolInfo,
} from "~/utils/mcpClient";

export type McpServer = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  /** Ships with the playground: cannot be removed, acts with the dashboard session. */
  builtin?: boolean;
};

export type McpOptions = {
  /** Nosa's backend, which hands the Nosana MCP server the dashboard session. */
  nosaUrl?: string;
};

const NOSANA_ID = "nosana";

export type McpConnection = {
  status: "idle" | "connecting" | "ready" | "error" | "unauthorized";
  serverName?: string;
  tools: McpToolInfo[];
  error?: string;
  client?: McpClient;
};

const newId = () => Math.random().toString(36).slice(2, 10);

// Live connections are per page, not stored; the server list is.
const connections = reactive<Record<string, McpConnection>>({});
// Bearer tokens stay in memory, so a token typed in is gone on reload.
const tokens = reactive<Record<string, string>>({});

/** "getDeploymentsByDeploymentJobs" → "Get deployments jobs": the words, not the route. */
export function humanizeTool(name: string): string {
  const words = name
    .replace(/[-_]/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean);
  const kept: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (words[i]!.toLowerCase() === "by") {
      i++; // "By<Thing>" is the route parameter, not a word
      continue;
    }
    kept.push(words[i]!.toLowerCase());
  }
  const text = kept.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The resource a tool is about, from its second word: deployments, markets, … */
export function groupOfTool(name: string): string {
  const words = name.replace(/[-_]/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/\s+/);
  const word = (words[1] ?? words[0] ?? "other").toLowerCase();
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * The MCP servers whose tools the model can call: Nosana's, through Nosa with the
 * dashboard session so the browser holds no token, and the reader's own, added by
 * URL. A tool runs without asking only when its server marks it read-only.
 */
export const useMcpServers = (options: McpOptions = {}) => {
  const stored = useLocalStorage<McpServer[]>("playground-mcp-servers", []);
  const nosanaEnabled = useLocalStorage("playground-mcp-nosana", true);
  // Tools switched off per server, by name; everything else a server offers is on.
  const disabled = useLocalStorage<Record<string, string[]>>("playground-mcp-disabled", {});

  const isToolOn = (serverId: string, tool: string) =>
    !(disabled.value[serverId] ?? []).includes(tool);

  function toggleTool(serverId: string, tool: string, on: boolean) {
    const list = new Set(disabled.value[serverId] ?? []);
    if (on) list.delete(tool);
    else list.add(tool);
    disabled.value = { ...disabled.value, [serverId]: [...list] };
  }

  function toggleGroup(serverId: string, tools: string[], on: boolean) {
    const list = new Set(disabled.value[serverId] ?? []);
    for (const tool of tools) (on ? list.delete(tool) : list.add(tool));
    disabled.value = { ...disabled.value, [serverId]: [...list] };
  }

  // The Nosana server is always first, and never stored: its URL comes from the
  // environment.
  const servers = computed<McpServer[]>(() =>
    options.nosaUrl
      ? [
          {
            id: NOSANA_ID,
            name: "Nosana",
            url: `${options.nosaUrl}/dashboard/mcp`,
            enabled: nosanaEnabled.value,
            builtin: true,
          },
          ...stored.value,
        ]
      : stored.value,
  );

  function add(server: { name: string; url: string; token?: string }): McpServer {
    const entry: McpServer = { name: server.name, url: server.url, id: newId(), enabled: true };
    if (server.token) tokens[entry.id] = server.token;
    stored.value = [...stored.value, entry];
    void connect(entry.id);
    return entry;
  }

  function remove(id: string) {
    if (id === NOSANA_ID) return;
    stored.value = stored.value.filter((s) => s.id !== id);
    delete connections[id];
    delete tokens[id];
  }

  function toggle(id: string, enabled: boolean) {
    if (id === NOSANA_ID) nosanaEnabled.value = enabled;
    else {
      const server = stored.value.find((s) => s.id === id);
      if (server) server.enabled = enabled;
    }
    if (enabled && connections[id]?.status !== "ready") void connect(id);
  }

  /** A token for a server that asked for one, then a fresh connection. */
  function setToken(id: string, token: string) {
    tokens[id] = token;
    void connect(id);
  }

  async function connect(id: string) {
    const server = servers.value.find((s) => s.id === id);
    if (!server) return;
    connections[id] = { status: "connecting", tools: [] };
    try {
      const client = server.builtin
        ? new McpClient(server.url, {}, "include")
        : new McpClient(
            server.url,
            tokens[id] ? { Authorization: `Bearer ${tokens[id]}` } : {},
          );
      await client.initialize();
      const tools = await client.listTools();
      connections[id] = {
        status: "ready",
        serverName: client.serverName || server.name,
        tools,
        client,
      };
    } catch (cause) {
      connections[id] =
        cause instanceof McpUnauthorized
          ? { status: "unauthorized", tools: [] }
          : {
              status: "error",
              tools: [],
              error: cause instanceof Error ? cause.message : String(cause),
            };
    }
  }

  /** Connects the enabled servers that are not connected yet. */
  function connectAll() {
    for (const server of servers.value) {
      if (server.enabled && !connections[server.id]) void connect(server.id);
    }
  }

  /** Every enabled, connected server's tools, for the model. */
  const toolSet = computed<ToolSet>(() => {
    let set: ToolSet = {};
    for (const server of servers.value) {
      const connection = connections[server.id];
      if (!server.enabled || connection?.status !== "ready" || !connection.client)
        continue;
      const tools = connection.tools.filter((t) => isToolOn(server.id, t.name));
      set = { ...set, ...mcpToolSet(connection.client, tools, { needsApproval }) };
    }
    return set;
  });

  const connectionOf = (id: string): McpConnection =>
    connections[id] ?? { status: "idle", tools: [] };

  return {
    servers,
    add,
    remove,
    toggle,
    setToken,
    connect,
    connectAll,
    connectionOf,
    toolSet,
    isToolOn,
    toggleTool,
    toggleGroup,
  };
};
