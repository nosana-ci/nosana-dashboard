<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div
      class="modal-background"
      @click="$emit('update:modelValue', false)"
    ></div>
    <div class="modal-card has-limited-width-smaller">
      <header class="modal-card-head">
        <p class="modal-card-title">Duplicate Deployment</p>
        <button
          class="delete"
          @click="$emit('update:modelValue', false)"
        ></button>
      </header>
      <section class="modal-card-body">
        <div class="field">
          <label class="label">
            New deployment name
            <span
              class="icon is-small has-tooltip-arrow has-tooltip-right"
              data-tooltip="Name for the copy of this deployment"
            >
              <InfoCircleIcon />
            </span>
          </label>
          <div class="control">
            <input
              type="text"
              class="input"
              :value="name"
              maxlength="100"
              :placeholder="defaultName"
              @input="
                $emit('update:name', ($event.target as HTMLInputElement).value)
              "
              @keydown.enter.prevent="submit"
            />
          </div>
          <p class="help">
            The copy keeps this deployment's market, replicas, timeout,
            strategy and active revision. You'll be taken to it once it's
            created.
          </p>
        </div>
      </section>
      <footer class="modal-card-foot is-justify-content-flex-end">
        <button class="button" @click="$emit('update:modelValue', false)">
          Cancel
        </button>
        <button
          class="button is-success"
          :class="{ 'is-loading': actionLoading }"
          :disabled="actionLoading"
          @click="submit"
        >
          Duplicate
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import InfoCircleIcon from "@/assets/img/icons/info-circle.svg?component";

const props = defineProps<{
  modelValue: boolean;
  name: string;
  currentName: string;
  actionLoading: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:name": [value: string];
  confirm: [];
}>();

// Shown as the placeholder and used when the field is left empty.
const defaultName = computed(() => `${props.currentName || "Deployment"} (copy)`);

const submit = () => {
  if (props.actionLoading) return;
  emit("confirm");
  emit("update:modelValue", false);
};
</script>
