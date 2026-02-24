<template>
  <div class="result-tab-container">
    <div class="result-content-wrapper" ref="resultWrapper">
      <!-- Fullscreen button -->
      <button
        class="button is-small is-text fullscreen-result-button"
        @click="resultModal.open"
        title="Fullscreen Results"
      >
        <span class="icon is-small">
          <FullscreenIcon />
        </span>
      </button>

      <div
        v-if="ipfsResult?.opStates"
        class="is-family-monospace has-background-black has-text-white box light-mode result-box job-result-container result-with-counter"
        ref="resultContainer"
      >
        <template v-if="hasAnyContent(ipfsResult?.opStates || [])">
          <div
            v-for="opState in ipfsResult?.opStates || []"
            :key="opState.operationId"
          >
            <div class="row-count has-text-link">
              <span>- Executed step '{{ opState.operationId }}'</span>
            </div>
            <div
              v-for="(log, ik) in opState.logs || []"
              :key="ik"
              class="row-count"
            >
              <span
                class="pre"
                v-html="escapeHtml((log?.log || '').slice(0, 10000))"
              />
            </div>
            <div class="row-count"></div>
            <div
              v-if="opState.status"
              class="row-count"
              :class="{
                'has-text-link': !opState.exitCode,
              }"
            >
              {{
                `Exited with status ${opState.status} with code ${
                  opState.exitCode
                } `
              }}
            </div>
            <div v-if="getOpError(opState)" class="row-count has-text-danger">
              <span class="has-text-weight-bold">{{
                getOpError(opState)
              }}</span>
            </div>
          </div>
        </template>
        <template
          v-if="
            ipfsResult?.status ||
            (ipfsResult?.errors && (ipfsResult.errors as any[]).length > 0)
          "
        >
          <div v-if="ipfsResult?.status" class="row-count has-text-danger">
            <span class="has-text-weight-bold"
              >Status: {{ ipfsResult.status }}</span
            >
          </div>
          <div
            v-for="(error, i) in (ipfsResult?.errors as any[]) || []"
            :key="i"
            class="row-count has-text-danger"
          >
            <span>{{
              typeof error === "string" ? error : JSON.stringify(error)
            }}</span>
          </div>
        </template>
        <div v-else class="row-count">
          <span>No logs available</span>
        </div>
      </div>
      <div
        v-else-if="ipfsJob?.ops"
        class="is-family-monospace has-background-black has-text-white box result-box job-result-container result-with-counter"
        ref="resultContainer"
      >
        <template v-if="hasLegacyContent(ipfsResult, ipfsJob)">
          <div
            v-for="jobName in (ipfsJob.ops.find((j: any) => j.id === 'checkout')
              ? []
              : ['checkout']
            ).concat(ipfsJob.ops.map((j: any) => j.name || j.id))"
            :key="jobName"
          >
            <template
              v-if="
                ipfsResult &&
                ipfsResult.results &&
                ipfsResult.results[jobName] &&
                !jobName.endsWith('-volume')
              "
            >
              <div class="row-count has-text-link">
                <span>- Executed step '{{ jobName }}'</span>
              </div>
              <div
                v-if="
                  typeof ipfsResult.results[jobName][1] === 'string' &&
                  (!ipfsResult.results[jobName][2] ||
                    (Array.isArray(ipfsResult.results[jobName][2]) &&
                      ipfsResult.results[jobName][2].length === 0))
                "
                class="row-count"
              >
                <span>{{ ipfsResult.results[jobName][1] }}</span>
              </div>
              <div
                v-for="(step, index) in ipfsResult.results[jobName][2] &&
                Array.isArray(ipfsResult.results[jobName][2])
                  ? ipfsResult.results[jobName][2][1]
                  : ipfsResult.results[jobName][1]"
                v-else
                :key="index"
              >
                <span
                  v-if="
                    typeof ipfsResult.results[jobName][1] === 'string' &&
                    ipfsResult.results[jobName][2] &&
                    index === 0
                  "
                  class="row-count"
                >
                  {{ ipfsResult.results[jobName][1] }}</span
                >
                <div
                  v-if="step.cmd && false"
                  class="row-count"
                  :class="{
                    'has-text-accent': !step.status,
                  }"
                >
                  <span v-if="step.cmd.cmd" class="has-text-weight-bold">
                    <span v-if="!step.cmd.cmd.startsWith('sh -c')"
                      >$ {{ step.cmd.cmd }}</span
                    >
                    <i v-else class="has-text-grey">executing through sh -c</i>
                  </span>
                  <span v-else class="has-text-weight-bold"
                    >$ {{ step.cmd }}</span
                  >
                </div>
                <div v-if="step.log && Array.isArray(step.log)">
                  <div
                    v-for="(log, ik) in step.log"
                    :key="ik"
                    class="row-count"
                  >
                    <span
                      class="pre"
                      v-html="escapeHtml((log?.[1] || '').slice(0, 10000))"
                    />
                  </div>
                  <div v-if="step.error" class="row-count">
                    <span class="has-text-weight-bold">{{ step.error }}</span>
                  </div>
                  <div v-if="step.status" class="row-count">
                    <span class="has-text-weight-bold"
                      >Exited with code {{ step.status }}</span
                    >
                  </div>
                </div>
              </div>
            </template>
          </div>
          <template
            v-if="
              ipfsResult &&
              ipfsResult.results &&
              ipfsResult.results['nosana/error']
            "
          >
            <div class="row-count">
              {{ ipfsResult.results["nosana/error"] }}
            </div>
          </template>
        </template>
        <div v-else class="row-count">
          <span>No logs available</span>
        </div>
      </div>
      <div
        v-else
        class="is-family-monospace has-background-black has-text-white box result-box job-result-container result-with-counter"
        ref="resultContainer"
      >
        <div class="row-count">
          <span>No logs available</span>
        </div>
      </div>
    </div>

    <FullscreenModal
      :isOpen="resultModal.isOpen.value"
      title="Job Results"
      @close="resultModal.close"
    >
      <div
        v-if="ipfsResult?.opStates"
        class="is-family-monospace has-background-black has-text-white box light-mode result-box job-result-container fullscreen-viewer result-with-counter"
        ref="fullscreenResultContainer"
      >
        <template v-if="hasAnyContent(ipfsResult?.opStates || [])">
          <div
            v-for="opState in ipfsResult?.opStates || []"
            :key="opState.operationId"
          >
            <div class="row-count has-text-link">
              <span>- Executed step '{{ opState.operationId }}'</span>
            </div>
            <div v-for="(log, ik) in opState.logs" :key="ik" class="row-count">
              <span
                class="pre"
                v-html="escapeHtml((log.log || '').slice(0, 10000))"
              />
            </div>
            <div class="row-count"></div>
            <div
              v-if="opState.status"
              class="row-count"
              :class="{
                'has-text-link': !opState.exitCode,
              }"
            >
              {{
                `Exited with status ${opState.status} with code ${
                  opState.exitCode
                } `
              }}
            </div>
            <div v-if="getOpError(opState)" class="row-count has-text-danger">
              <span class="has-text-weight-bold">{{
                getOpError(opState)
              }}</span>
            </div>
          </div>
        </template>
        <template
          v-if="
            ipfsResult?.status ||
            (ipfsResult?.errors && (ipfsResult.errors as any[]).length > 0)
          "
        >
          <div v-if="ipfsResult?.status" class="row-count has-text-danger">
            <span class="has-text-weight-bold"
              >Status: {{ ipfsResult.status }}</span
            >
          </div>
          <div
            v-for="(error, i) in (ipfsResult?.errors as any[]) || []"
            :key="i"
            class="row-count has-text-danger"
          >
            <span>{{
              typeof error === "string" ? error : JSON.stringify(error)
            }}</span>
          </div>
        </template>
        <div v-else class="row-count">
          <span>No logs available</span>
        </div>
      </div>
      <div
        v-else-if="ipfsJob && ipfsJob.ops"
        class="is-family-monospace has-background-black has-text-white box result-box job-result-container fullscreen-viewer result-with-counter"
        ref="fullscreenResultContainer"
      >
        <template v-if="hasLegacyContent(ipfsResult, ipfsJob)">
          <div
            v-for="jobName in (ipfsJob.ops.find((j: any) => j.id === 'checkout')
              ? []
              : ['checkout']
            ).concat(ipfsJob.ops.map((j: any) => j.name || j.id))"
            :key="jobName"
          >
            <template
              v-if="
                ipfsResult &&
                ipfsResult.results &&
                ipfsResult.results[jobName] &&
                !jobName.endsWith('-volume')
              "
            >
              <div class="row-count has-text-link">
                <span>- Executed step '{{ jobName }}'</span>
              </div>
              <div
                v-if="
                  typeof ipfsResult.results[jobName][1] === 'string' &&
                  (!ipfsResult.results[jobName][2] ||
                    (Array.isArray(ipfsResult.results[jobName][2]) &&
                      ipfsResult.results[jobName][2].length === 0))
                "
                class="row-count"
              >
                <span>{{ ipfsResult.results[jobName][1] }}</span>
              </div>
              <div
                v-for="(step, index) in ipfsResult.results[jobName][2] &&
                Array.isArray(ipfsResult.results[jobName][2])
                  ? ipfsResult.results[jobName][2][1]
                  : ipfsResult.results[jobName][1]"
                v-else
                :key="index"
              >
                <span
                  v-if="
                    typeof ipfsResult.results[jobName][1] === 'string' &&
                    ipfsResult.results[jobName][2] &&
                    index === 0
                  "
                  class="row-count"
                >
                  {{ ipfsResult.results[jobName][1] }}</span
                >
                <div
                  v-if="step.cmd && false"
                  class="row-count"
                  :class="{
                    'has-text-accent': !step.status,
                  }"
                >
                  <span v-if="step.cmd.cmd" class="has-text-weight-bold">
                    <span v-if="!step.cmd.cmd.startsWith('sh -c')"
                      >$ {{ step.cmd.cmd }}</span
                    >
                    <i v-else class="has-text-grey">executing through sh -c</i>
                  </span>
                  <span v-else class="has-text-weight-bold"
                    >$ {{ step.cmd }}</span
                  >
                </div>
                <div v-if="step.log && Array.isArray(step.log)">
                  <div
                    v-for="(log, ik) in step.log"
                    :key="ik"
                    class="row-count"
                  >
                    <span
                      class="pre"
                      v-html="escapeHtml((log?.[1] || '').slice(0, 10000))"
                    />
                  </div>
                  <div v-if="step.error" class="row-count">
                    <span class="has-text-weight-bold">{{ step.error }}</span>
                  </div>
                  <div v-if="step.status" class="row-count">
                    <span class="has-text-weight-bold"
                      >Exited with code {{ step.status }}</span
                    >
                  </div>
                </div>
              </div>
            </template>
          </div>
          <template
            v-if="
              ipfsResult &&
              ipfsResult.results &&
              ipfsResult.results['nosana/error']
            "
          >
            <div class="row-count">
              {{ ipfsResult.results["nosana/error"] }}
            </div>
          </template>
        </template>
        <div v-else class="row-count">
          <span>No logs available</span>
        </div>
      </div>
      <div
        v-else
        class="is-family-monospace has-background-black has-text-white box result-box job-result-container fullscreen-viewer result-with-counter"
        ref="fullscreenResultContainer"
      >
        <div class="row-count">
          <span>No logs available</span>
        </div>
      </div>
    </FullscreenModal>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, nextTick, watch } from "vue";
