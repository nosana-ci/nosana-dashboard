<template>
  <div>
    <div class="mb-5">
      <div class="box is-borderless">
        <div v-if="loading" class="has-text-grey has-text-centered py-4">
          Loading job definition...
        </div>
        <div v-else-if="model" class="json-editor-container">
          <CommonJsonEditor
            v-model="model"
            :readOnly="true"
          />
        </div>
        <div v-else class="has-text-grey has-text-centered py-4">
          No job definition found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { JobDefinition } from "@nosana/kit";

interface Props {
  jobDefinition: JobDefinition | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const model = ref<JobDefinition | null>(props.jobDefinition);
watch(() => props.jobDefinition, (next) => { model.value = next; });
const loading = computed(() => props.loading);
</script>
