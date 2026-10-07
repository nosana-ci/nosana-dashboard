<template>
  <div class="settings-step">
    <div class="settings-card">
      <h3 id="settings-name-heading" class="settings-heading">
        Deployment name
      </h3>
      <input
        id="settings-deployment-name"
        v-model="deploymentNameModel"
        class="input"
        type="text"
        placeholder="Deployment name"
        aria-labelledby="settings-name-heading"
      />

      <h3 class="settings-heading">Run strategy</h3>
      <div class="strategy-list">
        <div
          v-for="option in strategyOptions"
          :key="option.id"
          class="strategy-card"
          :class="{ 'is-picked': strategy === option.id }"
        >
          <label class="strategy-pick">
            <input
              class="strategy-radio"
              type="radio"
              name="run-strategy"
              :value="option.id"
              :checked="strategy === option.id"
              @change="emit('update:strategy', option.id)"
            />
            <span class="strategy-text">
              <strong>{{ option.title }}</strong>
              <span>{{ option.description }}</span>
            </span>
          </label>

          <div
            v-if="option.id === 'SCHEDULED' && strategy === 'SCHEDULED'"
            class="strategy-schedule"
          >
            <label class="label is-size-7" for="settings-schedule">
              Cron expression
            </label>
            <input
              id="settings-schedule"
              v-model="scheduleModel"
              class="input is-family-monospace"
              type="text"
              placeholder="0 0 * * *"
            />
            <p v-if="schedule" class="help">
              {{ parseCronExpression(schedule) }}
            </p>
            <div class="schedule-examples" aria-label="Example schedules">
              <button
                v-for="example in SCHEDULE_EXAMPLES"
                :key="example.cron"
                type="button"
                class="schedule-example"
                :class="{ 'is-active': schedule === example.cron }"
                @click="emit('update:schedule', example.cron)"
              >
                {{ example.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <h3 class="settings-heading">Replicas &amp; duration</h3>
      <div class="settings-row">
        <div class="settings-field">
          <label class="label is-size-7" for="settings-replicas"
            >Replicas</label
          >
          <div class="stepper">
            <button
              type="button"
              class="stepper-button"
              aria-label="Fewer replicas"
              :disabled="replicas <= MIN_REPLICAS"
              @click="setReplicas(replicas - 1)"
            >
              −
            </button>
            <input
              id="settings-replicas"
              v-model="replicasInput"
              class="stepper-input"
              type="number"
              inputmode="numeric"
              :min="MIN_REPLICAS"
              :max="MAX_REPLICAS"
              @input="handleReplicasInput"
              @blur="replicasInput = String(replicas)"
            />
            <button
              type="button"
              class="stepper-button"
              aria-label="More replicas"
              :disabled="replicas >= MAX_REPLICAS"
              @click="setReplicas(replicas + 1)"
            >
              +
            </button>
          </div>
        </div>

        <div v-if="strategy !== 'SIMPLE-EXTEND'" class="settings-field">
          <label class="label is-size-7" for="settings-duration">
            {{ durationLabel }}
          </label>
          <div class="field has-addons mb-0">
            <div class="control is-expanded">
              <input
                id="settings-duration"
                v-model="durationInput"
                class="input"
                type="number"
                step="any"
                :min="minTimeoutHours"
                :max="MAX_TIMEOUT_HOURS"
                @input="handleDurationInput"
                @blur="handleDurationBlur"
              />
            </div>
            <div class="control">
              <span class="button is-static duration-unit">hours</span>
            </div>
          </div>
        </div>
      </div>

      <p class="settings-hint">
        Each replica runs its own copy. Two replicas do not combine their GPU
        memory.
      </p>

      <h3 class="settings-heading">
        SSH access <span class="settings-heading-note">(optional)</span>
      </h3>
      <DeploySSHAccessConfiguration
        :model-value="sshPublicKeys"
        @update:model-value="emit('update:sshPublicKeys', $event)"
        @update:error="emit('ssh-error', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  MAX_TIMEOUT_HOURS,
  MIN_TIMEOUT_HOURS,
  MIN_INFINITE_TIMEOUT_HOURS,
} from "~/composables/useTimeoutConstants";
import { parseCronExpression } from "~/utils/parseCronExpression";

const props = defineProps<{
  deploymentName: string;
  replicas: number;
  /** Hours. */
  timeout: number;
  strategy: string;
  schedule: string;
  sshPublicKeys: string[];
  hideSimpleExtend: boolean;
}>();

const emit = defineEmits<{
  "update:deploymentName": [string];
  "update:replicas": [number];
  /** Hours. */
  "update:timeout": [number];
  "update:strategy": [string];
  "update:schedule": [string];
  "update:sshPublicKeys": [string[]];
  "ssh-error": [string];
}>();

const MIN_REPLICAS = 1;
const MAX_REPLICAS = 100;

// Stateless first: it is the default and the one most workloads want.
const STRATEGIES: Array<{ id: string; title: string; description: string }> = [
  {
    id: "INFINITE",
    title: "Stateless",
    description:
      "Always on. Jobs that stop or crash are replaced on any host, so APIs and apps stay up until you stop the deployment.",
  },
  {
    id: "SIMPLE-EXTEND",
    title: "Stateful",
    description:
      "Runs to completion. Every job keeps its host, and the deployment stops when the last one finishes. Ideal for notebooks and training.",
  },
  {
    id: "SCHEDULED",
    title: "Scheduled",
    description:
      "Starts a run on a schedule you set. Ideal for nightly batch jobs, reports and recurring agentic tasks.",
  },
];

// What the duration means depends on the strategy: stateless jobs rotate
// hosts on it, a scheduled run lasts for it.
const durationLabel = computed(() =>
  props.strategy === "INFINITE" ? "Rotation interval" : "Run duration",
);

const strategyOptions = computed(() =>
  STRATEGIES.filter(
    (option) => option.id !== "SIMPLE-EXTEND" || !props.hideSimpleExtend,
  ),
);

const deploymentNameModel = computed({
  get: () => props.deploymentName,
  set: (value: string) => emit("update:deploymentName", value),
});

// Common schedules as presets, so a cron line is a click rather than a lookup.
const SCHEDULE_EXAMPLES = [
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Daily at midnight", cron: "0 0 * * *" },
  { label: "Weekdays at 09:00", cron: "0 9 * * 1-5" },
  { label: "Mondays at 08:00", cron: "0 8 * * 1" },
];

const scheduleModel = computed({
  get: () => props.schedule,
  set: (value: string) => emit("update:schedule", value),
});

// --- Replicas: the stepper shows what was typed until blur, then snaps back
// to the clamped value the page holds.
const replicasInput = ref(String(props.replicas));
watch(
  () => props.replicas,
  (count) => {
    if (Number(replicasInput.value) !== count)
      replicasInput.value = String(count);
  },
);
const setReplicas = (count: number) => {
  const clamped = Math.min(
    MAX_REPLICAS,
    Math.max(MIN_REPLICAS, Math.round(count)),
  );
  emit("update:replicas", clamped);
};
const handleReplicasInput = () => {
  const entered = Number(replicasInput.value);
  if (replicasInput.value !== "" && !Number.isNaN(entered))
    setReplicas(entered);
};

// --- Duration, in hours only; the field clamps to the allowed range on blur.
const roundHours = (hours: number) => Math.round(hours * 1000) / 1000;
const durationInput = ref(String(roundHours(props.timeout)));
const minTimeoutHours = computed(() =>
  props.strategy === "INFINITE"
    ? MIN_INFINITE_TIMEOUT_HOURS
    : MIN_TIMEOUT_HOURS,
);
watch(
  () => props.timeout,
  (hours) => {
    const shown = roundHours(hours);
    if (Number(durationInput.value) !== shown)
      durationInput.value = String(shown);
  },
);
const handleDurationInput = () => {
  const entered = Number(durationInput.value);
  if (durationInput.value === "" || Number.isNaN(entered) || entered <= 0)
    return;
  emit("update:timeout", roundHours(entered));
};
const handleDurationBlur = () => {
  const entered = Number(durationInput.value);
  const hours =
    durationInput.value === "" || Number.isNaN(entered) || entered <= 0
      ? minTimeoutHours.value
      : Math.min(
          MAX_TIMEOUT_HOURS,
          Math.max(minTimeoutHours.value, roundHours(entered)),
        );
  durationInput.value = String(hours);
  emit("update:timeout", hours);
};
</script>

<style lang="scss" scoped>
.settings-step {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

// --- The card: the slide-over it opens in is the panel, so it sits flat.
.settings-card {
  margin: 0;
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.settings-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
}

@media screen and (max-width: 767px) {
  .settings-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

// Replica stepper: the same height and corners as the text fields beside it.
// Every field on this card shares the look of the template search field on
// the workload step: a quiet hairline box, green ring on focus.
.settings-card .input,
.stepper {
  border: 1px solid $border-soft;
  border-radius: $input-radius;
  background: $white;
  color: $text;
  box-shadow: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: $border-strong;
  }
}

.settings-card .input:focus,
.stepper:focus-within {
  border-color: $secondary;
  box-shadow: 0 0 0 3px rgba($secondary, 0.18);
}

.settings-card .input::placeholder {
  color: $text-muted;
}

.stepper {
  display: flex;
  align-items: stretch;
  height: $input-control-height;
  font-size: 1rem;
  overflow: hidden;
}

// The fixed "hours" addon beside the duration number.
// Bulma sizes a button in its own em, so the input's 2.75em at the base size
// is written in rem here to come out the same height as the number field.
.duration-unit {
  height: 2.75rem;
  border: 1px solid $border-soft;
  border-radius: $input-radius;
  background: $surface-sunken;
  color: $text-muted;
  font-size: 0.85rem;
  pointer-events: none;
}

.stepper-button {
  flex: none;
  width: 3rem;
  border: 0;
  background: transparent;
  color: $text;
  font-family: inherit;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: $surface-hover;
  }

  &:focus-visible {
    outline: 2px solid $secondary;
    outline-offset: -2px;
  }

  &:disabled {
    color: $text-muted;
    cursor: default;
  }
}

.stepper-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: $text;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
  -moz-appearance: textfield;
  appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  &:focus {
    outline: none;
  }
}

