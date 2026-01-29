<template>
  <div class="deployment-configuration-tab">
    <div class="field">
      <label class="label">Deployment Strategy</label>
      <div class="control">
        <div class="select is-fullwidth">
          <select v-model="strategyLocal">
            <option value="SIMPLE">Simple</option>
            <option value="SIMPLE-EXTEND">Simple Extend</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="INFINITE">Infinite</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="strategyLocal === 'SCHEDULED'" class="field">
      <label class="label">Schedule</label>
      <div class="control">
        <input
          v-model="scheduleLocal"
          class="input"
          type="text"
          placeholder="0 0 * * *"
        />
      </div>
      <p v-if="scheduleLocal" class="help has-text-grey">
        {{ parseCronExpression(scheduleLocal) }}
      </p>
    </div>

    <div class="field">
      <label class="label">Replica Count</label>
      <div class="control">
        <input
          class="input"
          type="number"
          v-model.number="replicasLocal"
          min="1"
          max="100"
        />
      </div>
    </div>

    <div class="field">
      <label class="label">
        Container Timeout (hours)
        <span
          class="icon is-small has-text-grey"
          data-tooltip="Maximum runtime before auto-shutdown"
        >
          <i class="fas fa-info-circle"></i>
        </span>
      </label>
      <div class="control">
        <input
          class="input"
          type="number"
          v-model.number="timeoutLocal"
          :min="MIN_TIMEOUT_HOURS"
          :max="MAX_TIMEOUT_HOURS"
          step="0.1"
        />
      </div>
    </div>

    <VaultSelector
      v-if="isWalletMode"
      :setSelectedVault="handleVaultSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { DeploymentStrategy } from "@nosana/kit";
import { parseCronExpression } from "~/utils/parseCronExpression";
import { MAX_TIMEOUT_HOURS, MIN_TIMEOUT_HOURS } from "~/composables/useTimeoutConstants";
import VaultSelector from "~/components/Vault/VaultSelector.vue";

const props = defineProps<{
  strategy: DeploymentStrategy;
  schedule: string;
  replicas: number;
  timeout: number;
  isWalletMode: boolean;
}>();

const emit = defineEmits<{
  'update:strategy': [strategy: DeploymentStrategy];
  'update:schedule': [schedule: string];
  'update:replicas': [replicas: number];
  'update:timeout': [timeout: number];
  'update:modalSelectedVault': [vault: string | null | undefined];
}>();

const clampNumber = (value: number, min: number, max: number) => {
  const num = Number(value);
  if (Number.isNaN(num)) return min;
  return Math.min(max, Math.max(min, num));
};

const strategyLocal = computed({
  get: () => props.strategy,
  set: (value: DeploymentStrategy) => emit("update:strategy", value),
});

const scheduleLocal = computed({
  get: () => props.schedule,
  set: (value: string) => emit("update:schedule", value),
});

const replicasLocal = computed({
  get: () => props.replicas,
  set: (value: number) => emit("update:replicas", clampNumber(value, 1, 100)),
});

const timeoutLocal = computed({
  get: () => props.timeout,
  set: (value: number) => emit("update:timeout", clampNumber(value, MIN_TIMEOUT_HOURS, MAX_TIMEOUT_HOURS)),
});

const handleVaultSelect = (vault: string | undefined | null) => {
  emit("update:modalSelectedVault", vault ?? null);
};
</script>

<style scoped>
.deployment-configuration-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (max-width: 768px) {
  .deployment-configuration-tab {
    gap: 0.75rem;
  }
}
</style>
