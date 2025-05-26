<template>
  <JobToolbar
    :job="job"
    :endpoints="endpoints"
    :isVerifed="false"
    :isJobPoster="isJobPoster"
    :openExtendModal="modal.open"
  />
  <table class="table is-fullwidth mt-4">
    <tbody>
      <DeploymentInfo
        v-if="
          job && job.node && job.node.toString() !== '11111111111111111111111111111111'
        "
        :address="job.address"
        :node="job.node.toString()"
        :project="job.project.toString()"
        :market="job.market.toString()"
        :usdRewardPerHour="job.usdRewardPerHour || 0"
        :timeStart="job.timeStart"
        :timeEnd="job.timeEnd"
        :timeout="job.timeout"
        :jobDefinition="job.jobDefinition"
        :isCompleted="job.isCompleted"
        :state="job.state"
      />
      <HostSpecifications
        v-if="
          job && job.node && job.node.toString() !== '11111111111111111111111111111111'
        "
        :node-address="job.node.toString()"
      />
    </tbody>
  </table>
  <JobTabs
    v-if="job.jobDefinition"
    :job="job"
    :endpoints="endpoints"
    :isJobPoster="isJobPoster"
    :jobDefinition="job.jobDefinition"
    :hasArtifacts="false"
    :isConnecting="isConnecting"
    :logs="logs"
    :progressBars="progressBars"
    :resourceProgressBars="resourceProgressBars"
    :showChatTab="isChatServiceReady"
    :chatServiceUrl="chatServiceUrl"
    v-model:activeTab="activeJobTab"
  />
  <ExtendModal
    v-if="modal.isOpen.value && job"
    :job="job"
    :nosPrice="nosPrice"
    :closeExtendModal="modal.close"
    :userBalances="userBalances"
  />
  <LogSubscription
    v-if="isJobPoster && job.isRunning"
    :initLogs="initLogs"
    :closeLogs="closeLogs"
  />

  <!-- Chat Popup -->
  <div v-if="showChatPopup" class="chat-prompt-popup">
    <div class="popup-content">
      <p>The model’s ready. Would you like to test it out in chat?</p>
      <button @click="activateChatAndClosePopup">Open Test-Chat</button>
      <button @click="showChatPopup = false">Dismiss</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import JobTabs from "~/components/Job/Tabs.vue";
import DeploymentInfo from "~/components/Info/DeploymentInfo.vue";
import HostSpecifications from "~/components/Info/HostSpecifications.vue";
import JobToolbar from "~/components/Job/JobToolbar.vue";
import ExtendModal from "~/components/Job/Modals/Extend.vue";

import LogSubscription from "./LogSubscription.vue";
import { useJobLogs } from "~/composables/jobs/useJobLogs";

import type { UseModal } from "~/composables/jobs/useModal";
import type { Endpoints, UseJob } from "~/composables/jobs/useJob";
import { computed, ref, watch, watchEffect, nextTick } from 'vue';
import type { JobDefinition, ExposedPort, Operation, OperationArgsMap, HttpHealthCheck } from '@nosana/sdk';

interface Props {
  job: UseJob;
  modal: UseModal;
  endpoints: Endpoints;
  nosPrice: number;
  isJobPoster: boolean;
}

const { job, isJobPoster, endpoints, modal, nosPrice } = defineProps<Props>();
const { userBalances, signMessage } = useNosanaWallet();

const activeJobTab = ref('logs'); // Default active tab
const isChatServiceReady = ref(false); // Controls chat tab visibility

const showChatPopup = ref(false);
const chatServiceUrl = ref<string | null>(null);
const popupAlreadyShown = ref(false);

