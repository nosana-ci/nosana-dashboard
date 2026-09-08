<template>
  <div class="ssh-access">
    <p class="ssh-intro">
      Add a key to SSH straight into this deployment's jobs from your own
      machine. Without one you can still open a terminal from the dashboard or
      the Nosana CLI.
    </p>

    <div class="key-sources" role="group" aria-label="SSH key source">
      <button
        v-for="source in KEY_SOURCES"
        :key="source.id"
        type="button"
        class="key-source"
        :class="{
          'is-selected': keySource === source.id,
          'is-busy': source.id === 'generated' && isGenerating,
        }"
        :aria-pressed="keySource === source.id"
        :disabled="isGenerating"
        @click="selectSource(source.id)"
      >
        <span class="key-source-icon" aria-hidden="true">
          <KeyIcon v-if="source.id === 'generated'" />
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M8 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            <path d="M15 4h5v5M20 4l-9 9" />
          </svg>
        </span>
        <span class="key-source-text">
          <strong>{{ source.title }}</strong>
          <span>{{ source.description }}</span>
        </span>
        <span class="key-source-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </span>
      </button>
    </div>

    <div v-if="keySource === 'existing'" class="field mt-4 mb-0">
      <label class="label" for="ssh-public-keys">Authorized public keys</label>
      <div class="control">
        <textarea
          id="ssh-public-keys"
          v-model="keyText"
          class="textarea is-family-monospace"
          :class="{ 'is-danger': errorMessage }"
          rows="5"
          spellcheck="false"
          placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... user@host"
          @input="handleInput"
        />
      </div>
      <p v-if="errorMessage" class="help is-danger">{{ errorMessage }}</p>
      <p v-else class="help">
        One OpenSSH public key per line, usually found in
        <code>~/.ssh/id_ed25519.pub</code>. Leave empty to deploy without SSH.
      </p>
    </div>

    <DeployGeneratedKeyPanel
      v-else-if="keySource === 'generated'"
      class="mt-4"
      :key-pair="keyPair"
      :private-key-downloaded="privateKeyDownloaded"
      :is-generating="isGenerating"
      :error="generationError"
      @downloaded="markDownloaded"
      @regenerate="generate"
      @discard="discardGeneratedKey"
    />
  </div>
</template>

<script setup lang="ts">
import { MAX_SSH_PUBLIC_KEYS, parseSshPublicKeys } from "@nosana/kit";
import DeployGeneratedKeyPanel from "~/components/Deploy/GeneratedKeyPanel.vue";
import KeyIcon from "@/assets/img/icons/key.svg?component";
import { useGeneratedSshKey } from "~/composables/useGeneratedSshKey";

type KeySource = "generated" | "existing";

const KEY_SOURCES: Array<{ id: KeySource; title: string; description: string }> = [
  {
    id: "generated",
    title: "Generate a key",
    description: "Creates an Ed25519 key pair in this browser.",
  },
  {
    id: "existing",
    title: "Use my own key",
    description: "Paste one or more existing public keys.",
  },
];

const props = defineProps<{
  modelValue: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [keys: string[]];
  /** Why the deployment cannot be created yet; empty when SSH is ready or unused. */
  "update:error": [message: string];
}>();

const keyText = ref("");
const errorMessage = ref("");
const keySource = ref<KeySource | null>(null);
const {
  keyPair,
  isGenerating,
  error: generationError,
  privateKeyDownloaded,
  generate: generateKeyPair,
  markDownloaded,
  discard,
} = useGeneratedSshKey();

/** Parse the pasted keys, showing any problem. Returns null when they cannot be used. */
const parsePastedKeys = (): string[] | null => {
  const { keys, errors } = parseSshPublicKeys(keyText.value);
  errorMessage.value = errors.map((error) => error.message).join(" ");
  if (!errorMessage.value && keys.length > MAX_SSH_PUBLIC_KEYS) {
    errorMessage.value = `You can configure at most ${MAX_SSH_PUBLIC_KEYS} public keys.`;
  }
  return errorMessage.value ? null : keys;
};

/** The reason creation is blocked, derived from the current state. */
const blocker = computed(() => {
  if (keySource.value === "generated") {
    if (isGenerating.value) return "Wait for the SSH key to finish generating.";
    if (keyPair.value && !privateKeyDownloaded.value) {
      return "Download the SSH private key before creating the deployment.";
    }
    return "";
  }
  if (keySource.value === "existing" && errorMessage.value) {
    return "Fix the SSH public keys before creating the deployment.";
  }
  return "";
});

watch(blocker, (message) => emit("update:error", message), { immediate: true });

const generate = async () => {
  emit("update:modelValue", []);
  const pair = await generateKeyPair();
  if (pair && keySource.value === "generated") {
    emit("update:modelValue", [pair.publicKey]);
  }
};

const discardGeneratedKey = () => {
  discard();
  keySource.value = null;
  emit("update:modelValue", []);
};

/** Picking "generate" creates the key straight away (or brings back the one
 *  already generated); picking "own key" re-applies what was pasted. */
const selectSource = (source: KeySource) => {
  if (keySource.value === source) return;
  keySource.value = source;
  errorMessage.value = "";
  if (source === "existing") {
    emit("update:modelValue", parsePastedKeys() ?? []);
  } else if (keyPair.value) {
    emit("update:modelValue", [keyPair.value.publicKey]);
  } else {
    void generate();
  }
};

const handleInput = () => {
  const keys = parsePastedKeys();
  if (keys !== null) emit("update:modelValue", keys);
};

// Keys arriving from a restored draft or template show up as pasted keys.
watch(
  () => props.modelValue,
  (keys) => {
    if (keySource.value === "generated") return;
    if (keySource.value === "existing" && errorMessage.value) return;
    keyText.value = keys.join("\n");
    if (keys.length > 0) keySource.value = "existing";
  },
  { immediate: true, deep: true },
);
</script>

<style scoped lang="scss">
.ssh-intro {
  margin-bottom: 1rem;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #8a948a;
}

.key-sources {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
}

.key-source {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 0.9rem 1rem;
  text-align: left;
  font-family: inherit;
  color: #e8f0e8;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    border-color: rgba($secondary, 0.6);
    background: rgba(255, 255, 255, 0.06);
  }

  &:focus-visible {
    outline: 2px solid $secondary;
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
  }

  &.is-selected {
    border-color: $secondary;
    background: rgba($secondary, 0.08);
    box-shadow: 0 0 0 3px rgba($secondary, 0.15);
  }
}

.key-source-icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: #9aa79a;
  background: rgba(255, 255, 255, 0.06);
  transition: color 0.2s ease, background-color 0.2s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  .is-selected & {
    color: $secondary;
    background: rgba($secondary, 0.14);
  }

  .is-busy & svg {
    animation: key-spin 1s linear infinite;
  }
}

.key-source-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;

  strong {
    color: inherit;
    font-size: 0.9rem;
  }

  span {
    font-size: 0.78rem;
    color: #8a948a;
  }
}

.key-source-check {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  svg {
    width: 12px;
    height: 12px;
  }

  .is-selected & {
    color: #0a0c0a;
    background: $secondary;
    border-color: $secondary;
  }
}

@keyframes key-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .key-source-icon svg {
    animation: none !important;
  }
}
</style>
