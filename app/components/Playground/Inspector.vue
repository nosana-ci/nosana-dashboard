<template>
  <aside class="pg-inspector">
    <UTabs
      :items="TABS"
      variant="pill"
      color="neutral"
      size="sm"
      :ui="{ root: 'pg-tabs', list: 'pg-tabs-list', content: 'pg-tabs-body' }"
    >
      <template #settings>
        <template v-if="model">
          <h3 class="pg-model-name">{{ modelName(model) }}</h3>
          <dl class="pg-group pg-facts">
            <div v-for="fact in facts" :key="fact.label" class="pg-row">
              <dt>{{ fact.label }}</dt>
              <dd>{{ fact.value }}</dd>
            </div>
          </dl>
        </template>

        <template v-if="usage && usage.requests">
          <p class="pg-group-label">This chat</p>
          <dl class="pg-group pg-facts">
            <div class="pg-row">
              <dt>Replies</dt>
              <dd>{{ usage.requests }}</dd>
            </div>
            <div class="pg-row">
              <dt>Tokens in · out</dt>
              <dd>{{ usage.inputTokens.toLocaleString() }} · {{ usage.outputTokens.toLocaleString() }}</dd>
            </div>
            <div class="pg-row">
              <dt>Spent</dt>
              <dd>≈ {{ credits(usage.costUsd) }} credits</dd>
            </div>
          </dl>
          <div v-if="usage.tps.length > 1" class="pg-spark">
            <svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
              <polyline :points="sparkline" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
            </svg>
            <span class="pg-spark-label">
              {{ Math.round(usage.tps.at(-1)!) }} tok/s on the last reply ·
              {{ Math.round(Math.max(...usage.tps)) }} peak
            </span>
          </div>
        </template>

        <p class="pg-group-label">Persona</p>
        <div class="pg-group pg-fields">
          <UFormField
            label="Who the model is"
            size="sm"
            help="Nosa brings its own instructions, the Nosana docs and official links, and expects the Nosana MCP server to be connected."
            class="pg-row"
          >
            <USelect
              v-model="settings.persona"
              :items="PERSONAS"
              value-key="value"
              size="sm"
              class="w-full"
            />
          </UFormField>
          <template v-if="settings.persona === 'nosa'">
            <UCollapsible v-if="nosa?.profile.value" class="pg-add">
              <UButton
                label="Nosa's instructions"
                trailing-icon="i-lucide-chevron-down"
                color="neutral"
                variant="link"
                size="xs"
              />
              <template #content>
                <pre class="pg-prompt-preview">{{ nosa.profile.value.system }}</pre>
              </template>
            </UCollapsible>
          </template>
        </div>

        <p class="pg-group-label">Generation</p>
        <div class="pg-group pg-fields">
          <UFormField
            :label="settings.persona === 'nosa' ? 'Additional instructions' : 'System prompt'"
            size="sm"
            class="pg-row"
          >
            <UTextarea
              v-model="settings.systemPrompt"
              :rows="3"
              autoresize
              placeholder="You are a helpful assistant."
              class="w-full"
            />
          </UFormField>
          <UFormField
            :label="`Temperature · ${settings.temperature.toFixed(2)}`"
            size="sm"
            help="0 is deterministic; 1 and above gets creative."
            class="pg-row"
          >
            <USlider
              v-model="settings.temperature"
              :min="0"
              :max="2"
              :step="0.05"
            />
          </UFormField>
          <UFormField
            :label="`Max output tokens · ${maxTokens}`"
            size="sm"
            help="Reasoning counts against this limit."
            class="pg-row"
          >
            <USlider
              v-model="maxTokens"
              :min="64"
              :max="modelMax"
              :step="64"
            />
          </UFormField>
        </div>

        <p class="pg-group-label">Access</p>
        <div class="pg-group pg-fields">
          <UFormField
            label="API key override"
            size="sm"
            help="Used instead of the key selected under Code. Kept until you reload the page."
            class="pg-row"
          >
            <UInput
              v-model="customKey"
              type="password"
              placeholder="nos_…"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>

      <template #tools>
        <!-- Three sections, each headed and counted: what the model can call. -->
        <section class="pg-section">
          <header class="pg-section-head">
            <span class="pg-section-icon"><UIcon name="i-lucide-wrench" /></span>
            <div class="pg-section-titles">
              <h3 class="pg-section-title">Built-in tools</h3>
              <p class="pg-section-sub">Run in this browser when the model calls them.</p>
            </div>
            <span class="pg-section-chip">{{ settings.tools.length }} on</span>
          </header>
          <ul class="pg-group pg-tool-list">
            <li v-for="entry in TOOL_CATALOG" :key="entry.id" class="pg-row pg-tool">
              <span class="pg-tool-icon"><UIcon :name="entry.icon" /></span>
              <div class="pg-tool-text">
                <span class="pg-tool-name">{{ entry.label }}</span>
                <span class="pg-tool-desc">{{ entry.description }}</span>
              </div>
              <USwitch
                :model-value="settings.tools.includes(entry.id)"
                :aria-label="entry.label"
                @update:model-value="(on) => toggle(entry.id, on)"
              />
            </li>
          </ul>
        </section>

        <section class="pg-section">
          <header class="pg-section-head">
            <span class="pg-section-icon"><UIcon name="i-lucide-book-open" /></span>
            <div class="pg-section-titles">
              <h3 class="pg-section-title">Knowledge base</h3>
              <p class="pg-section-sub">
                Your documents, kept in this browser and searched by the model.
                <template v-if="knowledge?.semantic.value">Semantic search.</template>
                <template v-else>Lexical search until an embedding model is serving.</template>
              </p>
            </div>
            <span class="pg-section-chip">
              {{ knowledge?.docs.value.length ?? 0 }} doc{{ knowledge?.docs.value.length === 1 ? "" : "s" }}
            </span>
          </header>
          <ul v-if="knowledge?.docs.value.length" class="pg-group pg-tool-list">
            <li v-for="doc in knowledge.docs.value" :key="doc.id" class="pg-row pg-tool">
              <span class="pg-tool-icon"><UIcon name="i-lucide-file-text" /></span>
              <div class="pg-tool-text">
                <span class="pg-tool-name">{{ doc.name }}</span>
                <span class="pg-tool-desc">
                  {{ doc.chunks.length }} passage{{ doc.chunks.length === 1 ? "" : "s" }} ·
                  {{ doc.size.toLocaleString() }} characters
                  <template v-if="doc.chunks[0]?.vector"> · embedded</template>
                </span>
              </div>
              <UButton
                icon="i-lucide-trash-2"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Remove document"
                @click="knowledge.remove(doc.id)"
              />
            </li>
          </ul>
          <p v-else class="pg-section-empty">No documents yet.</p>
          <UCollapsible v-model:open="addDocOpen" class="pg-add">
            <UButton
              :label="addDocOpen ? 'Close' : 'Add a document'"
              :icon="addDocOpen ? 'i-lucide-minus' : 'i-lucide-plus'"
              color="neutral"
              variant="soft"
              size="xs"
              block
            />
            <template #content>
              <div class="pg-add-body pg-fields">
                <UFileUpload
                  v-model="files"
                  multiple
                  accept=".txt,.md,.markdown,.json,.csv,.yaml,.yml,.ts,.js,.py,.go,.rs,.html,.css,.sql,.toml"
                  label="Drop text files here"
                  description="Markdown, code, CSV, JSON…"
                  layout="list"
                  class="w-full"
                />
                <UFormField label="Or paste text" size="sm">
                  <UTextarea
                    v-model="pasteText"
                    :rows="4"
                    placeholder="Paste notes, docs, a README…"
                    class="w-full"
                  />
                </UFormField>
                <div class="pg-inline">
                  <UInput v-model="pasteName" placeholder="Name" size="sm" class="pg-grow" />
                  <UButton
                    label="Add"
                    size="sm"
                    :loading="knowledge?.busy.value"
                    :disabled="!files.length && !pasteText.trim()"
                    @click="addDocs"
                  />
                </div>
                <p v-if="knowledge?.error.value" class="pg-delegate-error">{{ knowledge.error.value }}</p>
              </div>
            </template>
          </UCollapsible>
        </section>

        <section class="pg-section">
          <header class="pg-section-head">
            <span class="pg-section-icon"><UIcon name="i-lucide-plug" /></span>
            <div class="pg-section-titles">
              <h3 class="pg-section-title">MCP servers</h3>
              <p class="pg-section-sub">
                Your own Model Context Protocol servers over HTTP; their tools join the set.
              </p>
            </div>
            <span class="pg-section-chip">{{ mcpSummary }}</span>
          </header>
          <ul v-if="mcp && mcp.servers.value.length" class="pg-group pg-tool-list">
            <li v-for="server in mcp.servers.value" :key="server.id" class="pg-row pg-server">
              <div class="pg-tool">
                <span class="pg-tool-icon" :data-status="mcp.connectionOf(server.id).status">
                  <UIcon name="i-lucide-server" />
                </span>
                <div class="pg-tool-text">
                  <span class="pg-tool-name">
                    {{ server.name || mcp.connectionOf(server.id).serverName || server.url }}
                    <span v-if="server.builtin" class="pg-tag">your session</span>
                  </span>
                  <span class="pg-tool-desc">
                    <template v-if="mcp.connectionOf(server.id).status === 'ready'">
                      {{ onCount(server.id) }} of {{ mcp.connectionOf(server.id).tools.length }} tools on
                    </template>
                    <template v-else-if="mcp.connectionOf(server.id).status === 'connecting'">Connecting…</template>
                    <template v-else-if="mcp.connectionOf(server.id).status === 'unauthorized'">
                      {{ server.builtin ? "Sign in to the dashboard to use your deployments, credits and jobs." : "This server wants a token." }}
                    </template>
                    <template v-else-if="mcp.connectionOf(server.id).status === 'error'">
                      {{ mcp.connectionOf(server.id).error }}
                    </template>
                    <template v-else>Not connected</template>
                  </span>
                </div>
                <UTooltip text="Reconnect">
                  <UButton
                    icon="i-lucide-refresh-cw"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Reconnect"
                    @click="mcp.connect(server.id)"
                  />
                </UTooltip>
                <USwitch
                  :model-value="server.enabled"
                  :aria-label="`Enable ${server.name}`"
                  @update:model-value="(on) => mcp?.toggle(server.id, on)"
                />
                <UButton
                  v-if="!server.builtin"
                  icon="i-lucide-trash-2"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  aria-label="Remove server"
                  @click="mcp.remove(server.id)"
                />
              </div>
              <div
                v-if="!server.builtin && mcp.connectionOf(server.id).status === 'unauthorized'"
                class="pg-inline"
              >
                <UInput
                  v-model="tokenDrafts[server.id]"
                  type="password"
                  placeholder="Bearer token"
                  size="sm"
                  autocomplete="off"
                  class="w-full"
                />
                <UButton
                  label="Connect"
                  size="sm"
                  :disabled="!tokenDrafts[server.id]?.trim()"
                  @click="submitToken(server.id)"
                />
              </div>
              <!-- The server's tools, by resource, each with its own switch. -->
              <UCollapsible
                v-if="mcp.connectionOf(server.id).status === 'ready'"
                v-model:open="openTools[server.id]"
                class="pg-server-tools"
              >
                <UButton
                  :label="openTools[server.id] ? 'Hide tools' : 'Choose tools'"
                  :trailing-icon="openTools[server.id] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  color="neutral"
                  variant="link"
                  size="xs"
                />
                <template #content>
                  <div class="pg-tool-groups">
                    <div v-for="group in groupsOf(server.id)" :key="group.name" class="pg-tool-group">
                      <header class="pg-tool-group-head">
                        <span class="pg-tool-group-name">{{ group.name }}</span>
                        <span class="pg-tool-group-count">{{ group.on }}/{{ group.tools.length }}</span>
                        <UButton
                          :label="group.on === group.tools.length ? 'None' : 'All'"
                          color="neutral"
                          variant="link"
                          size="xs"
                          @click="mcp.toggleGroup(server.id, group.tools.map((t) => t.name), group.on !== group.tools.length)"
                        />
                      </header>
                      <ul class="pg-tool-group-list">
                        <li v-for="tool in group.tools" :key="tool.name" class="pg-mcp-tool" :title="tool.description">
                          <span class="pg-mcp-tool-text">
                            <span class="pg-mcp-tool-name">{{ humanizeTool(tool.name) }}</span>
                            <span class="pg-mcp-tool-id">{{ tool.name }}</span>
                          </span>
                          <USwitch
                            size="xs"
                            :model-value="mcp.isToolOn(server.id, tool.name)"
                            :aria-label="tool.name"
                            @update:model-value="(on) => mcp?.toggleTool(server.id, tool.name, on)"
                          />
                        </li>
                      </ul>
                    </div>
                  </div>
                </template>
              </UCollapsible>
            </li>
          </ul>
          <p v-else class="pg-section-empty">No servers yet. The server has to allow calls from this origin.</p>
          <UCollapsible v-model:open="addServerOpen" class="pg-add">
            <UButton
              :label="addServerOpen ? 'Close' : 'Add a server'"
              :icon="addServerOpen ? 'i-lucide-minus' : 'i-lucide-plus'"
              color="neutral"
              variant="soft"
              size="xs"
              block
            />
            <template #content>
              <div class="pg-add-body pg-fields">
                <UFormField label="Name" size="sm">
                  <UInput v-model="mcpName" placeholder="DeepWiki" size="sm" class="w-full" />
                </UFormField>
                <UFormField label="URL" size="sm" help="The server's streamable HTTP endpoint.">
                  <UInput v-model="mcpUrl" placeholder="https://mcp.deepwiki.com/mcp" size="sm" class="w-full" />
                </UFormField>
                <UFormField label="Bearer token" size="sm" help="Optional. Kept until you reload the page.">
                  <UInput v-model="mcpToken" type="password" placeholder="…" size="sm" autocomplete="off" class="w-full" />
                </UFormField>
                <div class="pg-inline">
                  <UButton
                    label="Connect"
                    size="sm"
                    icon="i-lucide-plug"
                    :disabled="!mcpUrl.trim()"
                    @click="addServer"
                  />
                </div>
              </div>
            </template>
          </UCollapsible>
        </section>
      </template>

      <template #code>
        <div class="pg-code">
          <PlaygroundModelsCode
            :model="modelId"
            :code-url="codeUrl"
            :settings="resolvedSettings"
          />
        </div>
      </template>
    </UTabs>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { useKnowledge } from "~/composables/useKnowledge";
