<template>
  <div class="generated-key">
    <p v-if="isGenerating" class="generated-key-status" role="status">
      Generating an Ed25519 key pair in this browser…
    </p>

    <p v-else-if="error" class="help is-danger" role="alert">{{ error }}</p>

    <template v-else-if="keyPair">
      <div class="field mb-0">
        <label class="label" for="generated-ssh-public-key">
          Generated public key
        </label>
        <div class="control">
          <textarea
            id="generated-ssh-public-key"
            class="textarea is-family-monospace"
            rows="3"
            readonly
            :value="keyPair.publicKey"
          />
        </div>
        <p class="help">
          Only this public key is added to the deployment.
        </p>
      </div>

      <div
        class="private-key-notice"
        :class="{ 'is-done': privateKeyDownloaded }"
        :role="privateKeyDownloaded ? 'status' : 'alert'"
      >
        <span class="private-key-notice-icon" aria-hidden="true">
          <svg
            v-if="privateKeyDownloaded"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m5 12 5 5L20 7" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </span>
        <div class="private-key-notice-text">
          <strong>{{
            privateKeyDownloaded
              ? "Private key saved to your downloads"
              : "Download the private key to continue"
          }}</strong>
          <span>
            {{
              privateKeyDownloaded
                ? `Keep ${PRIVATE_KEY_FILENAME} somewhere safe. The dashboard never stores it.`
                : "It only exists in this browser tab. Once you leave this page it cannot be recovered."
            }}
          </span>
        </div>
        <button
          type="button"
          class="button is-small private-key-notice-action"
          :class="privateKeyDownloaded ? 'is-quiet' : 'is-secondary'"
          @click="downloadPrivateKey"
        >
          {{ privateKeyDownloaded ? "Download again" : "Download private key" }}
        </button>
      </div>

      <div class="generated-key-actions">
        <button type="button" class="button is-small is-quiet" @click="downloadPublicKey">
          Download public key
        </button>
        <button type="button" class="button is-small is-quiet" @click="emit('regenerate')">
          Generate another key
        </button>
        <button type="button" class="button is-small is-quiet" @click="emit('discard')">
          Discard key
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { SshKeyPair } from "@nosana/kit";

const PRIVATE_KEY_FILENAME = "nosana_ssh_key";

const props = defineProps<{
  keyPair: SshKeyPair | null;
  privateKeyDownloaded: boolean;
  isGenerating: boolean;
  error?: string;
}>();
const emit = defineEmits<{
  downloaded: [];
  regenerate: [];
  discard: [];
}>();

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
  if (!props.keyPair) return;
  downloadTextFile(PRIVATE_KEY_FILENAME, props.keyPair.privateKey);
  emit("downloaded");
};

const downloadPublicKey = () => {
  if (!props.keyPair) return;
  downloadTextFile(`${PRIVATE_KEY_FILENAME}.pub`, `${props.keyPair.publicKey}\n`);
};
</script>

<style scoped lang="scss">
/* Text colours are tokens so the panel reads on the light page, in dark mode,
   and inside the always-dark deploy banner (which sets them itself). */
.generated-key {
  --key-title: #{$text};
  --key-muted: #{$grey};
  --key-warn: #b8791a;
  --key-ok: #0a9a08;
}

html.dark-mode .generated-key {
  --key-title: #{$white};
  --key-muted: #{$grey-light};
  --key-warn: #ffb547;
  --key-ok: #{$secondary};
}

.generated-key-status {
  font-size: 0.85rem;
  color: var(--key-muted);
}

/* Callout that carries the one thing the user must do: save the private key.
   Amber while pending, green once the download has started. */
.private-key-notice {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(#ffb547, 0.5);
  background:
    linear-gradient(90deg, rgba(#ffb547, 0.14), rgba(#ffb547, 0.04) 60%);
  transition: border-color 0.25s ease, background 0.25s ease;

  &.is-done {
    border-color: rgba($secondary, 0.45);
    background:
      linear-gradient(90deg, rgba($secondary, 0.12), rgba($secondary, 0.03) 60%);
  }
}

.private-key-notice-icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: var(--key-warn);
  background: rgba(#ffb547, 0.18);

  svg {
    width: 18px;
    height: 18px;
  }

  .is-done & {
    color: var(--key-ok);
    background: rgba($secondary, 0.16);
  }
}

.private-key-notice-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;

  strong {
    color: var(--key-title);
    font-size: 0.9rem;
  }

  span {
    font-size: 0.78rem;
    color: var(--key-muted);
  }
}

.private-key-notice-action {
  flex: none;
}

.generated-key-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

@media screen and (max-width: 640px) {
  .private-key-notice {
    flex-wrap: wrap;
  }

  .private-key-notice-action {
    width: 100%;
  }
}
</style>
