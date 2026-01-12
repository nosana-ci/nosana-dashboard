<template>
  <template v-if="isTableRow">
    <tr>
      <td style="width: 25%;">Vault address</td>
      <td style="width: 75%;">{{ vault }}</td>
    </tr>
    <tr>
      <td style="width: 25%;">Vault balance</td>
      <td style="width: 75%;">
        SOL: {{ balance.SOL }} | NOS: {{ balance.NOS }}
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
import type { Deployment } from "@nosana/kit";
import ArrowSquareUpRightIcon from "@/assets/img/icons/arrow-square-up-right.svg?component";
import { useDeploymentVault } from "~/composables/useDeploymentVault";

interface VaultProps {
  isTableRow: boolean;
  deployment: Deployment;
}

const { deployment } = defineProps<VaultProps>();

const { push } = useRouter();
const { balance, vault, topup } = useDeploymentVault(deployment);
</script>
