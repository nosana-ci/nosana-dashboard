<template>
  <form class="section-row is-block" @submit.prevent="emit('submit', keyText)">
    <div class="field">
      <label class="label is-small" for="deployment-public-key">Public key</label>
      <div class="control">
        <textarea
          id="deployment-public-key"
          ref="input"
          v-model="keyText"
          class="textarea is-family-monospace"
          :class="{ 'is-danger': error }"
          rows="3"
          placeholder="ssh-ed25519 AAAA… your-key-label"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :disabled="disabled"
          :aria-invalid="!!error"
          aria-describedby="public-key-help"
          @input="emit('edit')"
          @keydown.esc.prevent="emit('cancel')"
        />
      </div>
      <p
        id="public-key-help"
        class="help"
        :class="{ 'is-danger': error }"
        :role="error ? 'alert' : undefined"
      >
        {{
          error || "Paste one OpenSSH public key per line. Never paste a private key."
        }}
      </p>
    </div>
    <div class="buttons mb-0">
      <button
        type="submit"
        class="button is-small is-secondary"
        :disabled="disabled"
      >
        Add to list
      </button>
      <button
        type="button"
        class="button is-small is-quiet"
        :disabled="disabled"
        @click="emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
defineProps<{
  error?: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{
  submit: [text: string];
  cancel: [];
  edit: [];
}>();

const keyText = ref("");
const input = ref<HTMLTextAreaElement | null>(null);
const focus = () => input.value?.focus();

onMounted(focus);
defineExpose({ focus });
</script>
