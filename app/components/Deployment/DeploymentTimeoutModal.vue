<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div
      class="modal-background"
      @click="$emit('update:modelValue', false)"
    ></div>
    <div class="modal-card has-limited-width-smaller">
      <header class="modal-card-head">
        <p class="modal-card-title">Update Timeout</p>
        <button
          class="delete"
          @click="$emit('update:modelValue', false)"
        ></button>
      </header>
      <section class="modal-card-body">
        <div class="field">
          <label class="label">
            Timeout (hours)
            <span
              class="icon is-small has-tooltip-arrow has-tooltip-right"
              data-tooltip="Maximum runtime before auto-shutdown"
            >
              <InfoCircleIcon />
            </span>
          </label>
          <div class="control">
            <input
              type="number"
              class="input"
              :value="timeoutHours"
              @input="
                $emit(
                  'update:timeoutHours',
                  Number(($event.target as HTMLInputElement).value),
                )
              "
              min="0.0167"
              step="0.1"
              :placeholder="currentTimeoutDisplay"
            />
          </div>
          <p class="help">Current: {{ currentTimeoutDisplay }}h</p>
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
          :disabled="actionLoading || !timeoutHours || timeoutHours < 0.0167"
        >
          Update
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import InfoCircleIcon from "@/assets/img/icons/info-circle.svg?component";

defineProps<{
  modelValue: boolean;
  timeoutHours: number | null;
  currentTimeoutDisplay: string;
  actionLoading: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
  "update:timeoutHours": [value: number];
  confirm: [];
}>();
</script>
