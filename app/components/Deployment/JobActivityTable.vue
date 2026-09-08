<template>
  <div class="jrows">
    <div
      v-for="job in jobs"
      :key="job.job"
      class="jrow"
      :class="{ 'is-live': !showDuration && getJobStateNumber(job) === 1 }"
    >
      <div class="jrow-head">
        <!-- The button stretches over the whole row (see .jrow-link::after)
             and opens the job panel; the action buttons sit above it. -->
        <button
          type="button"
          class="jrow-link"
          :aria-label="`Open job ${job.job}`"
          @click="emit('open', job.job)"
        >
          <span class="jstat" :class="stateClass(getJobStateNumber(job))">
            <span class="jdot"></span>
            <span class="jlab">{{ stateLabel(getJobStateNumber(job)) }}</span>
          </span>
          <span class="rev-chip is-family-monospace"
            >Revision {{ job.revision ?? "-" }}</span
          >
          <!-- Same shape as the deployment id in the page header -->
          <span class="jid is-family-monospace">{{
            truncateMiddle(job.job, 8, 6)
          }}</span>
          <span
            v-if="!showDuration && getJobStateNumber(job) === 0"
            class="jwait-inline"
            >awaiting node…</span
          >
        </button>

        <div class="jrow-actions">
          <!-- A queued job has produced no logs yet -->
          <button
            v-if="getJobStateNumber(job) !== 0"
            type="button"
            class="button is-small is-quiet"
            :title="`Show logs for job ${job.job}`"
            @click="emit('viewLogs', job.job)"
          >
            <span class="icon is-small">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h10M4 18h13" />
              </svg>
            </span>
            <span class="is-hidden-mobile">Logs</span>
          </button>
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
        </div>

        <span class="jmeta">
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
          <span>{{
            showDuration
              ? formatTimeAgo(job.created_at)
              : `${getJobStateNumber(job) === 0 ? "listed" : "started"} ${formatTimeAgo(
                  job.created_at,
                )}`
          }}</span>
        </span>
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

      <!-- Live per-job usage. The strip renders only while the node's stats
           stream is actually connected (handled inside the component). -->
      <JobUsageStrip
        v-if="!showDuration && getJobStateNumber(job) === 1 && hasNode(job)"
        :jobId="job.job"
        :deployment-id="deploymentId"
        :node="job.node as string"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentJobItem } from "@nosana/api";
import SecondsFormatter from "~/components/SecondsFormatter.vue";
import JobUsageStrip from "~/components/Deployment/JobUsageStrip.vue";
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
}>();

const emit = defineEmits<{
  open: [jobId: string];
  viewLogs: [jobId: string];
  openSsh: [jobId: string];
}>();

const canAccess = (job: DeploymentJobItem) =>
  !props.showDuration && props.getJobStateNumber(job) === 1 && hasNode(job);

// Numeric job state (0-3) → presentation class + label.
const stateClass = (n: number) =>
  ({ 0: "queued", 1: "running", 2: "completed", 3: "stopped" })[n] || "stopped";
const stateLabel = (n: number) =>
  ({ 0: "Queued", 1: "Running", 2: "Completed", 3: "Stopped" })[n] || "Unknown";
</script>

<style lang="scss" scoped>
.jrow {
  position: relative;
  display: block;
  padding: 0.95rem 1.1rem;
  color: inherit;
  text-decoration: none;

  &:hover {
    background: $white-bis;
  }

  & + &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 1.1rem;
    right: 1.1rem;
    height: 1px;
    background: $grey-lighter;
  }
}

.jrow-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

/* Row order: status · revision · address · actions · (space) · time · chevron */
.jrow-link {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
  flex: none;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  text-decoration: none;
  cursor: pointer;

  /* Stretch the click target over the whole row head. */
  &::after {
    content: "";
    position: absolute;
    inset: -0.95rem -1.1rem;
    border-radius: 6px;
  }

  &:focus-visible {
    outline: none;

    &::after {
      outline: 2px solid $secondary;
      outline-offset: -3px;
    }
  }
}

/* Buttons stay clickable above the stretched link. */
.jrow-actions {
  position: relative;
  z-index: 1;
  flex: none;
  display: flex;
  gap: 0.4rem;
}

/* Status = colored dot + label (no heavy icon) */
.jstat {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.jdot {
  position: relative;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
  background: $grey-light;
}

.jlab {
  font-size: 0.85rem;
  font-weight: 500;
  color: $text;
}

.jstat.queued .jdot {
  background: $warning;
}
.jstat.running .jdot {
  background: $success;
}
.jstat.running .jdot::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px solid $success;
  opacity: 0.5;
  animation: jpulse 2.4s ease-out infinite;
}
.jstat.completed .jdot {
  background: $info;
}
.jstat.stopped .jdot {
  background: $grey-light;
}

@keyframes jpulse {
  0% {
    transform: scale(0.5);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.jid {
  font-size: 0.8rem;
  color: $text;
}

.rev-chip {
  font-size: 0.72rem;
  color: $grey-dark;
  background: $white-ter;
  padding: 2px 9px;
  border-radius: 999px;
  white-space: nowrap;
}

.jmeta {
  flex: none;
  margin-left: auto;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: $grey;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;

  .dur {
    color: $text;
    font-weight: 500;
  }
}

.jchev {
  flex: none;
  display: inline-flex;
  color: $grey-light;

  svg {
    width: 16px;
    height: 16px;
  }
}

.jrow:hover .jchev {
  color: $grey;
}

.jwait-inline {
  font-size: 0.72rem;
  color: $grey;
  font-style: italic;
  white-space: nowrap;
}

@media screen and (max-width: 768px) {
  .jid {
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

html.dark-mode .jlab,
html.dark-mode .jid {
  color: $white;
}

html.dark-mode .rev-chip {
  background: rgba($white, 0.08);
  color: $grey-light;
}

html.dark-mode .jmeta .dur {
  color: $white;
}
</style>
