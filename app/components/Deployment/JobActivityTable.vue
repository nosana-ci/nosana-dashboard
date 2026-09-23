<template>
  <div class="jrows">
    <div
      v-for="job in jobs"
      :key="job.job"
      class="jrow"
      :class="{ 'is-live': !showDuration && getJobStateNumber(job) === 1 }"
    >
      <div class="jrow-head">
        <div class="jrow-main">
          <!-- The mark's shape and colour carry the state: a dot is ongoing,
               a checkmark has finished. The word itself is in the tooltip and
               in the hidden span below, for screen readers. -->
          <StatusMark
            :tone="getStatusTone(getJobStateNumber(job))"
            :pulse="!showDuration"
            :label="stateLabel(getJobStateNumber(job))"
          />
          <span class="is-sr-only">{{
            stateLabel(getJobStateNumber(job))
          }}</span>

          <span class="jinfo">
            <span class="jinfo-top">
              <!-- The GPU names the row; the address identifies it, below. -->
              <span class="jname">
                <JobGpuName :node="job.node" :fallback="marketLabel" />
              </span>
              <button
                v-if="job.revision != null"
                type="button"
                class="rev-chip is-family-monospace"
                :title="`Revision ${job.revision} — open in Configuration`"
                @click="emit('openRevision', job.revision as number)"
              >
                #{{ job.revision }}
              </button>
              <span v-else class="rev-chip is-family-monospace">#-</span>
            </span>
            <span class="jsub">
              <!-- Same shape as the deployment id in the page header -->
              <span class="jid is-family-monospace">{{
                truncateMiddle(job.job, 8, 6)
              }}</span>
              <button
                type="button"
                class="copy-btn"
                :class="{ 'is-copied': copiedJob === job.job }"
                :title="`Copy job address ${job.job}`"
                @click="copyJob(job.job)"
              >
                <svg
                  v-if="copiedJob === job.job"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
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
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path
                    d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                  />
                </svg>
              </button>
              <span class="jsep" aria-hidden="true">·</span>
              <span class="jtime">{{ timeLabel(job) }}</span>
            </span>
          </span>
        </div>

        <div class="jrow-right">
          <span
            v-if="
              showDuration && getJobDuration && getJobDuration(job.job) !== null
            "
            class="dur"
          >
            <SecondsFormatter
              :seconds="getJobDuration(job.job) as number"
              :showSeconds="true"
            />
          </span>

          <span
            v-if="!showDuration && getJobStateNumber(job) === 0"
            class="jwait-inline"
            >awaiting node…</span
          >

          <div class="jrow-actions">
            <button
              v-if="canAccess(job)"
              type="button"
              class="button is-small is-quiet"
              :title="`Open SSH access for job ${job.job}`"
              @click="emit('openSsh', job.job)"
            >
              <span class="icon is-small"
                ><TerminalIcon aria-hidden="true"
              /></span>
              <span class="is-hidden-mobile">SSH</span>
            </button>
            <!-- A queued job has produced no logs yet -->
            <button
              v-if="getJobStateNumber(job) !== 0"
              type="button"
              class="button is-small is-quiet"
              :title="`Show logs for job ${job.job}`"
              @click="emit('viewLogs', job.job)"
            >
              <span class="icon is-small">
                <!-- stroke-width 2 to match terminal.svg; a thinner stroke
                     anti-aliases to a paler green at this size. -->
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 6h16M4 12h10M4 18h13" />
                </svg>
              </span>
              <span class="is-hidden-mobile">Logs</span>
            </button>
          </div>

          <span class="jchev">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </div>

        <!-- Stretched click target for the row; last in the DOM so it sits
             above the plain text but below the interactive bits. -->
        <button
          type="button"
          class="jrow-link"
          :aria-label="`Open job ${job.job}`"
          @click="emit('open', job.job)"
        ></button>
      </div>

      <!-- Live per-job usage, aligned to the revision chip. The strip renders
           only while the node's stats stream is actually connected (handled
           inside the component). -->
      <div class="jrow-usage">
        <JobUsageStrip
          v-if="!showDuration && getJobStateNumber(job) === 1 && hasNode(job)"
          :jobId="job.job"
          :deployment-id="deploymentId"
          :node="job.node as string"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentJobItem } from "@nosana/api";
import SecondsFormatter from "~/components/SecondsFormatter.vue";
import JobUsageStrip from "~/components/Deployment/JobUsageStrip.vue";
import StatusMark from "~/components/Common/StatusMark.vue";
import JobGpuName from "~/components/Deployment/JobGpuName.vue";
import { getStatusTone } from "~/composables/useStatus";
import TerminalIcon from "@/assets/img/icons/terminal.svg?component";
import { NULL_ADDRESS, truncateMiddle } from "~/utils/solana";
import { formatTimeAgo } from "~/utils/relativeTime";

// A job with no node assigned yet (queued) carries the null placeholder address.
const hasNode = (job: DeploymentJobItem) =>
  !!job.node && job.node !== NULL_ADDRESS;

const props = defineProps<{
  jobs: DeploymentJobItem[];
  deploymentId: string;
  getJobStateNumber: (job: DeploymentJobItem) => number;
  getJobDuration?: (jobId: string) => number | null;
  showDuration?: boolean;
  /** Names the row until its node reports a GPU. */
  marketLabel: string;
}>();

const emit = defineEmits<{
  open: [jobId: string];
  viewLogs: [jobId: string];
  openSsh: [jobId: string];
  openRevision: [revision: number];
}>();

const canAccess = (job: DeploymentJobItem) =>
  !props.showDuration && props.getJobStateNumber(job) === 1 && hasNode(job);

