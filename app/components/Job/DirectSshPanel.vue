<template>
  <section>
    <p v-if="loading" class="has-text-grey is-size-7" role="status">
      Loading SSH keys…
    </p>
    <p v-else-if="error" class="has-text-grey is-size-7" role="status">
      Could not load SSH keys. Retry here or reload the SSH keys in
      Configuration.
      <button type="button" class="button is-small is-quiet ml-2" @click="emit('retry')">
        Try again
      </button>
    </p>
    <template v-else-if="publicKeys.length">
      <CommandBlock :command="command">
        {{ publicKeys.length }}
        {{ publicKeys.length === 1 ? "public key is" : "public keys are" }}
        configured. Replace <code>{{ SSH_PRIVATE_KEY_PLACEHOLDER }}</code> with
        the private key that matches one of them.
      </CommandBlock>
    </template>
    <div v-else class="ssh-empty">
      <svg
        class="ssh-empty-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      <p class="ssh-empty-title">No SSH keys configured</p>
      <template v-if="isDeploymentManaged">
        <p class="ssh-empty-text">
          Direct SSH needs a public key on this deployment before you can
          connect from your own terminal.
        </p>
        <NuxtLink v-if="configurationLink" class="ssh-empty-link" :to="configurationLink">
          Add a key in Configuration ›
        </NuxtLink>
      </template>
      <p v-else class="ssh-empty-text">
        Direct SSH was not enabled for this job. Add a public key under
        <code>ssh.public_keys</code> when creating the job.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import CommandBlock from "~/components/Common/CommandBlock.vue";
import {
  buildDirectSshCommand,
  SSH_PRIVATE_KEY_PLACEHOLDER,
} from "~/utils/sshAccess";

const props = defineProps<{
  jobAddress: string;
  node: string;
  operationIndex?: number;
  publicKeys: string[];
  loading?: boolean;
  error?: string;
  isDeploymentManaged?: boolean;
  deploymentId?: string;
}>();
const emit = defineEmits<{ retry: [] }>();

const config = useRuntimeConfig();

// The deployment's SSH keys live on its configuration tab.
const configurationLink = computed(() =>
  props.deploymentId
    ? {
        path: `/deployments/${props.deploymentId}`,
        query: { tab: "configuration" },
      }
    : null,
);

const command = computed(() =>
  buildDirectSshCommand({
    job: props.jobAddress,
    node: props.node,
    nodeDomain: String(config.public.nodeDomain),
    proxyPort: String(config.public.sshProxyPort),
    opIndex: props.operationIndex,
  }),
);
</script>

<style scoped lang="scss">
/* Nothing to copy yet: say so plainly and point at where a key is added. */
.ssh-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.75rem 1.5rem;
  border: 1px dashed $border-soft;
  border-radius: 14px;
  background: $white-bis;
}

.ssh-empty-icon {
  width: 2rem;
  height: 2rem;
  color: $text-muted;
}

.ssh-empty-title {
  margin-top: 0.85rem;
  font-weight: 600;
  color: $text;
}

.ssh-empty-text {
  margin-top: 0.35rem;
  max-width: 30rem;
  font-size: 0.85rem;
  color: $text-muted;
}

.ssh-empty-link {
  margin-top: 0.9rem;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

html.dark-mode .ssh-empty {
  border-color: rgba($white, 0.12);
  background: rgba($white, 0.02);
}

html.dark-mode .ssh-empty-title {
  color: $white;
}

html.dark-mode .ssh-empty-text {
  color: $grey-light;
}
</style>