import type { useNosaProfile } from "~/composables/useNosaProfile";
import {
  groupOfTool,
  humanizeTool,
  type useMcpServers,
} from "~/composables/useMcpServers";
import {
  formatTokenCount,
  formatUsd,
  modelName,
  pricePerMillion,
  usdToCredits,
  type LlmModel,
} from "~/composables/useLlmGateway";

/** What the open chat has used so far. */
export type PlaygroundUsage = {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  /** Output tokens per second, one per reply, in order. */
  tps: number[];
};
import type { ChatSettings } from "~/utils/llmChat";
import type { PlaygroundSettings } from "~/utils/playgroundSettings";
import { TOOL_CATALOG } from "~/utils/playgroundTools";
import { resolveMaxTokens } from "~/utils/playgroundSettings";

const props = defineProps<{
  model: LlmModel | null;
  modelId: string;
  /** The base URL the code sample calls. */
  codeUrl: string;
  usage?: PlaygroundUsage;
  knowledge?: ReturnType<typeof useKnowledge>;
  mcp?: ReturnType<typeof useMcpServers>;
  nosa?: ReturnType<typeof useNosaProfile>;
}>();

const PERSONAS = [
  { label: "Playground default", value: "default" },
  { label: "Nosa, the Nosana assistant", value: "nosa" },
];