// The soft green availability note under the replica row.
.settings-hint {
  margin: 0.75rem 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: $text-muted;
}

.settings-heading-note {
  font-family: $family-sans-serif;
  font-size: 0.85rem;
  font-weight: 400;
  color: $text-muted;
}

.settings-heading {
  margin: 1.75rem 0 0.75rem;

  &:first-child {
    margin-top: 0;
  }
  font-family: $title-family;
  font-size: 1.15rem;
  font-weight: 600;
  color: $text;

  + .settings-hint {
    margin-top: -0.25rem;
    margin-bottom: 1rem;
  }
}

// --- Run strategy: large radio cards
.strategy-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.strategy-card {
  border: 1px solid $border-soft;
  border-radius: 12px;
  background: $white;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    border-color: $border-strong;
  }

  &.is-picked {
    border-color: $secondary;
    background: rgba($secondary, 0.06);
  }
}

.strategy-pick {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.9rem 1rem;
  cursor: pointer;
}

.strategy-radio {
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: $secondary;
  cursor: pointer;
}

.strategy-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;

  strong {
    font-size: 0.95rem;
    color: $text;
  }

  span {
    font-size: 0.85rem;
    color: $text-muted;
  }
}

// The cron field revealed inside the scheduled card, aligned with its text.
.strategy-schedule {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0 1rem 1rem calc(1rem + 18px + 0.85rem);

  .help {
    margin: 0;
    color: $text-muted;
  }
}

