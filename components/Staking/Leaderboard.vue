<template>
  <div class="box" style="overflow-x: auto;" v-if="leaderboard && leaderboard.stakes">
    <h2 class="is-size-4 mb-3">TOP 5 STAKERS</h2>
    <table class="table is-fullwidth">
      <thead>
        <tr>
          <th class="has-text-grey has-text-weight-normal pl-0">Address</th>
          <th class="has-text-grey has-text-weight-normal">Unstake days</th>
          <th class="has-text-grey has-text-weight-normal">xNOS</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stake in leaderboard.stakes.data.slice(0, 5)" style="max-width: 100%;">
          <td class="pl-0">
            <span class="address">{{ stake.address }}</span>
          </td>
          <td>{{ stake.duration / 60 / 60 / 24 }}</td>
          <td>{{ (stake.xnos / 1e6).toFixed().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts" setup>
import { useAPI2 } from '~/composables/useAPI2';

const { data: leaderboard, pending: loadingStakeTotals, error: errorStakeTotals, refresh: refreshLeaderboard } =
  await useAPI2('/stake/leaderboards');
</script>
<style scoped lang="scss">
table {
 td, th {
  border: 0;
 } 
}
</style>