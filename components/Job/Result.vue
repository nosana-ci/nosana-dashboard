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
          <img src="~/assets/img/icons/fullscreen.svg" alt="Fullscreen" />
        </span>
      </button>

      <div v-if="ipfsResult.opStates" class="is-family-monospace has-background-black has-text-white box light-mode result-box job-result-container" style="counter-reset: line" ref="resultContainer">
        <div v-for="opState in ipfsResult.opStates" :key="opState.operationId">
          <div class="row-count has-text-link">
            <span>- Executed step '{{ opState.operationId }}'</span>
          </div>
          <div v-for="(log, ik) in opState.logs" :key="ik" class="row-count">
            <span class="pre" v-html="escapeHtml(log.log.slice(0, 10000))" />
          </div>
          <div class="row-count"></div>
          <div v-if="opState.status" class="row-count" :class="{
        'has-text-link': !opState.exitCode,
      }">
            {{ `Exited with status ${opState.status} with code ${opState.exitCode
        } ` }}
          </div>

        </div>
      </div>
      <div v-else-if="ipfsJob && ipfsJob.ops" class="is-family-monospace has-background-black has-text-white box result-box job-result-container"
        style="counter-reset: line" ref="resultContainer">
        <div v-for="jobName in (ipfsJob.ops.find((j: any) => j.id === 'checkout')
        ? []
        : ['checkout']
      ).concat(ipfsJob.ops.map((j: any) => j.name || j.id))" :key="jobName">
          <template v-if="ipfsResult &&
        ipfsResult.results &&
        ipfsResult.results[jobName] &&
        !jobName.endsWith('-volume')
        ">
            <div class="row-count has-text-link">
              <span>- Executed step '{{ jobName }}'</span>
            </div>
            <div v-if="typeof ipfsResult.results[jobName][1] === 'string' &&
        (!ipfsResult.results[jobName][2] ||
          (Array.isArray(ipfsResult.results[jobName][2]) &&
            ipfsResult.results[jobName][2].length === 0))
        " class="row-count">
              <span>{{ ipfsResult.results[jobName][1] }}</span>
            </div>
            <div v-for="(step, index) in ipfsResult.results[jobName][2] &&
        Array.isArray(ipfsResult.results[jobName][2])
        ? ipfsResult.results[jobName][2][1]
        : ipfsResult.results[jobName][1]" v-else :key="index">
              <span v-if="typeof ipfsResult.results[jobName][1] === 'string' &&
        ipfsResult.results[jobName][2] &&
        index === 0
        " class="row-count">
                {{ ipfsResult.results[jobName][1] }}</span>
              <div v-if="step.cmd && false" class="row-count" :class="{
        'has-text-accent': !step.status,
      }">
                <span v-if="step.cmd.cmd" class="has-text-weight-bold">
                  <span v-if="!step.cmd.cmd.startsWith('sh -c')">$ {{ step.cmd.cmd }}</span>
                  <i v-else class="has-text-grey">executing through sh -c</i>
                </span>
                <span v-else class="has-text-weight-bold">$ {{ step.cmd }}</span>
              </div>
              <div v-if="step.log && Array.isArray(step.log)">
                <div v-for="(log, ik) in step.log" :key="ik" class="row-count">
                  <span class="pre" v-html="escapeHtml(log[1].slice(0, 10000))" />
                </div>
                <div v-if="step.error" class="row-count">
                  <span class="has-text-weight-bold">{{ step.error }}</span>
                </div>
                <div v-if="step.status" class="row-count">
                  <span class="has-text-weight-bold">Exited with code {{ step.status }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
        <template v-if="ipfsResult && ipfsResult.results && ipfsResult.results['nosana/error']
        ">
          <div class="row-count">
            {{ ipfsResult.results['nosana/error'] }}
          </div>
        </template>
      </div>
    </div>

    <FullscreenModal :isOpen="resultModal.isOpen.value" title="Job Results" @close="resultModal.close">
      <div v-if="ipfsResult.opStates" class="is-family-monospace has-background-black has-text-white box light-mode result-box job-result-container fullscreen-viewer" style="counter-reset: line" ref="fullscreenResultContainer">
        <div v-for="opState in ipfsResult.opStates" :key="opState.operationId">
          <div class="row-count has-text-link">
            <span>- Executed step '{{ opState.operationId }}'</span>
          </div>
          <div v-for="(log, ik) in opState.logs" :key="ik" class="row-count">
            <span class="pre" v-html="escapeHtml(log.log.slice(0, 10000))" />
          </div>
          <div class="row-count"></div>
          <div v-if="opState.status" class="row-count" :class="{
        'has-text-link': !opState.exitCode,
      }">
            {{ `Exited with status ${opState.status} with code ${opState.exitCode
        } ` }}
          </div>
        </div>
      </div>
      <div v-else-if="ipfsJob && ipfsJob.ops" class="is-family-monospace has-background-black has-text-white box result-box job-result-container fullscreen-viewer"
        style="counter-reset: line" ref="fullscreenResultContainer">
        <div v-for="jobName in (ipfsJob.ops.find((j: any) => j.id === 'checkout')
        ? []
        : ['checkout']
      ).concat(ipfsJob.ops.map((j: any) => j.name || j.id))" :key="jobName">
          <template v-if="ipfsResult &&
        ipfsResult.results &&
        ipfsResult.results[jobName] &&
        !jobName.endsWith('-volume')
        ">
            <div class="row-count has-text-link">
              <span>- Executed step '{{ jobName }}'</span>
            </div>
            <div v-if="typeof ipfsResult.results[jobName][1] === 'string' &&
        (!ipfsResult.results[jobName][2] ||
          (Array.isArray(ipfsResult.results[jobName][2]) &&
            ipfsResult.results[jobName][2].length === 0))
        " class="row-count">
              <span>{{ ipfsResult.results[jobName][1] }}</span>
            </div>
            <div v-for="(step, index) in ipfsResult.results[jobName][2] &&
        Array.isArray(ipfsResult.results[jobName][2])
        ? ipfsResult.results[jobName][2][1]
        : ipfsResult.results[jobName][1]" v-else :key="index">
              <span v-if="typeof ipfsResult.results[jobName][1] === 'string' &&
        ipfsResult.results[jobName][2] &&
        index === 0
        " class="row-count">
                {{ ipfsResult.results[jobName][1] }}</span>
              <div v-if="step.cmd && false" class="row-count" :class="{
        'has-text-accent': !step.status,
      }">
                <span v-if="step.cmd.cmd" class="has-text-weight-bold">
                  <span v-if="!step.cmd.cmd.startsWith('sh -c')">$ {{ step.cmd.cmd }}</span>
                  <i v-else class="has-text-grey">executing through sh -c</i>
                </span>
                <span v-else class="has-text-weight-bold">$ {{ step.cmd }}</span>
              </div>
              <div v-if="step.log && Array.isArray(step.log)">
                <div v-for="(log, ik) in step.log" :key="ik" class="row-count">
                  <span class="pre" v-html="escapeHtml(log[1].slice(0, 10000))" />
                </div>
                <div v-if="step.error" class="row-count">
                  <span class="has-text-weight-bold">{{ step.error }}</span>
                </div>
                <div v-if="step.status" class="row-count">
                  <span class="has-text-weight-bold">Exited with code {{ step.status }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
        <template v-if="ipfsResult && ipfsResult.results && ipfsResult.results['nosana/error']
        ">
          <div class="row-count">
            {{ ipfsResult.results['nosana/error'] }}
          </div>
        </template>
      </div>
    </FullscreenModal>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import FullscreenModal from '~/components/Common/FullscreenModal.vue';
import { useModal } from '~/composables/jobs/useModal';
import { escapeHtml } from '~/utils/htmlSanitization';

defineProps({
  ipfsJob: {
    type: Object,
    required: true,
  },
  ipfsResult: {
    type: Object,
    required: true,
  },
});

const resultContainer = ref<HTMLElement | null>(null);
const fullscreenResultContainer = ref<HTMLElement | null>(null);
const resultModal = useModal();


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
  scrollToBottom(resultContainer.value);
});

