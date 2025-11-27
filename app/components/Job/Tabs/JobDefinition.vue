<template>
  <div>
    <div class="mb-5">
      <div class="box is-borderless">
        <div v-if="loading" class="has-text-grey has-text-centered py-4">
          Loading job definition...
        </div>
        <div v-else-if="model" class="json-editor-container">
          <JsonEditorVue
            :validator="validator"
            :class="{ 'jse-theme-dark': colorMode.value === 'dark' }"
            v-model="model"
            :mode="Mode.text"
            :mainMenuBar="false"
            :statusBar="false"
            :stringified="false"
            :readOnly="true"
            class="json-editor"
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
import { Mode } from 'vanilla-jsoneditor';
import JsonEditorVue from 'json-editor-vue';
import type { JobDefinition } from "@nosana/sdk";

const colorMode = useColorMode();

interface Props {
  jobDefinition: JobDefinition | null;
  loading?: boolean;
  validator?: (content: unknown) => boolean | string | any;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  validator: undefined,
});

const model = ref<JobDefinition | null>(props.jobDefinition);
watch(() => props.jobDefinition, (next) => { model.value = next; });
const loading = computed(() => props.loading);
const validator = computed(() => props.validator as any);
</script>
