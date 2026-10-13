import { computed, ref, shallowRef } from "vue";
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { McpClient, mcpToolSet, type McpToolInfo } from "~/utils/mcpClient";

type Persona = { systemPrompt: string; officialLinks: string };

const SOURCE_KINDS = ["markdown", "tsdoc", "idl", "discord-qa", "manual", "blog"] as const;

// Loaded once per page, the first time the playground runs as Nosa.
const persona = ref<Persona | null>(null);
const accountTools = shallowRef<{ client: McpClient; tools: McpToolInfo[] } | null>(null);
const status = ref<"idle" | "loading" | "ready" | "error">("idle");
const error = ref<string | null>(null);

/**
 * What the playground needs to run as Nosa, all from Nosa's backend with the
 * dashboard session: the prompt admins edit, the user's account through the Nosana
 * MCP server, Nosana's knowledge base and the official links. The browser holds no
 * token for any of it.
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

  const tools = computed<ToolSet>(() => {
    if (!persona.value || !accountTools.value) return {};
    const officialLinks = persona.value.officialLinks;
    return {
      ...mcpToolSet(accountTools.value.client, accountTools.value.tools),
      search_knowledge_base: tool({
        description:
          "Search Nosana's knowledge base: official documentation, the template catalogue, SDK reference, on-chain program interfaces, resolved community support cases and blog posts. Call it before any factual claim about Nosana features, templates, GPU or VRAM requirements, pricing, the SDK, or host and node problems. Results with a URL may be cited; those without are context only.",
        inputSchema: z.object({
          query: z.string().min(1).describe("A natural-language question; include error names verbatim"),
          source_kind: z
            .array(z.enum(SOURCE_KINDS))
            .optional()
            .describe("Narrow to these sources only if a broad search came back noisy"),
        }),
        execute: ({ query, source_kind }) =>
          $fetch(`${nosaUrl}/dashboard/knowledge/search`, {
            method: "POST",
            credentials: "include",
            body: { query, source_kind },
          }),
      }),
      get_official_links: tool({
        description:
          "Fetch the list of official Nosana links: website, socials, docs, dashboards and token details. Call it when the user asks for official links, socials, the token contract, dashboard URLs or contact details. Return only the links asked for, not the whole list, unless they ask for all of them.",
        inputSchema: z.object({}),
        execute: async () => ({ markdown: officialLinks }),
      }),
    };
  });

  return { enabled: !!nosaUrl, status, error, load, system, tools };
};
