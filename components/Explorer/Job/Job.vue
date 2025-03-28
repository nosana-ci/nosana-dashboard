<template>
  <JobToolbar
    :job="job"
    :endpoints="endpoints"
    :isVerifed="false"
    :isJobPoster="isJobPoster"
    :openExtendModal="modal.openExtendModal"
  />
  <ExplorerJobInfo
    :address="job.address"
    :node="job.node"
    :project="job.project"
    :market="job.market"
    :price="job.price"
    :timeStart="job.timeStart"
    :timeEnd="job.timeEnd"
    :timeout="job.timeout"
    :jobDefinition="job.jobDefinition"
    :isCompleted="job.isCompleted"
  />
  <JobNodeInfo
    v-if="
      job.node && job.node.toString() !== '11111111111111111111111111111111'
    "
    :address="job.node.toString()"
  />
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
    v-if="modal.extendModal.value && job"
    :job="job"
    :nosPrice="nosPrice"
    :closeExtendModal="modal.closeExtendModal"
    :userBalances="userBalances"
  />
  <LogSubscription
    v-if="isJobPoster && job.isRunning"
    :initLogs="initLogs"
    :closeLogs="closeLogs"
  />
</template>
<script setup lang="ts">
import JobTabs from "~/components/Explorer/Job/Tabs.vue";
import JobNodeInfo from "~/components/Node/JobNodeInfo.vue";
import JobToolbar from "~/components/Explorer/Job/JobToolbar.vue";
import ExtendModal from "~/components/Explorer/Job/Modals/Extend.vue";
import ExplorerJobInfo from "~/components/Explorer/Job/Info.vue";

import type { Endpoints, UseJob } from "~/composables/jobs/useJob";
import type { UseModal } from "~/composables/jobs/useExtendModal";
import { useJobLogs } from "~/composables/jobs/useJobLogs";
import LogSubscription from "./LogSubscription.vue";

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