const hasOpenaiEndpoint = computed(() => {
  if (!job.jobDefinition || !job.jobDefinition.ops) {
    return false;
  }

  for (const op of job.jobDefinition.ops) {
    if (op.type === 'container/run') {
      const args = op.args as OperationArgsMap['container/run'];
      if (args.expose && Array.isArray(args.expose)) {
        const exposedPorts = args.expose.filter(
          (e): e is ExposedPort => typeof e === 'object' && e !== null && 'health_checks' in e
        );
        for (const exposedPort of exposedPorts) {
          if (exposedPort.health_checks) {
            for (const healthCheck of exposedPort.health_checks) {
              if (healthCheck.type === 'http') {
                const httpCheck = healthCheck as HttpHealthCheck;
                if (
                  httpCheck.path.includes("/v1") &&
                  httpCheck.method === "POST"
                ) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
  }
  return false;
});

const {
  isConnecting,
  logs,
  progressBars,
  resourceProgressBars,
  initLogs,
  closeLogs,
} = useJobLogs(job.address, job.node, endpoints, isJobPoster, signMessage);

watchEffect(() => {
  if (hasOpenaiEndpoint.value && job?.jobDefinition && endpoints) {
    for (const [url, endpointData] of endpoints.entries()) {
      const op = job.jobDefinition.ops[endpointData.opIndex];
      if (op && op.type === 'container/run') {
        const args = op.args as OperationArgsMap['container/run'];
        if (args.expose && Array.isArray(args.expose)) {
          const exposedPorts = args.expose.filter(
            (e): e is ExposedPort => typeof e === 'object' && e !== null && 'health_checks' in e
          );
          for (const exposedPort of exposedPorts) {
            if (exposedPort.health_checks) {
              for (const healthCheck of exposedPort.health_checks) {
                if (healthCheck.type === 'http') {
                  const httpCheck = healthCheck as HttpHealthCheck;
                  if (
                    httpCheck.path.includes("/v1") &&
                    httpCheck.method === "POST"
                  ) {
                    chatServiceUrl.value = url;
                    return; // Found our chat service
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});

watch([chatServiceUrl, endpoints], ([newUrl, currentEndpoints]) => {
  if (newUrl && currentEndpoints.has(newUrl)) {
    const serviceInfo = currentEndpoints.get(newUrl);
    if (serviceInfo && serviceInfo.status === 'ONLINE') {
      isChatServiceReady.value = true; // Enable the chat tab
      if (!popupAlreadyShown.value) {
        showChatPopup.value = true;
        popupAlreadyShown.value = true; // Ensure popup is shown only once
      }
    }
  }
}, { deep: true }); // deep true for endpoints map

function activateChatAndClosePopup() {
  showChatPopup.value = false;
  activeJobTab.value = 'chat'; // Switch to the chat tab
  
  // Scroll to bottom to show the chat UI properly
  nextTick(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  });
}

</script>

<style lang="scss" scoped>
// --- Global Variables (subset for popup) ---
$nosana-green: #1bff45;
$nosana-darker: #030303;
$nosana-border: #222;
$text-light: #ffffff;
$text-secondary: rgba(white, 0.7);
$border-radius: 12px;

.chat-prompt-popup {
  position: fixed;
  top: 50%; 
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba($nosana-darker, 0.95); 
  border: 1px solid $nosana-green;
  color: $text-light;
  padding: 20px;
  border-radius: $border-radius;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  text-align: center;

  .popup-content {
    p {
      margin-bottom: 15px;
      font-size: 16px;
    }
    button {
      background-color: $nosana-green;
      color: $nosana-darker; // Changed from $nosana-dark for better contrast with green
      border: none;
      padding: 10px 15px;
      border-radius: 6px;
      cursor: pointer;
      margin: 0 10px;
      font-weight: 500;
      transition: background-color 0.2s;
      &:hover {
        background-color: lighten($nosana-green, 10%);
      }
      &:last-child { // Style for the "Dismiss" button
        background-color: rgba($text-secondary, 0.3);
        color: $text-light;
        &:hover {
          background-color: rgba($text-secondary, 0.5);
        }
      }
    }
  }
}
</style>