function credits(usd: number): string {
  const value = usdToCredits(usd);
  if (value === 0) return "0";
  return value < 0.01 ? "<0.01" : value.toFixed(2);
}

/** Throughput per reply as an SVG polyline, scaled to the box. */
const sparkline = computed(() => {
  const values = props.usage?.tps ?? [];
  if (values.length < 2) return "";
  const max = Math.max(...values) || 1;
  const step = 100 / (values.length - 1);
  return values
    .map((v, i) => `${(i * step).toFixed(1)},${(26 - (v / max) * 24).toFixed(1)}`)
    .join(" ");
});

const settings = defineModel<PlaygroundSettings>("settings", { required: true });
const customKey = defineModel<string>("customKey", { default: "" });

const TABS = [
  { label: "Settings", icon: "i-lucide-sliders-horizontal", slot: "settings" },
  { label: "Tools", icon: "i-lucide-wrench", slot: "tools" },
  { label: "Code", icon: "i-lucide-code", slot: "code" },
];

// Knowledge: files dropped or text pasted, added as documents.
const addDocOpen = ref(false);
const addServerOpen = ref(false);
const files = ref<File[]>([]);
const pasteText = ref("");
const pasteName = ref("");

async function addDocs() {
  if (!props.knowledge) return;
  for (const file of files.value) {
    await props.knowledge.add(file.name, await file.text());
  }
  files.value = [];
  addDocOpen.value = false;
  const text = pasteText.value.trim();
  if (text) {
    await props.knowledge.add(
      pasteName.value.trim() || `Pasted ${new Date().toLocaleString()}`,
      text,
    );
    pasteText.value = "";
    pasteName.value = "";
  }
}

