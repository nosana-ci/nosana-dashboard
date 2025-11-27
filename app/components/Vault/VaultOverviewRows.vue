<template>
  <template v-if="isTableRow">
    <tr>
      <td>Vault address</td>
      <td>{{ vault }}</td>
    </tr>
    <tr>
      <td>
        Vault balance
        <span
          class="refresh icon is-small ml-1 borderless vertical-middle"
          @click="updateBalance"
          :class="{ 'is-loading': balance.loading }"
          :disabled="balance.loading"
          data-tooltip="Refresh vault balance."
        >
          <RefreshIcon />
        </span>
      </td>
      <td>
        SOL: {{ balance.SOL }} | NOS: {{ balance.NOS }}
        <span @click="topup" class="button small ml-3 pt-0 pb-0 height-auto"
          ><small>Topup</small></span
        >
      </td>
    </tr>
  </template>
  <template v-else>
    <td class="relative z-index-2">
      <div>SOL: {{ balance.SOL }} | NOS: {{ balance.NOS }}</div>
      <span
        class="is-size-7 is-family-monospace has-text-grey"
        @click="
          push({
            query: {
              tab: 'vaults',
              search: vault,
            },
          })
        "
        >{{ vault.slice(0, 6) + "..." + vault.slice(-6)
        }}<span class="refresh icon is-small ml-1 borderless vertical-middle"
          ><ArrowSquareUpRightIcon /></span
      ></span>
    </td>
  </template>
</template>
<script setup lang="ts">
import { useRouter } from "vue-router";
import type { Deployment } from "@nosana/sdk";
import RefreshIcon from "@/assets/img/icons/refresh.svg?component";
import ArrowSquareUpRightIcon from "@/assets/img/icons/arrow-square-up-right.svg?component";
import { useDeploymentVault } from "~/composables/useDeploymentVault";

interface VaultProps {
  isTableRow: boolean;
  deployment: Deployment;
}

const { deployment } = defineProps<VaultProps>();

const { push } = useRouter();
const { balance, updateBalance, vault, topup } = useDeploymentVault(deployment);
</script>
