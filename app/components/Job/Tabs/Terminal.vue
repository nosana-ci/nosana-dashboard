<template>
  <div class="terminal-tab">
    <div class="terminal-toolbar">
      <div class="terminal-status">
        <span class="status-dot" :class="statusClass" />
        <span class="status-text">{{ statusLabel }}</span>
      </div>
      <div class="terminal-actions">
        <button
          v-if="!isConnected"
          class="button is-small is-primary"
          :class="{ 'is-loading': isBusy }"
          :disabled="isBusy || !canConnect"
          @click="startSession"
        >
          {{ hasConnectedOnce ? "Reconnect" : "Open terminal" }}
        </button>
        <button
          v-else
          class="button is-small is-light"
          @click="stopSession"
        >
          Disconnect
        </button>
      </div>
    </div>

    <div v-if="errorMessage" class="notification is-danger is-light terminal-error">
      {{ errorMessage }}
    </div>

    <div
      v-show="hasConnectedOnce || isConnected"
      ref="terminalEl"
      class="terminal-surface"
    />

    <div
      v-if="!hasConnectedOnce && !isConnected"
      class="terminal-placeholder"
    >
      <p>
        Open an interactive shell into this job's container. Your wallet signs a
        short-lived, single-job terminal grant; no SSH key is required.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from "vue";
import type { Terminal as XTerminal } from "@xterm/xterm";
import type { FitAddon as XFitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

import {
  useJobTerminal,
  type TerminalStatus,
} from "~/composables/jobs/useJobTerminal";

interface Props {
  jobAddress: string;
  node: string;
  op?: string;
  canConnect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  op: undefined,
  canConnect: true,
});

const nodeRef = computed(() => props.node);
const { status, connect, sendInput, resize, closeConnection } = useJobTerminal(
  props.jobAddress,
  nodeRef,
);

const terminalEl = ref<HTMLDivElement | null>(null);
const errorMessage = ref<string>("");
const hasConnectedOnce = ref(false);

let term: XTerminal | undefined;
let fitAddon: XFitAddon | undefined;
let resizeObserver: ResizeObserver | undefined;
let dataDisposable: { dispose: () => void } | undefined;

const isConnected = computed(() => status.value === "connected");
const isBusy = computed(
  () => status.value === "authorizing" || status.value === "connecting",
);

const statusLabel = computed(() => {
  switch (status.value) {
    case "authorizing":
      return "Authorizing…";
    case "connecting":
      return "Connecting…";
    case "connected":
      return "Connected";
    case "closed":
      return "Disconnected";
    case "error":
      return "Error";
    default:
      return "Idle";
  }
});

const statusClass = computed(() => ({
  "is-connected": status.value === "connected",
  "is-pending": isBusy.value,
  "is-error": status.value === "error",
}));

const applyResize = () => {
  if (!term || !fitAddon) return;
  try {
    fitAddon.fit();
    resize(term.cols, term.rows);
  } catch {
    // ignore transient layout errors
  }
};

const ensureTerminal = async () => {
  if (term) return;

  const { Terminal } = await import("@xterm/xterm");
  const { FitAddon } = await import("@xterm/addon-fit");

  term = new Terminal({
    cursorBlink: true,
    convertEol: true,
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontSize: 13,
    theme: { background: "#1b1b1f" },
  });
  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  if (terminalEl.value) {
    term.open(terminalEl.value);
    fitAddon.fit();
  }

  dataDisposable = term.onData((data) => sendInput(data));

  if (typeof ResizeObserver !== "undefined" && terminalEl.value) {
    resizeObserver = new ResizeObserver(() => applyResize());
    resizeObserver.observe(terminalEl.value);
  }
};

const startSession = async () => {
  errorMessage.value = "";
  await ensureTerminal();
  hasConnectedOnce.value = true;

  // Allow the surface to become visible before measuring.
  await nextTick();
  applyResize();

  await connect({
    cols: term?.cols ?? 80,
    rows: term?.rows ?? 24,
    op: props.op,
    onData: (chunk) => term?.write(chunk),
    onStatus: (next: TerminalStatus, detail?: string) => {
      if (next === "error" && detail) {
        errorMessage.value = detail;
      }
    },
    onExit: (code) => {
      term?.writeln(
        `\r\n\x1b[90m[session ended${code !== null ? ` (exit ${code})` : ""}]\x1b[0m`,
      );
    },
  });

  if (status.value === "connected") {
    applyResize();
    term?.focus();
  }
};

const stopSession = () => {
  closeConnection();
};

watch(
  () => props.node,
  () => {
    if (isConnected.value) closeConnection();
  },
);

onBeforeUnmount(() => {
  closeConnection();
  dataDisposable?.dispose();
  resizeObserver?.disconnect();
  term?.dispose();
  term = undefined;
});
</script>

<style scoped lang="scss">
.terminal-tab {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.terminal-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.terminal-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.status-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: #9aa0a6;

  &.is-connected {
    background: #2ecc71;
  }

  &.is-pending {
    background: #f1c40f;
  }

  &.is-error {
    background: #e74c3c;
  }
}

.terminal-surface {
  width: 100%;
  height: 480px;
  padding: 0.5rem;
  background: #1b1b1f;
  border-radius: 6px;
  overflow: hidden;
}

.terminal-placeholder {
  padding: 1.5rem;
  border: 1px dashed var(--bulma-border, #dbdbdb);
  border-radius: 6px;
  color: var(--bulma-text-weak, #6b7280);
}

.terminal-error {
  margin-bottom: 0;
}
</style>
