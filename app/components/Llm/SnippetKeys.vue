<template>
  <div class="is-flex is-align-items-center is-justify-content-space-between is-gap-1">
    <template v-if="activeKeys.length">
      <div class="select is-small snippet-keys-select">
        <select v-model="selectedKeyId" aria-label="API key">
          <option v-for="key in activeKeys" :key="key.id" :value="key.id">
            {{ key.name }} · {{ maskKey(key.key) }}
          </option>
        </select>
      </div>
      <CopyButton :text="selectedKey?.key ?? ''" label="Copy this API key" />
      <button type="button" class="button is-small is-quiet" @click="showCreateKey = true">
        New key
      </button>
    </template>
    <template v-else>
      <span>{{ loadingKeys ? "Loading your API keys…" : "You have no API keys yet." }}</span>
      <button type="button" class="snippet-create" @click="showCreateKey = true">
        Create an API key
      </button>
    </template>
    <ApiKeyCreateModal v-model="showCreateKey" @created="onKeyCreated" />
  </div>
</template>

<script setup lang="ts">
import CopyButton from "~/components/Common/CopyButton.vue";
import ApiKeyCreateModal from "~/components/Account/ApiKeyCreateModal.vue";
import { maskKey, type ApiKey } from "~/composables/useApiKeys";

// The reader's own keys under the playground's code, so the one to export as
// NOSANA_API_KEY is a copy away, and a new one is made without leaving the page.
// The chat calls the gateway with the same key.
const { activeKeys, selectedKey, selectedKeyId, loadingKeys, refreshKeys } =
  usePlaygroundKey();
const showCreateKey = ref(false);

const onKeyCreated = async (key: ApiKey) => {
  await refreshKeys();
  selectedKeyId.value = key.id;
};
</script>

<style scoped lang="scss">
// The select shrinks before the buttons beside it do.
.snippet-keys-select {
  flex: 1;
  min-width: 0;

  select {
    width: 100%;
  }
}

.snippet-create {
  border: 0;
  padding: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  color: $secondary-text;
  cursor: pointer;
}

html.dark-mode .snippet-create {
  color: $secondary;
}
</style>
