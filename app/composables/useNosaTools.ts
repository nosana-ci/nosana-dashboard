import { computed, ref, shallowRef } from "vue";
import type { ToolSet } from "ai";
import { McpClient, mcpToolSet, type McpToolInfo } from "~/utils/mcpClient";

type Persona = { systemPrompt: string };

// Loaded once per page, when the playground opens.
const persona = ref<Persona | null>(null);
const accountTools = shallowRef<{ client: McpClient; tools: McpToolInfo[] } | null>(null);
const status = ref<"idle" | "loading" | "ready" | "error">("idle");
const error = ref<string | null>(null);

/**
 * The Nosana tools every playground model can call, and Nosa's prompt, all from
 * Nosa's backend with the dashboard session: the Nosana MCP server's tools, which act
 * on the user's account and search Nosana's knowledge base, and the prompt admins
 * edit. The browser holds no token for any of it.
 */
export const useNosaTools = () => {
  const config = useRuntimeConfig().public;
  const nosaUrl = ((config.nosaUrl as string | undefined) || "").replace(/\/$/, "");

  async function load() {
    if (!nosaUrl || status.value === "loading" || status.value === "ready") return;
    status.value = "loading";
    error.value = null;
    try {
      const client = new McpClient(`${nosaUrl}/dashboard/mcp`);
      const [profile, tools] = await Promise.all([
        $fetch<Persona>(`${nosaUrl}/dashboard/persona`, { credentials: "include" }),
        client.listTools(),
      ]);
      persona.value = profile;
      accountTools.value = { client, tools };
      status.value = "ready";
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause);
      status.value = "error";
    }
  }

  const system = computed(() => {
    if (!persona.value) return "";
    const today = new Date().toISOString().slice(0, 10);
    return `${persona.value.systemPrompt}\n\nToday's date: ${today}.`;
  });

  // Every tool, the knowledge base and official links included, comes from the
  // Nosana MCP server.
  const tools = computed<ToolSet>(() =>
    accountTools.value ? mcpToolSet(accountTools.value.client, accountTools.value.tools) : {},
  );

  return { enabled: !!nosaUrl, status, error, load, system, tools };
};
