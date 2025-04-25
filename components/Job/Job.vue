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
          job.node && job.node.toString() !== '11111111111111111111111111111111'
        "
        :address="job.address"
        :node="job.node.toString()"
        :project="job.project.toString()"
        :market="job.market.toString()"
        :usdRewardPerHour="job.usdRewardPerHour"
        :timeStart="job.timeStart"
        :timeEnd="job.timeEnd"
        :timeout="job.timeout"
        :jobDefinition="job.jobDefinition"
        :isCompleted="job.isCompleted"
        :state="job.state"
      />
      <HostSpecifications
        v-if="
          job.node && job.node.toString() !== '11111111111111111111111111111111'
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
import { computed } from 'vue';

interface Props {
  job: UseJob;
  modal: UseModal;
  endpoints: Endpoints;
  nosPrice: number;
  isJobPoster: boolean;
}

const { job, isJobPoster, endpoints, modal, nosPrice } = defineProps<Props>();
const { userBalances, signMessage } = useNosanaWallet();

const {
  isConnecting,
  logs,
  progressBars,
  resourceProgressBars,
  initLogs,
  closeLogs,
} = useJobLogs(job.address, job.node, endpoints, isJobPoster, signMessage);
</script>
