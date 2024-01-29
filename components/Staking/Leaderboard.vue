<template>
  <div class="box" style="overflow-x: auto;">
    <h2 class="is-size-4 mb-3">TOP 3 STAKERS</h2>
    <table class="table is-fullwidth">
      <thead>
        <tr>
          <th class="has-text-grey has-text-weight-normal pl-0">Address</th>
          <th class="has-text-grey has-text-weight-normal">Unstake days</th>
          <th class="has-text-grey has-text-weight-normal">xNOS</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stake in leaderboard" style="max-width: 100%;">
          <td class="pl-0 address" style="max-width: 200px;">{{ stake.address }}</td>
          <td>{{ stake.unstake }}</td>
          <td>{{ stake.xnos.toFixed().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts" setup>
const leaderboard: Ref<any> = ref([
  {
    'address': 'nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7',
    'unstake': 365,
    'xnos': 5012941
  },
  {
    'address': 'nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7',
    'unstake': 365,
    'xnos': 5012941
  },
  {
    'address': 'nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7',
    'unstake': 365,
    'xnos': 5012941
  },
])

</script>
<style scoped lang="scss">
table {
 td, th {
  border: 0;
 } 
}
</style>