import FullscreenModal from "~/components/Common/FullscreenModal.vue";
import FullscreenIcon from "@/assets/img/icons/fullscreen.svg?component";
import { useModal } from "~/composables/jobs/useModal";
import { escapeHtml } from "~/utils/htmlSanitization";
import type { OpState } from "~/composables/jobs/types";

defineProps({
  ipfsJob: {
    type: Object,
    required: false,
    default: null,
  },
  ipfsResult: {
    type: Object,
    required: false,
    default: null,
  },
});

const resultContainer = ref<HTMLElement | null>(null);
const fullscreenResultContainer = ref<HTMLElement | null>(null);
const resultModal = useModal();

// Check if there's any content to display
const hasAnyContent = (opStates: OpState[] | null | undefined): boolean => {
  if (!opStates || opStates.length === 0) return false;
  return opStates.some((op) => {
    if (!op) return false;
    const hasLogs = op.logs && Array.isArray(op.logs) && op.logs.length > 0;
    const hasStatus = op.status;
    const hasError = getOpError(op);
    return hasLogs || hasStatus || hasError;
  });
};

// Check if legacy format has content
const hasLegacyContent = (ipfsResult: any, ipfsJob: any): boolean => {
  if (!ipfsResult || !ipfsJob?.ops) return false;
  if (ipfsResult.results && ipfsResult.results["nosana/error"]) return true;
  const jobNames = (
    ipfsJob.ops.find((j: any) => j.id === "checkout") ? [] : ["checkout"]
  ).concat(ipfsJob.ops.map((j: any) => j.name || j.id));
  return jobNames.some((jobName: string) => {
    return (
      ipfsResult.results &&
      ipfsResult.results[jobName] &&
      !jobName.endsWith("-volume")
    );
  });
};

