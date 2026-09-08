<template>
  <div class="mb-5">
    <template v-if="!hasSessionAuth">
      <h2 class="title is-5 mb-3">SSH keys</h2>
      <div class="notification is-info is-light">
        Sign in or connect your wallet to authorize container access for this
        deployment.
      </div>
    </template>

    <section
      v-else
      aria-labelledby="ssh-keys-heading"
      :aria-busy="loading || saving"
    >
      <div class="section-head">
        <h2 id="ssh-keys-heading" class="title is-5 mb-0">
          SSH keys
          <span v-if="!loading && !error" class="chip ml-2">
            {{ draftKeys.length }} / {{ MAX_KEYS }}
          </span>
        </h2>
        <button
          ref="addButton"
          type="button"
          class="button is-small is-quiet"
          :disabled="
            loading ||
            saving ||
            !!error ||
            addingKey ||
            draftKeys.length >= MAX_KEYS
          "
          :aria-expanded="addingKey"
          aria-controls="ssh-key-form"
          @click="addingKey = true"
        >
          Add public key
        </button>
      </div>

      <div class="section-card">
        <p v-if="loading" class="section-empty" role="status">
          Loading SSH keys…
        </p>
        <div v-else-if="error" class="section-empty">
          <p class="has-text-danger mb-3" role="alert">{{ error }}</p>
          <button type="button" class="button is-small is-quiet" @click="reload">
            Try again
          </button>
        </div>
        <template v-else>
          <ul v-if="draftKeys.length" aria-label="Deployment public keys">
            <SshKeyRow
              v-for="(key, index) in draftKeys"
              :key="key"
              :public-key="key"
              :index="index"
              :disabled="saving"
              @remove="removeKey(index)"
            />
          </ul>
          <p v-else-if="!addingKey" class="section-empty">
            <strong>No public keys added</strong>
            <br />
            Add a public key to use Direct SSH. Your private keys stay on your
            device.
          </p>

          <SshKeyForm
            v-if="addingKey"
            id="ssh-key-form"
            ref="keyForm"
            :error="inputError"
            :disabled="saving"
            @submit="submitKey"
            @cancel="closeKeyForm"
            @edit="inputError = ''"
          />

          <div v-if="saving || saveError" class="section-row">
            <p
              class="row-subtitle mt-0"
              :class="{ 'has-text-danger': saveError }"
              :role="saveError ? 'alert' : 'status'"
              aria-live="polite"
            >
              {{ saveError || "Saving SSH keys…" }}
            </p>
            <button
              v-if="saveError"
              type="button"
              class="button is-small is-quiet ml-auto"
              @click="reload"
            >
              Reload keys
            </button>
          </div>
        </template>
      </div>

      <p
        v-if="failedJobs.length && !saving"
        class="notification is-warning is-light mt-4"
        role="status"
      >
        SSH key changes could not be applied to {{ failedJobs.length }} running
        {{ failedJobs.length === 1 ? "job" : "jobs" }}. Newly started jobs will
        use the saved keys.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { MAX_SSH_PUBLIC_KEYS as MAX_KEYS } from "@nosana/kit";
import { useWallet } from "@nosana/solana-vue";
import SshKeyForm from "~/components/Deployment/SshKeyForm.vue";
import SshKeyRow from "~/components/Deployment/SshKeyRow.vue";
import { useDeploymentSshKeys } from "~/composables/useDeploymentSshKeys";

const props = defineProps<{ deploymentId: string }>();

const { connected } = useWallet();
const { isAuthenticated: superTokensAuth } = useSuperTokens();
const hasSessionAuth = computed(() => connected.value || superTokensAuth.value);

const {
  sshPublicKeys,
  loading,
  error,
  reload,
  draftKeys,
  addKeys,
  removeKey,
  saving,
  saveError,
  failedJobs,
} = useDeploymentSshKeys(() => props.deploymentId, hasSessionAuth);

// Add-key form
const addingKey = ref(false);
const inputError = ref("");
const keyForm = ref<InstanceType<typeof SshKeyForm> | null>(null);
const addButton = ref<HTMLButtonElement | null>(null);

async function closeKeyForm() {
  addingKey.value = false;
  inputError.value = "";
  await nextTick();
  addButton.value?.focus();
}

function submitKey(text: string) {
  if (saving.value) return;
  inputError.value = addKeys(text);
  if (inputError.value) {
    keyForm.value?.focus();
    return;
  }
  void closeKeyForm();
}

// A fresh saved set (load, save, or deployment change) closes the form too.
watch(sshPublicKeys, () => {
  addingKey.value = false;
  inputError.value = "";
});
</script>
