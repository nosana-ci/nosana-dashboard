<template>
  <div>
    <div v-if="!operation && containerOperations.length > 1" class="field">
      <label class="label" :for="`${accessId}-operation`">
        Container operation
      </label>
      <div class="control">
        <div class="select">
          <select :id="`${accessId}-operation`" v-model="selectedOperation">
            <option value="" disabled>Select an operation</option>
            <option
              v-for="operation in containerOperations"
              :key="operation"
              :value="operation"
            >
              {{ operation }}
            </option>
          </select>
        </div>
      </div>
      <p class="help">
        Multi-container jobs require an operation before access can start.
      </p>
    </div>

    <div class="access-toolbar mb-4">
      <JobAccessMethodTabs
        v-model="activeMethod"
        :tabs="ACCESS_METHODS"
        :id-prefix="accessId"
        label="Access method"
      />
      <!-- Page-level controls that belong beside the tabs, e.g. a job picker -->
      <slot name="toolbar" />
    </div>

    <div
      :id="`${accessId}-panel`"
      role="tabpanel"
      :aria-labelledby="`${accessId}-${activeMethod}`"
      tabindex="0"
    >
      <div v-if="!operationReady" class="notification is-info is-light">
        Select a container operation to continue.
      </div>

      <template v-else>
        <!-- Kept mounted (v-show) so the shell survives a look at the other
             methods. Deployment-managed jobs need no wallet signature, so it
             opens as soon as this view is active. -->
        <section v-show="activeMethod === 'terminal'">
          <JobTerminal
            :key="`${deploymentId || ''}-${jobAddress}`"
            :job-address="jobAddress"
            :node="node"
            :op="selectedOperation || undefined"
            :deployment-id="deploymentId || undefined"
            :can-connect="canUseTerminalAccess"
            :disabled-reason="terminalAccessReason"
            :auto-connect="isDeploymentManaged && active && autoConnect"
            :cvm="cvm"
          />
        </section>

        <JobDirectSshPanel
          v-if="activeMethod === 'direct'"
          :job-address="jobAddress"
          :node="node"
          :operation-index="operationIndex"
          :public-keys="sshPublicKeys"
          :loading="sshKeysLoading"
          :error="sshKeysError"
          :is-deployment-managed="isDeploymentManaged"
          :deployment-id="deploymentId || undefined"
          @retry="emit('retry-ssh-keys')"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getSshPublicKeys, type JobDefinition } from "@nosana/kit";
import { useId } from "vue";
import { useWallet } from "@nosana/solana-vue";
import JobAccessMethodTabs from "~/components/Job/AccessMethodTabs.vue";
import JobDirectSshPanel from "~/components/Job/DirectSshPanel.vue";
import JobTerminal from "~/components/Job/Terminal.vue";
import {
  getTerminalAccessReason,
  getSshOperationIndex,
} from "~/utils/sshAccess";

type AccessMethod = "terminal" | "direct";

const ACCESS_METHODS: Array<{ id: AccessMethod; label: string }> = [
  { id: "terminal", label: "Web terminal" },
  { id: "direct", label: "Direct SSH" },
];

const props = withDefaults(
  defineProps<{
    jobAddress: string;
    node: string;
    projectAddress: string;
    jobDefinition: JobDefinition | null;
    isRunning: boolean;
    deploymentId?: string | null;
    sshPublicKeys?: string[];
    sshKeysLoading?: boolean;
    sshKeysError?: string;
    /** False while this view is mounted but hidden, so nothing auto-connects unseen. */
    active?: boolean;
    /** Pin the container operation instead of offering the selector. */
    operation?: string;
    /** Whether the web terminal may open on its own once active. */
    autoConnect?: boolean;
    /** The job runs in a confidential VM (CVM market). */
    cvm?: boolean;
  }>(),
  { active: true, autoConnect: true },
);
const emit = defineEmits<{ "retry-ssh-keys": [] }>();

const { account } = useWallet();
const accessId = `ssh-access-${useId()}`;
const activeMethod = ref<AccessMethod>("terminal");
const selectedOperation = ref(props.operation ?? "");

const isDeploymentManaged = computed(() => Boolean(props.deploymentId));

const containerOperations = computed(() =>
  (props.jobDefinition?.ops ?? [])
    .filter((operation) => operation.type === "container/run")
    .map((operation) => operation.id),
);
const operationIndex = computed(() =>
  getSshOperationIndex(props.jobDefinition, selectedOperation.value),
);
const operationReady = computed(() => operationIndex.value !== undefined);

const sshPublicKeys = computed(
  () =>
    props.sshPublicKeys ??
    (props.jobDefinition ? getSshPublicKeys(props.jobDefinition) : []),
);
const hasDirectSsh = computed(() => sshPublicKeys.value.length > 0);
const isWalletPoster = computed(
  () =>
    Boolean(account.value?.address) &&
    account.value?.address === props.projectAddress,
);
const terminalAccessReason = computed(() =>
  getTerminalAccessReason({
    isRunning: props.isRunning,
    operationReady: operationReady.value,
    walletAddress: account.value?.address,
    projectAddress: props.projectAddress,
    isDeploymentManaged: isDeploymentManaged.value,
  }),
);
// The reason is empty exactly when terminal access is allowed.
const canUseTerminalAccess = computed(() => !terminalAccessReason.value);

watch(
  containerOperations,
  (operations) => {
    if (props.operation) {
      selectedOperation.value = props.operation;
    } else if (operations.length === 1) {
      selectedOperation.value = operations[0] ?? "";
    } else if (!operations.includes(selectedOperation.value)) {
      selectedOperation.value = "";
    }
  },
  { immediate: true },
);

// Without terminal access, land on the one method that can work.
watch(
  [isWalletPoster, hasDirectSsh, canUseTerminalAccess],
  ([walletPoster, directSsh, terminalAccess]) => {
    if (!terminalAccess && !walletPoster && directSsh) {
      activeMethod.value = "direct";
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.access-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
</style>