// Extract meaningful error from diagnostics
const getOpError = (opState: OpState): string | null => {
  // First check for errors array (e.g., image-pull-error)
  if (
    opState.errors &&
    Array.isArray(opState.errors) &&
    opState.errors.length > 0
  ) {
    const errorMessages = opState.errors
      .map((err) => err.message || err.event || JSON.stringify(err))
      .filter(
        (msg): msg is string =>
          typeof msg === "string" && msg.trim().length > 0,
      );
    if (errorMessages.length > 0) {
      return errorMessages.join("; ");
    }
  }

  const diagnostics = opState.diagnostics;
  if (!diagnostics) return null;

  // Check for error or message fields
  if (
    diagnostics.error &&
    typeof diagnostics.error === "string" &&
    diagnostics.error.trim()
  ) {
    return diagnostics.error;
  }
  if (
    diagnostics.message &&
    typeof diagnostics.message === "string" &&
    diagnostics.message.trim()
  ) {
    return diagnostics.message;
  }

  // Check if reason object has any true values (actual errors)
  const reason = diagnostics.reason;
  if (reason && typeof reason === "object") {
    const hasError = reason.hostShutDown || reason.jobStopped || reason.expired;
    if (hasError) {
      const reasons: string[] = [];
      if (reason.hostShutDown) reasons.push("Host shut down");
      if (reason.jobStopped) reasons.push("Job stopped");
      if (reason.expired) reasons.push("Job expired");
      return reasons.join(", ");
    }
  }

  return null;
};

