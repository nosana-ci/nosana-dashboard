<template>
  <li class="section-row">
    <span class="row-tile"><KeyIcon aria-hidden="true" /></span>
    <div class="row-main">
      <div class="row-title">
        {{ label }}
        <span class="chip">{{ algorithm }}</span>
      </div>
      <details class="row-subtitle">
        <summary class="is-clickable">
          <span class="is-family-monospace">{{ preview }}</span>
          <span class="is-underlined ml-2">View key</span>
        </summary>
        <pre class="mt-2 p-3 has-radius"><code>{{ publicKey }}</code></pre>
      </details>
    </div>
    <button
      type="button"
      class="icon-button is-danger"
      :disabled="disabled"
      :aria-label="`Remove ${label}`"
      :title="`Remove ${label}`"
      @click="emit('remove')"
    >
      <TrashIcon aria-hidden="true" />
    </button>
  </li>
</template>

<script setup lang="ts">
import KeyIcon from "@/assets/img/icons/key.svg?component";
import TrashIcon from "@/assets/img/icons/trash.svg?component";
import {
  shortenSshKeyBody,
  sshKeyAlgorithmLabel,
  sshKeyLabel,
} from "~/utils/sshKey";

const props = defineProps<{
  publicKey: string;
  index: number;
  disabled?: boolean;
}>();
const emit = defineEmits<{ remove: [] }>();

const label = computed(() => sshKeyLabel(props.publicKey, props.index));
const algorithm = computed(() => sshKeyAlgorithmLabel(props.publicKey));
const preview = computed(() => shortenSshKeyBody(props.publicKey));
</script>

<style scoped lang="scss">
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 0.75rem;
}

html.dark-mode pre {
  background: rgba($white, 0.06);
  color: $white;
}
</style>