// MCP: each server's tools by resource, with how many are on.
const openTools = ref<Record<string, boolean>>({});

function onCount(serverId: string): number {
  const mcp = props.mcp;
  if (!mcp) return 0;
  return mcp.connectionOf(serverId).tools.filter((t) => mcp.isToolOn(serverId, t.name)).length;
}

function groupsOf(serverId: string) {
  const mcp = props.mcp;
  if (!mcp) return [];
  const groups = new Map<string, { name: string; tools: { name: string; description?: string }[]; on: number }>();
  for (const tool of mcp.connectionOf(serverId).tools) {
    const name = groupOfTool(tool.name);
    const group = groups.get(name) ?? { name, tools: [], on: 0 };
    group.tools.push(tool);
    if (mcp.isToolOn(serverId, tool.name)) group.on++;
    groups.set(name, group);
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// MCP: a server by URL.
const mcpSummary = computed(() => {
  const servers = props.mcp?.servers.value ?? [];
  if (!servers.length) return "none";
  const ready = servers.filter((s) => props.mcp!.connectionOf(s.id).status === "ready");
  const tools = ready.reduce((n, s) => n + onCount(s.id), 0);
  return `${ready.length}/${servers.length} up · ${tools} tools on`;
});
const tokenDrafts = ref<Record<string, string>>({});

function submitToken(serverId: string) {
  const token = tokenDrafts.value[serverId]?.trim();
  if (!props.mcp || !token) return;
  props.mcp.setToken(serverId, token);
  tokenDrafts.value[serverId] = "";
}

const mcpName = ref("");
const mcpUrl = ref("");
const mcpToken = ref("");

function addServer() {
  if (!props.mcp || !mcpUrl.value.trim()) return;
  props.mcp.add({
    name: mcpName.value.trim(),
    url: mcpUrl.value.trim(),
    token: mcpToken.value.trim() || undefined,
  });
  mcpName.value = "";
  mcpUrl.value = "";
  mcpToken.value = "";
  addServerOpen.value = false;
}

const facts = computed(() => {
  const model = props.model;
  if (!model) return [];
  return [
    { label: "Context window", value: formatTokenCount(model.context_length) },
    { label: "Max output", value: formatTokenCount(model.max_output_tokens) },
    { label: "Input, per 1M tokens", value: formatUsd(pricePerMillion(model.pricing.prompt)) },
    { label: "Output, per 1M tokens", value: formatUsd(pricePerMillion(model.pricing.completion)) },
  ];
});

// The limit runs up to what the model can write, which is also the default.
const modelMax = computed(() => props.model?.max_output_tokens || 8192);
const maxTokens = computed({
  get: () => resolveMaxTokens(settings.value, props.model?.max_output_tokens),
  set: (value) => (settings.value.maxTokens = value),
});

const resolvedSettings = computed<ChatSettings>(() => ({
  systemPrompt: settings.value.systemPrompt,
  temperature: settings.value.temperature,
  maxTokens: maxTokens.value,
}));

function toggle(id: string, on: boolean) {
  const rest = settings.value.tools.filter((entry) => entry !== id);
  settings.value.tools = on ? [...rest, id] : rest;
}
</script>

<style scoped lang="scss">
.pg-inspector {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

:deep(.pg-tabs) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  gap: 0;
}

// A segmented control, sat in the pane's toolbar row.
:deep(.pg-tabs-list) {
  flex: none;
  box-sizing: border-box;
  height: calc(var(--pg-toolbar) - 16px);
  margin: 8px 0.75rem;
  background: var(--ui-bg-accented);
}

:deep(.pg-tabs) > :first-child {
  position: relative;
}

:deep(.pg-tabs)::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: var(--pg-toolbar);
  height: 1px;
  background: var(--ui-border);
}

.pg-inspector {
  position: relative;
}

:deep(.pg-tabs-body) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.5rem 1.1rem 1.5rem;
}

