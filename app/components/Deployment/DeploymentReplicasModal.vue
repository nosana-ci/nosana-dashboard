<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div
      class="modal-background"
      @click="$emit('update:modelValue', false)"
    ></div>
    <div class="modal-card has-limited-width-smaller">
      <header class="modal-card-head">
        <p class="modal-card-title">Update Replicas</p>
        <button
          class="delete"
          @click="$emit('update:modelValue', false)"
        ></button>
      </header>
      <section class="modal-card-body">
        <div class="field">
          <label class="label">
            Replica Count
            <span
              class="icon is-small has-tooltip-arrow has-tooltip-right"
              data-tooltip="Number of parallel job instances"
            >
              <InfoCircleIcon />
            </span>
          </label>
          <div class="control">
            <input
              type="number"
              class="input"
              :value="replicaCount"
              @input="
                $emit(
                  'update:replicaCount',
                  Number(($event.target as HTMLInputElement).value),
                )
              "
              min="1"
              max="100"
              :placeholder="currentReplicas.toString()"
            />
          </div>
          <p class="help">Current: {{ currentReplicas }}</p>
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
          :disabled="actionLoading || !replicaCount || replicaCount < 1"
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
  replicaCount: number | null;
  currentReplicas: number;
  actionLoading: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
  "update:replicaCount": [value: number];
  confirm: [];
}>();
</script>
