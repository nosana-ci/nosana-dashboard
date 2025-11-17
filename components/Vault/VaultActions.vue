<template>
  <hr class="dropdown-divider" />
  <a
    class="dropdown-item"
    @click="
      topup();
      closeMenu();
    "
    :disabled="isDisabled"
  >
    <span class="icon is-small mr-2">
      <PiggyBank02Icon />
    </span>
    <span>Top up Vault</span>
  </a>
  <a
    class="dropdown-item"
    @click="
      withdraw();
      closeMenu();
    "
    :disabled="isDisabled"
  >
    <span class="icon is-small mr-2">
      <PiggyBank01Icon />
    </span>
    <span>Withdraw Vault</span>
  </a>
</template>
<script setup lang="ts">
import type { Vault } from "@nosana/sdk";

import PiggyBank01Icon from "@/assets/img/icons/piggy-bank-01.svg?component";
import PiggyBank02Icon from "@/assets/img/icons/piggy-bank-02.svg?component";

console.log("rendered");

const { vault, closeMenu } = defineProps<{
  vault: Vault;
  closeMenu: () => void;
  isDisabled: boolean;
}>();

const { topup, withdraw } = useDeploymentVault(vault);
</script>
