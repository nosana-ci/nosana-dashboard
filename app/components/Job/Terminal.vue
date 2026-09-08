<template>
  <div class="job-terminal" :class="{ 'is-fullscreen': fullscreen }">
    <div class="terminal-toolbar">
      <div class="terminal-status" role="status" aria-live="polite">
        <span class="status-dot" :class="statusClass" aria-hidden="true" />
        <span>{{ statusLabel }}</span>
        <!-- After a drop, reconnecting is a plain link beside the status -->
        <button
          v-if="hasConnectedOnce && !isConnected && !isBusy"
          type="button"
          class="terminal-relink"
          :disabled="!canConnect"
          @click="startSession"
        >
          Reconnect
        </button>
      </div>
      <button
        v-if="!hasConnectedOnce && !isConnected"
        type="button"
        class="button is-small is-secondary"
        :disabled="isBusy || !canConnect"
        @click="startSession"
      >
        {{ actionLabel }}
      </button>
      <button
        v-else-if="isConnected"
        type="button"
        class="button is-small is-quiet"
        @click="stopSession"
      >
        Disconnect
      </button>
      <button
        v-if="hasConnectedOnce"
        type="button"
        class="icon-button terminal-fullscreen"
        :aria-pressed="fullscreen"
        :title="fullscreen ? 'Exit full screen (Esc)' : 'Full screen'"
        @click="fullscreen = !fullscreen"
      >
        <svg
          v-if="fullscreen"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
        </svg>
      </button>
    </div>

    <div
      v-if="errorMessage"
      class="notification is-danger is-light terminal-note"
      role="alert"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="!canConnect && disabledReason"
      class="notification is-info is-light terminal-note"
    >
      {{ disabledReason }}
    </div>

    <div
      v-show="hasConnectedOnce"
      ref="terminalElement"
      class="terminal-surface"
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
    /** Open the session as soon as connecting is allowed, without a click. */
    autoConnect?: boolean;
  }>(),
  { canConnect: true, disabledReason: "", autoConnect: false },
);

const { status, connect, sendInput, resize, closeConnection } = useJobTerminal(
  props.jobAddress,
  props.deploymentId,
);
const terminalElement = ref<HTMLDivElement | null>(null);
const xterm = useXterm(terminalElement, { onInput: sendInput, onResize: resize });

const errorMessage = ref("");
const hasConnectedOnce = ref(false);
const starting = ref(false);

// Full screen: the frame covers the viewport; Esc leaves it before anything
// else (e.g. an enclosing panel) sees the key.
const fullscreen = ref(false);
const onFullscreenKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Escape") return;
  event.stopImmediatePropagation();
  event.preventDefault();
  fullscreen.value = false;
};
watch(fullscreen, (on) => {
  if (on) document.addEventListener("keydown", onFullscreenKeydown, true);
  else document.removeEventListener("keydown", onFullscreenKeydown, true);
});
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
  return "Open terminal";
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

// First connection only; after a disconnect the user reconnects deliberately.
// Runs once the surface element exists, and again if access is granted later.
const autoOpen = () => {
  if (props.autoConnect && props.canConnect && !hasConnectedOnce.value) {
    void startSession();
  }
};
onMounted(autoOpen);
watch(() => props.autoConnect && props.canConnect, autoOpen);

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
  document.removeEventListener("keydown", onFullscreenKeydown, true);
});
</script>

<style scoped lang="scss">
/* The session sits in its own always-dark window: a title strip with the
   status on the left and the action on the right, the shell below. */
.job-terminal {
  @include code-surface-frame;
}

.terminal-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.85rem;
  @include code-surface-bar;

  > .button.is-quiet {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.14);
    color: #fff;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  }
}

.terminal-status {
  // Holds the left edge so the actions stay right-aligned even in the states
  // that render no Connect/Disconnect button (connecting, dropped).
  margin-right: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #c9d3c9;
  font-size: 0.875rem;
  white-space: nowrap;
}

.terminal-fullscreen {
  color: #c9d3c9;

  &:hover,
  &:focus-visible {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
}

/* Covers the viewport above the job panel; the surface takes the rest. */
.job-terminal.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1002;
  border: 0;
  border-radius: 0;
  display: flex;
  flex-direction: column;

  .terminal-surface {
    flex: 1;
    height: auto !important;
    min-height: 0;
  }
}

.terminal-note {
  margin: 0.85rem 0.85rem 0;
}

/* Text-only action that reads as part of the status line */
.terminal-relink {
  padding: 0;
  border: 0;
  background: none;
  color: $secondary;
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &::before {
    content: "·";
    margin-right: 0.5rem;
    color: $grey-light;
    font-weight: 400;
  }

  &:hover:not(:disabled),
  &:focus-visible {
    text-decoration: underline;
  }

  &:disabled {
    color: $grey-light;
    cursor: not-allowed;
  }
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
  --terminal-background: #{$code-surface};
  --terminal-foreground: #{$white-ter};
  --terminal-cursor: #{$secondary};
  width: 100%;
  height: 75vh;
  min-height: 360px;
  padding: 0.85rem;
  overflow: hidden;
  background: var(--terminal-background);
  font-family: $family-monospace;
}

:deep(.xterm) {
  height: 100%;
}

@include touch {
  .terminal-surface {
    height: 60vh;
  }
}
</style>
