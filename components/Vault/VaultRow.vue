<template>
  <td>{{ vault }}</td>
  <td>{{ balance.SOL }} SOL</td>
  <td>{{ balance.NOS }} NOS</td>
  <td>
    {{ created_at }}
  </td>
  <td>
    <button class="button is-small ml-2" @click="topup">Top Up</button>
    <button class="button is-small ml-2" @click="withdraw">Withdraw</button>
  </td>
</template>
<script setup lang="ts">
import { type Vault } from "@nosana/sdk";
import { useDeploymentVault } from "~/composables/useDeploymentVault";

const props = defineProps<{
  vault: Vault;
}>();

const { balance, created_at, vault, topup, withdraw } = useDeploymentVault(
  props.vault
);
</script>
