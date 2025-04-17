<template>
  <div class="field has-addons">
    <div
      class="control is-fullwidth dropdown is-active has-icons-left"
      :class="{ 'is-loading': checkingIfJob }"
    >
      <input
        v-model="address"
        autofocus
        type="text"
        class="input"
        style="
          padding-top: 1.4rem !important;
          padding-bottom: 1.4rem !important;
        "
        placeholder="Search for deployements, hosts and GPUs"
        :disabled="checkingIfJob"
      />
      <span class="icon pt-1 is-left" v-if="!checkingIfJob">
        <SearchIcon style="width: 1.5em; height: 1.5em" />
      </span>
      <div
        v-if="searchItems.length"
        class="dropdown-menu is-active is-fullwidth"
        role="menu"
      >
        <div class="dropdown-content has-background-white-bis">
          <a
            v-for="(item, index) in searchItems"
            :key="item"
            class="dropdown-item px-4 py-2 is-size-6 is-flex is-justify-content-space-between"
            :class="{ 'is-active': index === activeSearchItem }"
            @click="(selectItem(item), (address = ''))"
          >
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
import { type Node } from "@nosana/sdk";
import { onKeyStroke } from "@vueuse/core";
import { PublicKey } from "@solana/web3.js";
import SearchIcon from "@/assets/img/icons/search.svg?component";

const router = useRouter();
const address = ref("");
const { markets } = useMarkets();
const items: Ref<Array<any>> = ref([]);
const activeSearchItem: Ref<number> = ref(0);
const checkingIfJob = ref(false);

const selectItem = async (item: { type: string; value: string }) => {
  if (item.type === "account") {
    checkingIfJob.value = true;
    let isJob = false;
    let isNode = false;

    try {
      const { data: job } = await useAPI(`/api/jobs/${item.value}`, {
        // @ts-ignore TODO: add to useAPI opts type
        disableToastOnError: true,
      });
      if (job.value) {
        item.type = "job";
        isJob = true;
      }
    } catch (error) {
      // Job check failed, continue to node check
    }

    if (!isJob) {
      try {
        const { data: node } = await useAPI(`/api/nodes/${item.value}/specs`, {
          // @ts-ignore TODO: add to useAPI opts type
          disableToastOnError: true,
        });
        if (node.value) {
          item.type = "node";
          isNode = true;
        }
      } catch (error) {
        // Node check failed
      }
    }

    checkingIfJob.value = false;

    // If not a job or node, default to account
    if (!isJob && !isNode) {
      item.type = "account";
    }
  }

  // Route based on item type
  switch (item.type) {
    case "job":
      router.push(`/jobs/${item.value}`);
      break;
    case "node":
      router.push(`/host/${item.value}`);
      break;
    case "market":
      router.push(`/markets/${item.value}`);
      break;
    case "account":
      router.push(`/deployer/${item.value}`);
      break;
    default:
      router.push(`/${item.type}/${item.value}`);
  }
};

const searchItems = computed(() => {
  activeSearchItem.value = 0;
  if (address.value === "") {
    return [];
  }

  // combine jobs and markets in one list
  items.value = markets.value
    ? markets.value!.map((a: any) => {
        return { value: a.address.toString(), type: "market" };
      })
    : [];

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
      results.push({ value: pk.toString(), type: "account" });
    } catch (error) {}
  }

  return results;
});

// navigate through autocomplete search with arrow keys
onKeyStroke(["ArrowDown", "ArrowUp", "Enter"], (e) => {
  e.preventDefault();
  handleKeyStroke(e);
});

const handleKeyStroke = (e: any) => {
  if (searchItems.value.length > 0) {
    if (e.key === "ArrowUp" && activeSearchItem.value > 0) {
      activeSearchItem.value--;
    } else if (
      e.key === "ArrowDown" &&
      activeSearchItem.value < searchItems.value.length - 1
    ) {
      activeSearchItem.value++;
    } else if (e.key === "Enter") {
      selectItem(searchItems.value[activeSearchItem.value]);
      address.value = "";
      activeSearchItem.value = 0;
    }
  }
};
</script>