const scrollToBottom = (container?: HTMLElement | null) => {
  const targetContainer = container || resultContainer.value;
  if (targetContainer) {
    nextTick(() => {
      targetContainer.scrollTop = targetContainer.scrollHeight;
    });
  }
};

watch(resultModal.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      scrollToBottom(fullscreenResultContainer.value);
    });
  }
});

// Auto-scroll to bottom when component mounts for the inline view
onMounted(() => {
  nextTick(() => {
    scrollToBottom(resultContainer.value);
  });
});

// Expose scrollToBottom for parent components
defineExpose({
  scrollToBottom,
});
</script>
<style lang="scss" scoped>
@use "~/assets/styles/variables" as *;

.result-tab-container {
  position: relative;
}

.result-content-wrapper {
  position: relative;
}

.fullscreen-result-button {
  position: absolute;
  top: $size-7;
  right: $size-7;
  z-index: 10;
  background-color: $white !important;
  border: 1px solid $grey-lighter !important;
  padding: $size-7 $size-6 !important;
  box-shadow: $button-shadow !important;
  line-height: 1;

  .icon img {
    width: $size-5;
    height: $size-5;
    display: block;
  }

  &:hover {
    background-color: $grey-lightest !important;
    border-color: $grey-light !important;
  }
}

html.dark-mode .fullscreen-result-button {
  background-color: $black-ter !important;
  border-color: $grey-dark !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;

  &:hover {
    background-color: $grey-darker !important;
    border-color: $grey !important;
  }
  .icon img {
    filter: invert(1);
  }
}

.result-box {
  box-shadow: none !important;
  border: none !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.job-result-container {
  height: 40vh;
  overflow-y: auto;
  min-height: $size-1 * 5;
  padding-left: 0 !important;
  padding-right: 0 !important;

  &.fullscreen-viewer {
    height: 100%;
    min-height: unset;
  }
}

.result-with-counter {
  counter-reset: line;
}

.pre {
  white-space: pre-wrap;
}

.row-count {
  word-break: break-word;
  display: flex;
  align-items: flex-start;
  gap: $size-6;

  &:before {
    counter-increment: line;
    font-family: $family-monospace;
    font-weight: normal;
    content: counter(line);
    display: inline-block;
    padding: 0 0.5em;
    color: $grey !important;
    min-width: $size-1 * 1.2;
    text-align: right;
    flex-shrink: 0;
  }

  > * {
    flex: 1;
    min-width: 0;
  }

  &.has-text-danger:before {
    color: $danger !important;
  }
}
</style>
