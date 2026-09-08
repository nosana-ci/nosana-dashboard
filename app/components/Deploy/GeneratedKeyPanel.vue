<template>
  <div class="box">
    <template v-if="!modelValue">
      <p class="mb-4">
        The key pair is created locally. Only the public key is added to the
        deployment.
      </p>
      <button
        type="button"
        class="button is-success"
        :class="{ 'is-loading': isGenerating }"
        :disabled="isGenerating"
        @click="generate"
      >
        Generate and use key
      </button>
    </template>

    <template v-else>
      <div class="field">
        <label class="label" for="generated-ssh-public-key">
          Generated public key
        </label>
        <div class="control">
          <textarea
            id="generated-ssh-public-key"
            class="textarea is-family-monospace"
            rows="4"
            readonly
            :value="modelValue.publicKey"
          />
        </div>
      </div>

      <div class="buttons">
        <button type="button" class="button is-success" @click="downloadPrivateKey">
          Download private key
        </button>
        <button type="button" class="button" @click="downloadPublicKey">
          Download public key
        </button>
        <button
          type="button"
          class="button is-ghost"
          :class="{ 'is-loading': isGenerating }"
          :disabled="isGenerating"
          @click="generate"
        >
          Generate another key
        </button>
      </div>

      <div class="notification is-warning is-light mb-0">
        Download the private key now. It is not stored by the dashboard and
        cannot be recovered after this form is closed.
      </div>
      <p v-if="privateKeyDownloaded" class="help is-success mt-2" role="status">
        Private key download started.
      </p>
    </template>

    <p v-if="error || generationError" class="help is-danger mt-3" role="alert">
      {{ error || generationError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { generateSshKeyPair, type SshKeyPair } from "@nosana/kit";

const props = defineProps<{
  modelValue: SshKeyPair | null;
  privateKeyDownloaded: boolean;
  /** A validation problem raised by the parent, e.g. "download the key first". */
  error?: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [pair: SshKeyPair | null];
  "update:privateKeyDownloaded": [downloaded: boolean];
}>();

const isGenerating = ref(false);
const generationError = ref("");

const generate = async () => {
  isGenerating.value = true;
  generationError.value = "";
  emit("update:privateKeyDownloaded", false);
  try {
    emit(
      "update:modelValue",
      await generateSshKeyPair({ comment: "nosana-dashboard" }),
    );
  } catch (cause) {
    emit("update:modelValue", null);
    generationError.value =
      cause instanceof Error
        ? cause.message
        : "Could not generate an SSH key. Use an existing public key instead.";
  } finally {
    isGenerating.value = false;
  }
};

const downloadTextFile = (filename: string, value: string) => {
  const url = URL.createObjectURL(
    new Blob([value], { type: "application/octet-stream" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const downloadPrivateKey = () => {
  if (!props.modelValue) return;
  downloadTextFile("nosana_ssh_key", props.modelValue.privateKey);
  emit("update:privateKeyDownloaded", true);
};

const downloadPublicKey = () => {
  if (!props.modelValue) return;
  downloadTextFile("nosana_ssh_key.pub", `${props.modelValue.publicKey}\n`);
};
</script>