.pg-model-name {
  margin: 0.9rem 0 0.2rem;
  font-family: var(--pg-title);
  font-size: 1rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

// Flat sections: an eyebrow, then the fields, no boxes around them.
.pg-group-label {
  margin: 1.6rem 0 0.7rem;
  font-family: var(--pg-mono);
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.pg-group {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 1.1rem;
}

.pg-row {
  padding: 0;
}

// Fields: a 13px label, the control, a line of help underneath.
.pg-fields :deep([data-slot="label"]) {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ui-text);
}

.pg-fields :deep([data-slot="help"]) {
  margin-top: 0.4rem;
  font-size: 0.74rem;
  color: var(--ui-text-dimmed);
}

.pg-fields :deep(textarea),
.pg-fields :deep(input) {
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  background: var(--pg-tile);
  font-size: 0.85rem;
  line-height: 1.5;
}

.pg-fields :deep(textarea) {
  min-height: 6rem;
}

// The model's numbers: label left, a green mono chip right, hairlines between.
.pg-facts {
  gap: 0;
}

.pg-facts .pg-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0;
  border-top: 1px solid var(--ui-border-muted);
  font-size: 0.84rem;

  &:first-child {
    border-top: 0;
  }

  dt {
    color: var(--ui-text-muted);
  }

  dd {
    margin: 0;
    padding: 1px 8px;
    border-radius: 6px;
    border: 1px solid var(--pg-chip-border);
    background: var(--pg-chip-bg);
    font-family: var(--pg-mono);
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--ui-primary);
  }
}

