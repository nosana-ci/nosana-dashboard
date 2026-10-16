<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="close"></div>
    <div class="modal-card is-app-modal is-normal">
      <header class="modal-card-head">
        <div
          class="is-flex is-align-items-center is-gap-2 is-flex-grow-1"
          style="min-width: 0"
        >
          <span class="app-modal-icon">
            <DuplicateIcon />
          </span>
          <div style="min-width: 0">
            <p class="modal-card-title title is-5 mb-0">Duplicate Deployment</p>
            <p class="has-text-grey is-size-7">
              Copy of
              <span class="has-text-weight-semibold">{{
                currentName || "Deployment"
              }}</span>
            </p>
          </div>
        </div>
        <button class="delete" aria-label="close" @click="close"></button>
      </header>

      <section class="modal-card-body">
        <div class="field">
          <label class="label is-size-7">New deployment name</label>
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
        </div>

        <!-- The copy runs where the original does: its GPUs and requirements,
             or its pinned market. Change those on the copy afterwards, or use
             Configure to edit everything before it deploys. -->
        <p class="is-size-7 has-text-grey mt-4 mb-0">
          The copy keeps this deployment's GPUs and requirements, replicas,
          timeout, strategy and active revision. You'll be taken to it once
          it's created.
        </p>
      </section>

      <footer class="modal-card-foot">
        <p class="has-text-grey is-size-7 modal-foot-summary">
          Creates
          <span class="has-text-weight-semibold">{{
            name.trim() || defaultName
          }}</span>
        </p>
        <div class="buttons mb-0">
          <button
            class="button"
            title="Open this copy in the create form instead of deploying it now"
            @click="configure"
          >
            Configure
          </button>
          <button
            class="button is-success"
            :class="{ 'is-loading': actionLoading }"
            :disabled="actionLoading"
            @click="submit"
          >
            Duplicate
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import DuplicateIcon from "@/assets/img/icons/duplicate.svg?component";

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
  configure: [];
}>();

// Shown as the placeholder and used when the field is left empty.
const defaultName = computed(
  () => `${props.currentName || "Deployment"} (copy)`,
);

const close = () => emit("update:modelValue", false);

const submit = () => {
  if (props.actionLoading) return;
  emit("confirm");
  emit("update:modelValue", false);
};

// Hand the copy to the create page instead of deploying it straight away, so
// the job definition and settings can be edited first. The dialog is left open
// on purpose: closing it clears ?action=duplicate from the deployment's URL,
// and that navigation would cancel the pending one. Leaving the page unmounts
// this dialog anyway, and the parent closes it if the navigation fails.
const configure = () => emit("configure");
</script>
