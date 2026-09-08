<template>
  <Teleport to="body">
    <div v-if="job" class="jp-scrim" @click="emit('close')"></div>
    <aside
      v-if="job"
      class="jp"
      :class="{ 'is-wide': wide }"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`${panelId}-title`"
    >
      <!-- Header: the deployment page's header, for one job -->
      <header class="jp-head">
        <div class="jp-heading">
          <div class="jp-title-row">
            <h2 :id="`${panelId}-title`" class="jp-title is-family-monospace">
              {{ truncateMiddle(job, 8, 6) }}
            </h2>
            <DeploymentStatusPill v-if="selected" :status="selected.state" />
          </div>
          <p class="jp-meta">
            <template v-if="selected">
              <span>Revision {{ selected.revision ?? "-" }}</span>
              <span class="jp-sep" aria-hidden="true">·</span>
              <span>started {{ formatTimeAgo(selected.created_at) }}</span>
              <span class="jp-sep" aria-hidden="true">·</span>
            </template>
            <a
              :href="`https://explore.nosana.com/jobs/${job}`"
              target="_blank"
              rel="noopener"
              class="jp-link"
              >Explorer ›</a
            >
          </p>
        </div>
        <div class="jp-actions">
          <button
            type="button"
            class="icon-button"
            :aria-pressed="wide"
            :title="wide ? 'Reduce panel' : 'Expand panel'"
            @click="wide = !wide"
          >
            <svg
              v-if="wide"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
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
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
          <button
            ref="closeButton"
            type="button"
            class="icon-button"
            title="Close and disconnect"
            aria-label="Close job panel"
            @click="emit('close')"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </header>

      <div class="jp-tabs">
        <div class="dep-tabs" role="tablist" aria-label="Job view">
          <button
            v-for="tab in visibleViews"
            :key="tab.id"
            type="button"
            role="tab"
            class="dep-tab"
            :class="{ 'is-active': view === tab.id }"
            :aria-selected="view === tab.id"
            @click="emit('update:view', tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="jp-body">
        <!-- Both stay mounted while the panel is open, so streams, shells
             and loaded logs survive switching between the views. -->
        <div v-show="view !== 'logs'">
          <DeploymentJobPanelBody
            :key="job"
            :deployment-id="deploymentId"
            :job-address="job"
            :view="view === 'logs' ? 'details' : view"
            :job-state="selected?.state"
            :active="view !== 'logs'"
            :auto-connect-op="autoConnectOp"
            :deployment-endpoints="endpoints"
          />
        </div>
        <div v-if="logsVisited" v-show="view === 'logs'">
          <DeploymentLogCollector
            :key="job"
            :deployment-id="deploymentId"
            :jobs="deploymentJobs"
            :market="market"
            :job-filter="[job]"
            hide-job-select
          />
        </div>
      </div>
    </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { useId } from "vue";
import type { DeploymentJobItem } from "@nosana/api";
import DeploymentJobPanelBody from "~/components/Deployment/DeploymentJobPanelBody.vue";
import DeploymentLogCollector from "~/components/Deployment/DeploymentLogCollector.vue";
import DeploymentStatusPill from "~/components/Deployment/DeploymentStatusPill.vue";
import { truncateMiddle } from "~/utils/solana";
import { formatTimeAgo } from "~/utils/relativeTime";

export type JobPanelView = "details" | "containers" | "logs" | "activity";

const VIEWS: Array<{ id: JobPanelView; label: string }> = [
  { id: "details", label: "Details" },
  { id: "containers", label: "Containers" },
  { id: "logs", label: "Logs" },
  { id: "activity", label: "Activity" },
];

const props = defineProps<{
  deploymentId: string;
  /** Every job the page knows, for the header line and the log collector. */
  deploymentJobs: DeploymentJobItem[];
  market?: string;
  /** The deployment's endpoint status, shown on the container cards. */
  endpoints: Array<{ opId: string; port: number | string; online: boolean }>;
  /** Job on screen, "" when closed. */
  job: string;
  view: JobPanelView;
  /** Operation whose shell opens on its own ("*" = the first). */
  autoConnectOp: string;
}>();
const emit = defineEmits<{
  "update:view": [view: JobPanelView];
  close: [];
}>();

const panelId = `job-panel-${useId()}`;
const wide = ref(false);
const closeButton = ref<HTMLButtonElement | null>(null);

const selected = computed(
  () => props.deploymentJobs.find((item) => item.job === props.job) ?? null,
);

const jobState = computed(() =>
  selected.value ? normalizeStatus(selected.value.state) : "UNKNOWN",
);

