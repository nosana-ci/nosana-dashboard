<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div
      class="modal-background"
      @click="$emit('update:modelValue', false)"
    ></div>
    <div class="modal-card has-limited-width-small">
      <header class="modal-card-head">
        <p class="modal-card-title">Update Schedule</p>
        <button
          class="delete"
          @click="$emit('update:modelValue', false)"
        ></button>
      </header>
      <section class="modal-card-body">
        <div class="field">
          <label class="label">
            Cron Expression
            <span
              class="icon is-small has-tooltip-arrow"
              data-tooltip="Cron expression defining when jobs should run. Format: minute hour day month day-of-week"
            >
              <InfoCircleIcon />
            </span>
          </label>
          <div class="control">
            <input
              type="text"
              class="input is-family-monospace"
              :value="schedule"
              @input="
                $emit(
                  'update:schedule',
                  ($event.target as HTMLInputElement).value,
                )
              "
              :placeholder="currentSchedule || '0 * * * *'"
            />
          </div>
          <p class="help">
            <span
              >Current:
              <span class="is-family-monospace has-text-dark">{{
                currentSchedule
              }}</span></span
            ><br />
            <span class="has-text-grey">{{
              currentSchedule ? parseCronExpression(currentSchedule) : ""
            }}</span>
          </p>
          <div v-if="schedule" class="mt-3">
            <p class="help">
              <span
                >Preview:
                <span class="is-family-monospace has-text-dark">{{
                  schedule
                }}</span></span
              ><br />
              <span class="has-text-grey">{{
                parseCronExpression(schedule)
              }}</span>
            </p>
          </div>
        </div>

        <div class="content">
          <p class="has-text-grey is-size-7 mb-2">
            <strong>Common examples:</strong>
          </p>
          <div class="tags">
            <span
              class="tag is-light is-clickable"
              @click="$emit('update:schedule', '0 * * * *')"
            >
              <span class="is-family-monospace mr-1 has-text-dark"
                >0 * * * *</span
              >
              Every hour
            </span>
            <span
              class="tag is-light is-clickable"
              @click="$emit('update:schedule', '*/30 * * * *')"
            >
              <span class="is-family-monospace mr-1 has-text-dark"
                >*/30 * * * *</span
              >
              Every 30 min
            </span>
            <span
              class="tag is-light is-clickable"
              @click="$emit('update:schedule', '0 0 * * *')"
            >
              <span class="is-family-monospace mr-1 has-text-dark"
                >0 0 * * *</span
              >
              Daily
            </span>
            <span
              class="tag is-light is-clickable"
              @click="$emit('update:schedule', '0 0 * * 0')"
            >
              <span class="is-family-monospace mr-1 has-text-dark"
                >0 0 * * 0</span
              >
              Weekly
            </span>
          </div>
        </div>
      </section>
      <footer class="modal-card-foot is-justify-content-flex-end">
        <button class="button" @click="$emit('update:modelValue', false)">
          Cancel
        </button>
        <button
          class="button is-success"
          @click="
            $emit('confirm');
            $emit('update:modelValue', false);
          "
          :class="{ 'is-loading': actionLoading }"
          :disabled="
            actionLoading || !schedule || !isValidCronExpression(schedule)
          "
        >
          Update
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import InfoCircleIcon from "@/assets/img/icons/info-circle.svg?component";
import { parseCronExpression } from "~/utils/parseCronExpression";

defineProps<{
  modelValue: boolean;
  schedule: string;
  currentSchedule: string | null;
  actionLoading: boolean;
  isValidCronExpression: (cron: string) => boolean;
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
  "update:schedule": [value: string];
  confirm: [];
}>();
</script>
