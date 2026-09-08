<template>
  <div>
    <div class="level is-mobile mb-0">
      <div class="level-left">
        <div class="level-item">
          <div>
            <h2 class="title is-5 mb-2">SSH keys</h2>
            <p class="has-text-grey mb-0">
              Connect directly to jobs started from this deployment.
            </p>
          </div>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <UIToggleSwitch
            v-model="sshEnabled"
            @update:model-value="handleEnabledChange"
          >
            <strong>Add SSH keys</strong>
          </UIToggleSwitch>
        </div>
      </div>
    </div>

    <template v-if="sshEnabled">
      <hr />

      <fieldset class="field">
        <legend class="label">Choose an SSH key</legend>
        <div class="columns is-variable is-2">
          <div v-for="source in KEY_SOURCES" :key="source.id" class="column is-half">
            <label
              class="box is-clickable key-source mb-0"
              :class="{ 'is-selected': keySource === source.id }"
            >
              <input
                v-model="keySource"
                type="radio"
                name="ssh-key-source"
                :value="source.id"
                class="mr-2"
                @change="handleSourceChange"
              />
              <strong>{{ source.title }}</strong>
              <p class="is-size-7 has-text-grey mt-1 mb-0">{{ source.description }}</p>
            </label>
          </div>
        </div>
      </fieldset>

      <div v-if="keySource === 'existing'" class="field">
        <label class="label" for="ssh-public-keys">Authorized public keys</label>
        <div class="control">
          <textarea
            id="ssh-public-keys"
            v-model="keyText"
            class="textarea is-family-monospace"
            :class="{ 'is-danger': errorMessage }"
            rows="7"
            spellcheck="false"
            placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... user@host"
            @input="handleInput"
            @blur="validate"
          />
        </div>
        <p v-if="errorMessage" class="help is-danger">{{ errorMessage }}</p>
        <p v-else class="help">
          Enter one OpenSSH public key per line. You can usually find yours in
          <code>~/.ssh/id_ed25519.pub</code>.
        </p>
      </div>

      <DeployGeneratedKeyPanel
        v-else
        v-model="generatedKeyPair"
        v-model:private-key-downloaded="privateKeyDownloaded"
        :error="generationError"
        @update:model-value="handleGeneratedKey"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  MAX_SSH_PUBLIC_KEYS as MAX_PUBLIC_KEYS,
  parseSshPublicKeys,
  type SshKeyPair,
} from "@nosana/kit";
import DeployGeneratedKeyPanel from "~/components/Deploy/GeneratedKeyPanel.vue";
import UIToggleSwitch from "~/components/UI/ToggleSwitch.vue";

type KeySource = "existing" | "generated";

const KEY_SOURCES: Array<{ id: KeySource; title: string; description: string }> = [
  {
    id: "existing",
    title: "Use my SSH key",
    description: "Paste one or more existing public keys.",
  },
  {
    id: "generated",
    title: "Generate a new key",
    description: "Create an Ed25519 key pair in this browser.",
  },
];

const props = defineProps<{
  modelValue: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const keyText = ref("");
const errorMessage = ref("");
const sshEnabled = ref(false);
const keySource = ref<KeySource>("existing");
const generatedKeyPair = ref<SshKeyPair | null>(null);
const generationError = ref("");
const privateKeyDownloaded = ref(false);

const syncFromKeys = () => {
  keyText.value = props.modelValue.join("\n");
  if (props.modelValue.length > 0) sshEnabled.value = true;
};

/** Parse the pasted keys, showing any problem. Returns null when they cannot be used. */
const parsePastedKeys = (): string[] | null => {
  const { keys, errors } = parseSshPublicKeys(keyText.value);
  errorMessage.value = errors.map((error) => error.message).join(" ");
  return errors.length ? null : keys;
};

const validate = () => {
  if (!sshEnabled.value) return true;

  if (keySource.value === "generated") {
    if (!generatedKeyPair.value) {
      generationError.value = "Generate a key pair before saving.";
      return false;
    }
    if (!privateKeyDownloaded.value) {
      generationError.value = "Download the private key before saving.";
      return false;
    }
    emit("update:modelValue", [generatedKeyPair.value.publicKey]);
    generationError.value = "";
    return true;
  }

  const keys = parsePastedKeys();
  if (keys === null) return false;
  if (keys.length > MAX_PUBLIC_KEYS) {
    errorMessage.value = `You can configure at most ${MAX_PUBLIC_KEYS} public keys.`;
    return false;
  }
  if (!keyText.value.trim()) {
    errorMessage.value = "Add at least one public key to enable SSH access.";
    return false;
  }
  return keys.length > 0;
};

/** Push the current source's keys to the parent, or clear them when nothing valid is entered. */
const applyCurrentSource = () => {
  if (keySource.value === "generated") {
    emit(
      "update:modelValue",
      generatedKeyPair.value ? [generatedKeyPair.value.publicKey] : [],
    );
    return;
  }
  emit("update:modelValue", parsePastedKeys() ?? []);
};

const handleEnabledChange = (enabled: boolean) => {
  errorMessage.value = "";
  generationError.value = "";
  if (!enabled) {
    emit("update:modelValue", []);
    return;
  }
  applyCurrentSource();
};

const handleSourceChange = () => {
  errorMessage.value = "";
  generationError.value = "";
  applyCurrentSource();
};

const handleInput = () => {
  const keys = parsePastedKeys();
  if (keys === null) return;
  if (keys.length > MAX_PUBLIC_KEYS) {
    errorMessage.value = `You can configure at most ${MAX_PUBLIC_KEYS} public keys.`;
    return;
  }
  emit("update:modelValue", keys);
};

const handleGeneratedKey = (pair: SshKeyPair | null) => {
  generationError.value = "";
  emit("update:modelValue", pair ? [pair.publicKey] : []);
};

watch(
  () => props.modelValue,
  () => {
    if (keySource.value === "existing" && !errorMessage.value) {
      syncFromKeys();
    }
  },
  { immediate: true, deep: true },
);

defineExpose({ canSave: validate });
</script>

<style scoped lang="scss">
.key-source {
  height: 100%;
  border: 1px solid $grey-lighter;
  box-shadow: none;

  &.is-selected {
    border-color: $secondary;
  }
}

html.dark-mode .key-source {
  border-color: rgba($white, 0.12);

  &.is-selected {
    border-color: $secondary;
  }
}
</style>