// A queued replica hasn't been picked up by a node yet, so it has no details,
// no containers and no logs — only the trail of it being listed. Once it runs
// everything is available; after it finishes the containers (and the shells
// and endpoint actions inside that tab) are dead controls.
const visibleViews = computed(() => {
  if (jobState.value === "QUEUED") {
    return VIEWS.filter((tab) => tab.id === "activity");
  }
  return VIEWS.filter(
    (tab) => tab.id !== "containers" || jobState.value === "RUNNING",
  );
});

// The panel can be opened straight onto a view (the row's SSH button opens
// Containers), and a job can change state while it is open.
watch(
  [() => props.view, visibleViews],
  ([view, views]) => {
    if (views.some((tab) => tab.id === view)) return;
    emit("update:view", views[0]?.id ?? "details");
  },
  { immediate: true },
);

// The log collector mounts on first visit and stays until the panel closes.
const logsVisited = ref(false);
watch(
  [() => props.job, () => props.view],
  ([job, view]) => {
    if (!job) logsVisited.value = false;
    else if (view === "logs") logsVisited.value = true;
  },
  { immediate: true },
);

// Open: lock the page behind, focus the close control; Esc closes.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") emit("close");
};
watch(
  () => !!props.job,
  async (open) => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) {
      document.addEventListener("keydown", onKeydown);
      await nextTick();
      closeButton.value?.focus();
    } else {
      document.removeEventListener("keydown", onKeydown);
    }
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  document.documentElement.style.overflow = "";
  document.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped lang="scss">
// Level with the top bar's sticky account control (1000) and later in the
// DOM, so it paints above it; modals (1001+) still open on top of the panel.
.jp-scrim {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba($black, 0.45);
}

.jp {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  width: min(68vw, 1080px);
  display: flex;
  flex-direction: column;
  background: $body-background-color;
  color: $text;
  border-left: 1px solid $grey-lighter;
  box-shadow: -40px 0 80px -30px rgba($black, 0.35);
  transition: width 0.25s ease;

  &.is-wide {
    width: calc(100vw - 250px);
  }
}

/* ---- Header, as the deployment page's ---- */
.jp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem 1.75rem 0;
}

.jp-heading {
  min-width: 0;
  flex: 1;
}

.jp-title-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.jp-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: $text;
}

.jp-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin: 0.5rem 0 0;
  font-size: 0.78rem;
  color: $grey;
}

.jp-sep {
  color: $grey-light;
}

.jp-link {
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.jp-actions {
  flex: none;
  display: flex;
  gap: 0.4rem;
}

/* ---- Tabs, the deployment page's segmented control ---- */
.jp-tabs {
  padding: 0 1.75rem;
}

.dep-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 5px;
  margin: 1.75rem 0 0.25rem;
  border-radius: 13px;
  background: $grey-lightest;
  max-width: 100%;
  overflow-x: auto;
}

.dep-tab {
  font-family: $title-family;
  font-weight: 500;
  font-size: 0.9rem;
  color: $grey-dark;
  border: 0;
  background: none;
  padding: 0.6rem 1.35rem;
  border-radius: 9px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.15s ease,
    background 0.15s ease;

  &:hover {
    color: $text;
  }

  &.is-active {
    background: $secondary;
    color: #05230a;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba($black, 0.12);
  }
}

.jp-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 1.5rem 1.75rem 1.75rem;

  // The hosted job view and log collector size themselves for a page.
  :deep(.job-detail > .p-5) {
    padding: 0 !important;
  }

  :deep(.terminal-surface) {
    height: 55vh;
  }

  :deep(.log-collector) {
    height: calc(100vh - 230px);
  }
}

html.dark-mode {
  .jp {
    background: $body-background-color-dark;
    color: $white;
    border-left-color: rgba($white, 0.1);
    box-shadow: -40px 0 80px -30px rgba($black, 0.8);
  }

  .jp-title {
    color: $white;
  }

  .jp-meta {
    color: $grey-light;
  }

  .jp-sep {
    color: rgba($white, 0.25);
  }

  .dep-tabs {
    background: rgba($white, 0.08);
  }

  .dep-tab {
    color: $grey-light;

    &:hover {
      color: $white;
    }

    &.is-active {
      background: $secondary;
      color: #05230a;
      box-shadow: 0 1px 3px rgba($black, 0.5);
    }
  }
}

@include touch {
  .jp,
  .jp.is-wide {
    width: 100vw;
  }

  .jp-head {
    padding: 1rem 1rem 0;
  }

  .jp-title {
    font-size: 1.25rem;
  }

  .jp-tabs,
  .jp-body {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
