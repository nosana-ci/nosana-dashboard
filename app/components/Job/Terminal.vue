<template>
  <div
    class="job-terminal"
    :style="expanded ? { '--job-terminal-height': '75vh' } : undefined"
  >
    <div class="terminal-toolbar">
      <div class="terminal-status" role="status" aria-live="polite">
        <span class="status-dot" :class="statusClass" aria-hidden="true" />
        <span>{{ statusLabel }}</span>
      </div>
      <button
        v-if="!isConnected"
        type="button"
        class="button is-small is-secondary"
        :disabled="isBusy || !canConnect"
        @click="startSession"
      >
        {{ actionLabel }}
      </button>
      <button
        v-else
        type="button"
        class="button is-small is-quiet"
        @click="stopSession"
      >
        Disconnect
      </button>
      <button
        v-if="hasConnectedOnce"
        type="button"
        class="button is-small is-quiet"
        :aria-pressed="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? "Reduce terminal" : "Expand terminal" }}
      </button>
    </div>

    <div
      v-if="errorMessage"
      class="notification is-danger is-light mt-3 mb-0"
      role="alert"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="!canConnect && disabledReason"
      class="notification is-info is-light mt-3 mb-0"
    >
      {{ disabledReason }}
    </div>

    <div
      v-show="hasConnectedOnce"
      ref="terminalElement"
      class="terminal-surface mt-3"
    />
  </div>
</template>

<script setup lang="ts">
import "@xterm/xterm/css/xterm.css";
import {
  useJobTerminal,
  type TerminalStatus,
} from "~/composables/jobs/useJobTerminal";
import { useXterm } from "~/composables/jobs/useXterm";
import { useLatestRequest } from "~/composables/useLatestRequest";

const props = withDefaults(
  defineProps<{
    jobAddress: string;
    node: string;
    op?: string;
    deploymentId?: string;
    canConnect?: boolean;
    disabledReason?: string;
  }>(),
  { canConnect: true, disabledReason: "" },
);

const { status, connect, sendInput, resize, closeConnection } = useJobTerminal(
  props.jobAddress,
  props.deploymentId,
);
const terminalElement = ref<HTMLDivElement | null>(null);
const xterm = useXterm(terminalElement, { onInput: sendInput, onResize: resize });

const errorMessage = ref("");
const hasConnectedOnce = ref(false);
const expanded = ref(false);
const starting = ref(false);
const starts = useLatestRequest();

const isConnected = computed(() => status.value === "connected");
const isBusy = computed(
  () =>
    starting.value ||
    status.value === "authorizing" ||
    status.value === "connecting",
);

const statusLabel = computed(() => {
  if (
    starting.value &&
    status.value !== "authorizing" &&
    status.value !== "connecting"
  )
    return "Preparing terminal";
  switch (status.value) {
    case "authorizing":
      return "Authorizing";
    case "connecting":
      return "Connecting";
    case "connected":
      return "Connected";
    case "closed":
      return "Disconnected";
    case "error":
      return "Connection error";
    default:
      return "Not connected";
  }
});

const actionLabel = computed(() => {
  if (status.value === "authorizing") return "Authorizing…";
  if (status.value === "connecting") return "Connecting…";
  if (starting.value) return "Preparing…";
  return hasConnectedOnce.value ? "Reconnect" : "Open terminal";
});

const statusClass = computed(() => ({
  "is-connected": isConnected.value,
  "is-pending": isBusy.value,
  "is-error": status.value === "error",
}));

const startSession = async () => {
  if (!props.canConnect || isBusy.value || isConnected.value) return;

  const attempt = starts.begin();
  const isCurrent = () => starts.isCurrent(attempt) && props.canConnect;
  starting.value = true;
  errorMessage.value = "";
  try {
    const isReconnect = hasConnectedOnce.value;
    const terminal = await xterm.ensure(isCurrent);
    if (!terminal || !isCurrent()) return;
    if (isReconnect) terminal.reset();
    hasConnectedOnce.value = true;
    await nextTick();
    if (!isCurrent()) return;
    xterm.fit();

    await connect({
      cols: terminal.cols,
      rows: terminal.rows,
      op: props.op,
      onData: (data) => {
        if (isCurrent()) terminal.write(data);
      },
      onStatus: (next: TerminalStatus, detail?: string) => {
        if (isCurrent() && next === "error") {
          errorMessage.value = detail || "Could not open the terminal.";
        }
      },
      onExit: (code) => {
        if (!isCurrent()) return;
        const suffix = code === null ? "" : ` with exit code ${code}`;
        terminal.writeln(`\r\n[Session ended${suffix}]`);
      },
    });

    if (isCurrent() && status.value === "connected") {
      xterm.fit();
      terminal.focus();
    }
  } catch (error) {
    if (!isCurrent()) return;
    closeConnection("error");
    xterm.dispose();
    errorMessage.value =
      error instanceof Error ? error.message : "Could not open the terminal.";
  } finally {
    if (starts.isCurrent(attempt)) starting.value = false;
  }
};

const stopSession = () => {
  starts.cancel();
  starting.value = false;
  closeConnection();
  errorMessage.value = "";
  xterm.terminal?.reset();
};

watch(() => [props.node, props.op, props.canConnect], stopSession, {
  flush: "sync",
});

watch(status, async (nextStatus) => {
  if (nextStatus !== "connected") return;
  await nextTick();
  if (!xterm.terminal || status.value !== "connected") return;
  xterm.fit();
  xterm.terminal.focus();
});

onBeforeUnmount(() => {
  starts.cancel();
  starting.value = false;
  closeConnection("idle");
  xterm.dispose();
});
</script>

<style scoped lang="scss">
.terminal-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.terminal-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  order: 1;
  margin-left: auto;
  color: $text-dark;
  font-size: 0.875rem;
  white-space: nowrap;
}

.status-dot {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
  background: $grey-light;

  &.is-connected {
    background: $secondary;
  }

  &.is-pending {
    background: $warning;
  }

  &.is-error {
    background: $danger;
  }
}

// Read by useXterm when the terminal is created.
.terminal-surface {
  --terminal-background: #{$black-ter};
  --terminal-foreground: #{$white-ter};
  --terminal-cursor: #{$secondary};
  width: 100%;
  height: var(--job-terminal-height, 480px);
  padding: 0.5rem;
  overflow: hidden;
  border-radius: $radius;
  background: var(--terminal-background);
  font-family: $family-monospace;
}

:deep(.xterm) {
  height: 100%;
}

html.dark-mode .terminal-status {
  color: $grey-light;
}

@include touch {
  .terminal-surface {
    height: var(--job-terminal-height, 380px);
  }
}
</style>
