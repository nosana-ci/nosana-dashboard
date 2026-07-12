<template>
  <div class="mb-5">
    <h2 class="title is-5 mb-3">Deployment details</h2>
    <div class="box is-borderless">
      <div class="table-container">
        <table class="table is-fullwidth mb-0" style="table-layout: fixed">
          <tbody>
            <!-- Vault Details Section -->
            <VaultOverviewRows
              v-if="hasVault && deploymentVault"
              :isTableRow="true"
              :deployment="deployment"
            />
            <tr>
              <td style="width: 25%">Deployment strategy</td>
              <td style="width: 75%">
                {{ formatStrategy(deployment.strategy) }}
              </td>
            </tr>
            <tr>
              <td style="width: 25%">Replicas</td>
              <td style="width: 75%">{{ deployment.replicas }}</td>
            </tr>
            <tr>
              <td style="width: 25%">GPU</td>
              <td style="width: 75%" v-if="deployment && deployment.market">
                <span
                  v-if="
                    testgridMarkets &&
                    testgridMarkets.find(
                      (tgm: any) => tgm.address === deployment?.market,
                    )
                  "
                >
                  {{
                    testgridMarkets.find(
                      (tgm: any) => tgm.address === deployment?.market,
                    ).name
                  }}
                </span>
                <span v-else>{{ deployment.market }}</span>
              </td>
            </tr>
            <tr>
              <td style="width: 25%">Container timeout</td>
              <td style="width: 75%">
                <SecondsFormatter
                  :seconds="deployment.timeout * 60"
                  :showSeconds="false"
                />
              </td>
            </tr>

            <!-- Scheduled deployment cron schedule -->
            <tr
              v-if="
                deployment.strategy?.toUpperCase() === 'SCHEDULED' &&
                deploymentSchedule
              "
            >
              <td style="width: 25%">Schedule</td>
              <td style="width: 75%">
                <div class="is-flex is-flex-direction-column">
                  <span class="is-family-monospace">{{
                    deploymentSchedule
                  }}</span>
                  <span class="is-size-7 has-text-grey mt-1">{{
                    parseCronExpression(deploymentSchedule || "")
                  }}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="width: 25%">Created on</td>
              <td style="width: 75%">
                {{ formatDate(deployment.created_at) }}
              </td>
            </tr>
            <tr>
              <td style="width: 25%">Last updated on</td>
              <td style="width: 75%">
                {{ formatDate(deployment.updated_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Deployment } from "@nosana/kit";
import SecondsFormatter from "~/components/SecondsFormatter.vue";
import VaultOverviewRows from "~/components/Vault/VaultOverviewRows.vue";
import { parseCronExpression } from "~/utils/parseCronExpression";
import { formatDate } from "~/utils/formatDate";

defineProps<{
  deployment: Deployment;
  hasVault: boolean;
  deploymentVault: any;
  deploymentSchedule: string | null;
  testgridMarkets: any[];
}>();

const formatStrategy = (strategy: string | undefined | null): string => {
  if (!strategy) return "-";
  return strategy.toLowerCase().replace(/-/g, " ");
};
</script>
