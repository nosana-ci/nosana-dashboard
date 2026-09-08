<template>
  <section>
    <h3 class="title is-6 mb-2">Connect from your terminal</h3>

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
      <CommandBlock :command="command" />
      <p class="help mt-3">
        {{ publicKeys.length }}
        {{ publicKeys.length === 1 ? "public key is" : "public keys are" }}
        configured. Add <code>-i &lt;private-key-path&gt;</code> if the matching
        key is not your default SSH identity.
      </p>
    </template>
    <p v-else class="has-text-grey">
      <template v-if="isDeploymentManaged">
        Add a public key in the SSH keys section below to set up Direct SSH.
      </template>
      <template v-else>
        Direct SSH was not enabled for this job. Add a public key under
        <code>ssh.public_keys</code> when creating the job.
      </template>
    </p>
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
}>();
const emit = defineEmits<{ retry: [] }>();

const config = useRuntimeConfig();
const proxyMode = ref<ProxyMode>("socat");

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
