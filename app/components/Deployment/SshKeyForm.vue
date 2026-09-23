<template>
  <form class="section-row is-block" @submit.prevent="submit">
    <div class="seg-tabs mb-4" role="group" aria-label="How to add the key">
      <button
        v-for="option in MODES"
        :key="option.id"
        type="button"
        :class="{ 'is-active': mode === option.id }"
        :aria-pressed="mode === option.id"
        :disabled="disabled"
        @click="setMode(option.id)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="mode === 'paste'" class="field">
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

    <div v-else class="mb-4">
      <DeployGeneratedKeyPanel
        :key-pair="keyPair"
        :private-key-downloaded="privateKeyDownloaded"
        :is-generating="isGenerating"
        :error="generationError"
        @downloaded="markDownloaded"
        @regenerate="generateKeyPair"
        @discard="discardGenerated"
      />
      <p v-if="error" class="help is-danger mt-2" role="alert">{{ error }}</p>
    </div>

    <div class="buttons mb-0">
      <button
        type="submit"
        class="button is-small is-secondary"
        :disabled="disabled || !canSubmit"
      >
        Add key
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
import DeployGeneratedKeyPanel from "~/components/Deploy/GeneratedKeyPanel.vue";
import { useGeneratedSshKey } from "~/composables/useGeneratedSshKey";

type Mode = "paste" | "generate";

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "paste", label: "Paste a public key" },
  { id: "generate", label: "Generate a new key" },
];

defineProps<{
  error?: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{
  submit: [text: string];
  cancel: [];
  edit: [];
}>();

const mode = ref<Mode>("paste");
const keyText = ref("");
const input = ref<HTMLTextAreaElement | null>(null);
const {
  keyPair,
  isGenerating,
  error: generationError,
  privateKeyDownloaded,
  generate: generateKeyPair,
  markDownloaded,
  discard,
} = useGeneratedSshKey();

// A generated key joins the list only once its private key has been downloaded.
const canSubmit = computed(
  () =>
    mode.value === "paste" || (!!keyPair.value && privateKeyDownloaded.value),
);

const focus = () => input.value?.focus();

const setMode = async (next: Mode) => {
  if (mode.value === next) return;
  mode.value = next;
  emit("edit");
  if (next === "generate") {
    if (!keyPair.value && !isGenerating.value) void generateKeyPair();
    return;
  }
  await nextTick();
  focus();
};

const discardGenerated = () => {
  discard();
  void setMode("paste");
};

const submit = () => {
  if (mode.value === "paste") {
    emit("submit", keyText.value);
  } else if (canSubmit.value && keyPair.value) {
    emit("submit", keyPair.value.publicKey);
  }
};

onMounted(focus);
defineExpose({ focus });
</script>