const copiedJob = ref("");
const copyJob = (job: string) => {
  navigator.clipboard?.writeText(job);
  copiedJob.value = job;
  setTimeout(() => {
    if (copiedJob.value === job) copiedJob.value = "";
  }, 1400);
};

const stateLabel = (n: number) =>
  ({ 0: "Queued", 1: "Running", 2: "Completed", 3: "Stopped" })[n] || "Unknown";

const timeLabel = (job: DeploymentJobItem) =>
  props.showDuration
    ? formatTimeAgo(job.created_at)
    : `${props.getJobStateNumber(job) === 0 ? "listed" : "started"} ${formatTimeAgo(
        job.created_at,
      )}`;
</script>

<style lang="scss" scoped>
.jrow {
  position: relative;
  display: block;
  padding: 0.95rem 1.1rem;
  color: inherit;
  text-decoration: none;

  &:hover {
    background: $surface-hover;
  }

  & + &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 1.1rem;
    right: 1.1rem;
    height: 1px;
    background: $border-soft;
  }
}

/* Status mark plus its gutter; the usage strip lines up with the id. */
$mark-size: 14px;
$content-indent: 1.75rem;

.jrow-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

/* Row order: status mark · id over time · (space) · duration · actions · chevron */
.jrow-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1 1 auto;
}

/* Covers the whole row head, under the chip and the right-hand cluster. */
.jrow-link {
  position: absolute;
  inset: -0.95rem -1.1rem;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid $secondary;
    outline-offset: -3px;
  }
}

.smark {
  margin-right: calc(#{$content-indent} - #{$mark-size} - 0.75rem);
}

.jinfo {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.jinfo-top {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

/* The GPU carries the row, so it gets the weight the address used to have. */
.jname {
  font-family: $title-family;
  font-weight: 600;
  font-size: 0.9rem;
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Address, copy control and time on one line under the name — the same line
   the deployment header runs beneath its own title. */
.jsub {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.jsep {
  color: $text-muted;
  font-size: 0.75rem;
}

.jrow-usage {
  padding-left: $content-indent;
}

.jtime {
  color: $text-muted;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.jrow-right {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Only the buttons lift above the stretched link; the duration, the wait note
   and the chevron stay part of the row's own click target. */
.jrow-actions {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.4rem;

  /* A queued job has no actions; don't leave its gap behind. */
  &:empty {
    display: none;
  }
}

.dur {
  color: $text;
  font-weight: 500;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.jid {
  font-size: 0.75rem;
  color: $text-muted;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Above the row's stretched click target, so it copies instead of opening. */
.copy-btn {
  position: relative;
  z-index: 1;
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 0;
  background: transparent;
  color: $text-muted;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  svg {
    width: 11px;
    height: 11px;
  }

  &:hover {
    background: $surface-hover;
    color: $text;
  }

  &.is-copied {
    color: $secondary;
  }
}

/* Row actions: a matched pair of pills, quiet until hovered so they don't
   compete with the job id in a dense table. */
.jrow-actions .button.is-quiet {
  height: 28px;
  padding: 0 0.65rem;
  border-radius: 999px;
  border-color: $grey-lightest;
  color: $grey-dark;
  font-size: 0.72rem;
  font-weight: 600;

  /* Green at rest: the icon is what carries the colour in an otherwise
     monochrome row, and hover shifts the pill around it. */
  .icon {
    color: $secondary;
    /* Bulma pulls the leading icon outward; a pill wants it inset. */
    margin-inline: 0 0.3rem;

    svg {
      width: 13px;
      height: 13px;
    }
  }

  &:hover,
  &:focus-visible {
    border-color: rgba($secondary, 0.55);
    background: rgba($secondary, 0.08);
    color: $text;
  }
}

html.dark-mode .jrow-actions .button.is-quiet {
  border-color: rgba($white, 0.12);
  color: $grey-light;

  &:hover,
  &:focus-visible {
    border-color: rgba($secondary, 0.45);
    background: rgba($secondary, 0.12);
    color: $white;
  }
}

/* Sits above .jrow-link so it can jump to the revision instead of the job. */
/* inline-flex + line-height:1 so the chip is a tight box the row can centre on
   the job id, and so the `#-` fallback span matches the button. */
.rev-chip {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  line-height: 1;
  border: 0;
  font-family: inherit;
  font-size: 0.72rem;
  color: $grey-dark;
  background: $surface-sunken;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

button.rev-chip {
  cursor: pointer;

  /* Already sunken, so it darkens on hover; $surface-hover is for white. */
  &:hover {
    color: $text;
    background: $surface-track;
  }

  &:focus-visible {
    outline: 2px solid $secondary;
    outline-offset: 1px;
  }
}

.jchev {
  flex: none;
  display: inline-flex;
  color: $text-muted;

  svg {
    width: 16px;
    height: 16px;
  }
}

.jrow:hover .jchev {
  color: $text-muted;
}

.jwait-inline {
  color: $text-muted;
  font-size: 0.75rem;
  font-style: italic;
  white-space: nowrap;
}

@media screen and (max-width: 768px) {
  .rev-chip {
    display: none;
  }
}

/* Dark mode */
html.dark-mode .jrow:hover {
  background: rgba($white, 0.03);
}

html.dark-mode .jrow + .jrow::before {
  background: rgba($white, 0.08);
}

html.dark-mode .jname {
  color: $white;
}

html.dark-mode .copy-btn:hover {
  background: rgba($white, 0.08);
  color: $white;
}

html.dark-mode .rev-chip {
  background: rgba($white, 0.08);
  color: $grey-light;
}

html.dark-mode button.rev-chip:hover {
  background: rgba($white, 0.16);
  color: $white;
}

html.dark-mode .dur {
  color: $white;
}
</style>