.pg-spark {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  color: var(--ui-primary);

  svg {
    flex: none;
    width: 110px;
    height: 28px;
  }
}

.pg-spark-label {
  font-family: var(--pg-mono);
  font-size: 0.66rem;
  color: var(--ui-text-dimmed);
}

// A section: an icon tile, a title and a line about it, a count on the right,
// then its list, then a folded form to add to it.
.pg-section {
  padding: 1.1rem 0 1.25rem;

  & + & {
    border-top: 1px solid var(--ui-border);
  }
}

.pg-section-head {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  margin-bottom: 0.85rem;
}

.pg-section-icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--pg-green) 0%, #0aa908 100%);
  color: #05230a;
  font-size: 0.95rem;
}

.pg-section-titles {
  flex: 1;
  min-width: 0;
}

.pg-section-title {
  margin: 0;
  font-family: var(--pg-title);
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--ui-text-highlighted);
}

.pg-section-sub {
  margin: 0.1rem 0 0;
  font-size: 0.74rem;
  line-height: 1.4;
  color: var(--ui-text-muted);
}

.pg-section-chip {
  flex: none;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--ui-bg-accented);
  font-family: var(--pg-mono);
  font-size: 0.62rem;
  letter-spacing: 0.03em;
  white-space: nowrap;
  color: var(--ui-text-muted);
}