.schedule-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 0.25rem;
}

.schedule-example {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid $border-soft;
  background: $white;
  color: $text-muted;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    border-color: $secondary;
    color: $text;
  }

  &.is-active {
    border-color: $secondary;
    background: rgba($secondary, 0.1);
    color: $secondary-text;
  }
}

// --- Dark theme
html.dark-mode {
  .stepper-button,
  .stepper-input,
  .settings-heading,
  .strategy-text strong {
    color: $white;
  }

  .schedule-example {
    background: rgba($white, 0.04);
    border-color: rgba($white, 0.14);
    color: #d7e0d7;

    &:hover {
      border-color: $secondary;
      color: $white;
    }

    &.is-active {
      background: rgba($secondary, 0.12);
      border-color: $secondary;
      color: $secondary;
    }
  }

  .settings-hint,
  .strategy-text span,
  .strategy-schedule .help {
    color: #8a948a;
  }

  .settings-card .input,
  .stepper {
    background: rgba($white, 0.05);
    border-color: rgba($white, 0.12);
    color: $white;
    color-scheme: dark;
  }

  .settings-card .input::placeholder {
    color: #6f7a6e;
  }

  .duration-unit {
    background: rgba($white, 0.08);
    border-color: rgba($white, 0.12);
    color: #8a948a;
  }

  .settings-card .input:focus,
  .stepper:focus-within {
    border-color: $secondary;
    box-shadow: 0 0 0 3px rgba($secondary, 0.18);
  }

  .stepper-button {
    &:hover:not(:disabled) {
      background: rgba($white, 0.08);
    }

    &:disabled {
      color: #8a948a;
    }
  }

  .strategy-card {
    border-color: rgba($white, 0.12);
    background: rgba($white, 0.03);

    &:hover {
      border-color: rgba($white, 0.24);
    }

    &.is-picked {
      border-color: $secondary;
      background: rgba($secondary, 0.1);
    }
  }
}
</style>