// Expose scrollToBottom for parent components
defineExpose({
  scrollToBottom
});
</script>
<style lang="scss" scoped>
.result-tab-container {
  position: relative;
}

.result-content-wrapper {
  position: relative;
}

.fullscreen-result-button {
  position: absolute;
  top: 0.2rem; /* Adjusted from 0.5rem as per user feedback */
  right: 0.2rem;
  z-index: 10;
  background-color: #ffffff !important;
  border: 1px solid #e8e8e8 !important;
  padding: 0.4rem 0.6rem !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
  line-height: 1;

  .icon img {
    width: 16px;
    height: 16px;
    display: block;
  }

  &:hover {
    background-color: #f5f5f5 !important;
    border-color: #dadada !important;
  }
}

html.dark-mode .fullscreen-result-button {
  background-color: #363636 !important;
  border-color: #4d4d4d !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;

  &:hover {
    background-color: #444444 !important;
    border-color: #5a5a5a !important;
  }
  .icon img {
    filter: invert(1);
  }
}

.result-box {
  box-shadow: none !important;
  border: none !important;
}

.job-result-container {
  height: 40vh;
  overflow-y: auto;
  min-height: 200px;
  
  &.fullscreen-viewer {
    height: 100%;
    min-height: unset;
    /* The scrollbar is now managed by this container directly */
  }
}

/* Removed modal-specific styles as they are now in FullscreenModal.vue */

.pre {
  white-space: pre-wrap;
}

.row-count {
  word-break: break-word;
  max-width: 85%;
  padding-left: 40px;

  &:before {
    counter-increment: line;
    font-family: $family-monospace;
    font-weight: normal;
    content: counter(line);
    display: inline-block;
    padding: 0 0.5em;
    margin-right: 0.5em;
    color: $grey !important;
    min-width: 50px;
    text-align: right;
    margin-left: -62px;
  }

  &.has-text-danger:before {
    color: $red !important;
  }
}
</style>

