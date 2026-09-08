<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="close"></div>
    <div class="modal-card is-app-modal is-small">
      <header class="modal-card-head">
        <div
          class="is-flex is-align-items-center is-gap-2 is-flex-grow-1"
          style="min-width: 0"
        >
          <span class="app-modal-icon">
            <ClockIcon />
          </span>
          <div style="min-width: 0">
            <p class="modal-card-title title is-5 mb-0">Update Timeout</p>
            <p class="has-text-grey is-size-7">
              Currently
              <span class="has-text-weight-semibold"
                >{{ currentTimeoutDisplay }}h</span
              >
            </p>
          </div>
        </div>
        <button class="delete" aria-label="close" @click="close"></button>
      </header>

      <section class="modal-card-body">
        <div class="field mb-0">
          <label class="label is-size-7">Timeout (hours)</label>
          <div class="control">
            <input
              type="number"
              class="input"
              :value="timeoutHours"
              min="0.0167"
              step="0.1"
              :placeholder="currentTimeoutDisplay"
              @input="
                $emit(
                  'update:timeoutHours',
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <p class="help">Maximum runtime before the deployment shuts itself down.</p>
        </div>
      </section>

      <footer class="modal-card-foot">
        <p class="has-text-grey is-size-7 modal-foot-summary">{{ summary }}</p>
        <div class="buttons mb-0">
          <button class="button" @click="close">Cancel</button>
          <button
            class="button is-success"
            :class="{ 'is-loading': actionLoading }"
            :disabled="actionLoading || !timeoutHours || timeoutHours < 0.0167"
            @click="submit"
          >
            Update
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import ClockIcon from "@/assets/img/icons/clock.svg?component";

const props = defineProps<{
  modelValue: boolean;
  timeoutHours: number | null;
  currentTimeoutDisplay: string;
  actionLoading: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:timeoutHours": [value: number];
  confirm: [];
}>();

const summary = computed(() => {
  const next = props.timeoutHours;
  if (!next || next < 0.0167) return "Enter a new timeout";
  return `Runs for up to ${next}h`;
});

const close = () => emit("update:modelValue", false);

const submit = () => {
  emit("confirm");
  close();
};
</script>
