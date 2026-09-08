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
          <!-- The label lives in the status key below the table; screen
               readers still get it from the hidden span. -->
          <JobStatusDot
            :state="getJobStateNumber(job)"
            :pulse="!showDuration"
            :title="stateLabel(getJobStateNumber(job))"
          />
          <span class="is-sr-only">{{
            stateLabel(getJobStateNumber(job))
          }}</span>

          <span class="jinfo">
            <span class="jinfo-top">
              <!-- Same shape as the deployment id in the page header -->
              <span class="jid is-family-monospace">{{
                truncateMiddle(job.job, 8, 6)
              }}</span>
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
            <span class="jtime">{{ timeLabel(job) }}</span>
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
import JobStatusDot from "~/components/Deployment/JobStatusDot.vue";
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
  openRevision: [revision: number];
}>();

const canAccess = (job: DeploymentJobItem) =>
  !props.showDuration && props.getJobStateNumber(job) === 1 && hasNode(job);

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

/* Status dot (9px) plus its gutter; the usage strip lines up with the id. */
$content-indent: 1.75rem;

.jrow-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

/* Row order: status dot · id over time · (space) · duration · actions · chevron */
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

.jdot {
  margin-right: calc(#{$content-indent} - 9px - 0.75rem);
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
  font-size: 0.8rem;
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  background: $white-ter;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

button.rev-chip {
  cursor: pointer;

  &:hover {
    color: $text;
    background: $grey-lighter;
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

html.dark-mode .jid {
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