.pg-tag {
  margin-left: 0.4rem;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid var(--pg-chip-border);
  background: var(--pg-chip-bg);
  font-family: var(--pg-mono);
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  vertical-align: middle;
  color: var(--ui-primary);
}

.pg-section-empty {
  margin: 0 0 0.5rem;
  font-size: 0.78rem;
  color: var(--ui-text-dimmed);
}

.pg-add {
  margin-top: 0.6rem;
}

.pg-add-body {
  padding: 0.85rem 0 0.25rem;
}

.pg-tool-icon[data-status="ready"] {
  color: var(--ui-primary);
}

.pg-tool-icon[data-status="error"] {
  color: var(--ui-error);
}

.pg-tool-icon[data-status="unauthorized"] {
  color: var(--ui-text-dimmed);
}

// A server row holds its summary line and, folded under it, its tools.
.pg-server {
  display: block;
}

.pg-server-tools {
  margin: 0.2rem 0 0 2.6rem;
}

.pg-tool-groups {
  display: grid;
  gap: 0.6rem;
  padding: 0.4rem 0 0.2rem;
}

.pg-tool-group-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.15rem;
}

.pg-tool-group-name {
  font-family: var(--pg-title);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.pg-tool-group-count {
  flex: 1;
  font-family: var(--pg-mono);
  font-size: 0.64rem;
  color: var(--ui-text-dimmed);
}

.pg-tool-group-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.pg-mcp-tool {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
  border-top: 1px solid var(--ui-border-muted);

  &:first-child {
    border-top: 0;
  }
}

.pg-mcp-tool-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.pg-mcp-tool-name {
  font-size: 0.8rem;
  color: var(--ui-text);
}

.pg-mcp-tool-id {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--pg-mono);
  font-size: 0.62rem;
  color: var(--ui-text-dimmed);
}

.pg-prompt-preview {
  margin: 0.5rem 0 0;
  padding: 0.75rem;
  max-height: 16rem;
  overflow: auto;
  border-radius: 10px;
  background: var(--pg-tile);
  font-family: inherit;
  font-size: 0.78rem;
  line-height: 1.45;
  white-space: pre-wrap;
  color: var(--ui-text-muted);
}

.pg-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pg-grow {
  flex: 1;
}

.pg-tool-list {
  gap: 0;
}

.pg-tool {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-top: 1px solid var(--ui-border-muted);

  &:first-child {
    border-top: 0;
  }
}

.pg-tool-icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--ui-border);
  background: var(--pg-tile);
  color: var(--ui-primary);
  font-size: 1rem;
}

.pg-tool-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.pg-tool-name {
  font-family: var(--pg-title);
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.pg-tool-desc {
  font-size: 0.74rem;
  color: var(--ui-text-muted);
}

// The code sample sits flat in the pane: the tab already says "Code", so its
// own heading goes, the language switch leads, and the code is the one box.
.pg-code :deep(.snippet-head) {
  padding: 0.9rem 0 0.6rem;
  border-bottom: 0;

  .title {
    display: none;
  }

  .seg-tabs {
    margin-right: auto;
  }
}

.pg-code :deep(.snippet-body) {
  border-radius: 10px;
  border: 1px solid var(--ui-border);
  background: var(--pg-tile);
}

.pg-code :deep(.snippet-foot) {
  padding: 0.75rem 0 0;
  border-top: 0;
}
</style>
