<template>
  <div class="field has-addons mb-5">
    <div class="control is-fullwidth dropdown is-active has-icons-right">
      <input v-model="address" autofocus type="text" class="input py-5 px-3" style="
          padding-top: 1.4rem !important;
          padding-bottom: 1.4rem !important;
        " placeholder="Search for inferences, nodes, markets and accounts" />
      <span class="icon is-small pt-1 is-right">
        <SearchIcon />
      </span>
      <div v-if="searchItems.length" class="dropdown-menu is-active is-fullwidth" role="menu">
        <div class="dropdown-content has-background-white-bis">
          <a v-for="(item, index) in searchItems" :key="item"
            class="dropdown-item px-4 py-2 is-size-6 is-flex is-justify-content-space-between"
            :class="{ 'is-active': index === activeSearchItem }" @click="selectItem(item), (address = '')">
            {{ item.value }}
            <span class="is-capitalized has-text-grey-light">{{
        item.type
      }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { type Node } from '@nosana/sdk';
import { onKeyStroke } from '@vueuse/core';
import { PublicKey } from '@solana/web3.js';
import SearchIcon from '@/assets/img/icons/search.svg?component';

const router = useRouter();
const address = ref('');
const { data: jobs } = await useAPI('/api/jobs');

const { markets } = useMarkets();
const items: Ref<Array<any>> = ref([]);
const activeSearchItem: Ref<number> = ref(0);

const selectItem = (item: { type: string; value: string }) => {
  let s = '';
  if (item.type !== 'address') s = 's';
  router.push(`/${item.type}${s}/${item.value}`);
};

const searchItems = computed(() => {
  activeSearchItem.value = 0;
  if (address.value === '' || (!jobs.value && !markets.value)) {
    return [];
  }

  // combine jobs and markets in one list
  items.value = jobs
    .value!.map((a: any) => {
      return { value: a.pubkey.toString(), type: 'job' };
    })
    .concat(
      markets.value
        ? markets.value!.map((a: Node) => {
          return { value: a.address.toString(), type: 'market' };
        })
        : [],
    );

  let matches = 0;
  const results = items.value!.filter((item: any) => {
    if (
      item.value
        .toString()
        .toLowerCase()
        .includes(address.value.toLowerCase()) &&
      matches < 8
    ) {
      matches++;
      return item;
    } else {
      return false;
    }
  });

  // if its a valid address show in dropdown
  if (results.length === 0) {
    try {
      const pk = new PublicKey(address.value);
      results.push({ value: pk.toString(), type: 'address' });
    } catch (error) { }
  }

  return results;
});

// navigate through autocomplete search with arrow keys
onKeyStroke(['ArrowDown', 'ArrowUp', 'Enter'], (e) => {
  e.preventDefault();
  handleKeyStroke(e);
});

const handleKeyStroke = (e: any) => {
  if (searchItems.value.length > 0) {
    if (e.key === 'ArrowUp' && activeSearchItem.value > 0) {
      activeSearchItem.value--;
    } else if (
      e.key === 'ArrowDown' &&
      activeSearchItem.value < searchItems.value.length - 1
    ) {
      activeSearchItem.value++;
    } else if (e.key === 'Enter') {
      selectItem(searchItems.value[activeSearchItem.value]);
      address.value = '';
      activeSearchItem.value = 0;
    }
  }
};
</script>
