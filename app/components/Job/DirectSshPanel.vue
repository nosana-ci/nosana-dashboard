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
      <div class="seg-tabs mb-3" role="group" aria-label="SSH proxy client">
        <button
          v-for="mode in PROXY_MODES"
          :key="mode"
          type="button"
          :class="{ 'is-active': proxyMode === mode }"
          :aria-pressed="proxyMode === mode"
          @click="proxyMode = mode"
        >
          {{ mode }}
        </button>
      </div>
      <CommandBlock :command="command">
        {{ publicKeys.length }}
        {{ publicKeys.length === 1 ? "public key is" : "public keys are" }}
        configured. Add <code>-i &lt;private-key-path&gt;</code> if the matching
        key is not your default SSH identity.
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
import { createSshCommand } from "@nosana/kit";
import CommandBlock from "~/components/Common/CommandBlock.vue";

const PROXY_MODES = ["socat", "nc"] as const;
type ProxyMode = (typeof PROXY_MODES)[number];

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
const proxyMode = ref<ProxyMode>("socat");

// The deployment's SSH keys live on its configuration tab.
const configurationLink = computed(() =>
  props.deploymentId
    ? {
        path: `/deployments/${props.deploymentId}`,
        query: { tab: "configuration" },
      }
    : null,
);

const command = computed(
  () =>
    createSshCommand(
      {
        job: props.jobAddress,
        node: props.node,
        nodeDomain: String(config.public.nodeDomain),
      },
      {
        proxyPort: String(config.public.sshProxyPort),
        proxyMode: proxyMode.value,
        opIndex: props.operationIndex,
      },
    ).formattedCommand,
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
  border: 1px dashed $grey-lighter;
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
