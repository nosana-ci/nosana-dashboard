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
            <GridIcon />
          </span>
          <div style="min-width: 0">
            <p class="modal-card-title title is-5 mb-0">Update Replicas</p>
            <p class="has-text-grey is-size-7">
              Currently
              <span class="has-text-weight-semibold">{{ currentReplicas }}</span>
            </p>
          </div>
        </div>
        <button class="delete" aria-label="close" @click="close"></button>
      </header>

      <section class="modal-card-body">
        <div class="field mb-0">
          <label class="label is-size-7">Replica count</label>
          <div class="control">
            <input
              type="number"
              class="input"
              :value="replicaCount"
              min="0"
              max="100"
              :placeholder="currentReplicas.toString()"
              @input="
                $emit(
                  'update:replicaCount',
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <p class="help">
            Number of parallel job instances. Set to 0 to pause the deployment.
          </p>
        </div>
      </section>

      <footer class="modal-card-foot">
        <p class="has-text-grey is-size-7 modal-foot-summary">{{ summary }}</p>
        <div class="buttons mb-0">
          <button class="button" @click="close">Cancel</button>
          <button
            class="button is-success"
            :class="{ 'is-loading': actionLoading }"
            :disabled="actionLoading || replicaCount === null || replicaCount < 0"
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
import GridIcon from "@/assets/img/icons/grid.svg?component";

const props = defineProps<{
  modelValue: boolean;
  replicaCount: number | null;
  currentReplicas: number;
  actionLoading: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:replicaCount": [value: number];
  confirm: [];
}>();

const summary = computed(() => {
  const next = props.replicaCount;
  if (next === null || next < 0) return "Enter a new replica count";
  if (next === props.currentReplicas) return "Same as the current count";
  if (next === 0) return "Pauses the deployment";
  return `Runs ${next} replica${next === 1 ? "" : "s"}`;
});

const close = () => emit("update:modelValue", false);

const submit = () => {
  emit("confirm");
  close();
};
</script>
