<template>
  <!-- Specifications Section -->
  <tr>
    <td colspan="2" class="has-background-light">
      <h4 class="title is-5 mb-0">Specifications</h4>
    </td>
  </tr>
  <tr>
    <td>GPU</td>
    <td>
      <span v-if="specs.gpus?.length">
        {{ specs.gpus[0].gpu }}
      </span>
      <span v-else>-</span>
    </td>
  </tr>
  <tr>
    <td>CPU</td>
    <td>{{ specs.cpu }}</td>
  </tr>
  <tr>
    <td>RAM</td>
    <td>{{ specs.ram }} GB</td>
  </tr>
  <tr>
    <td>Disk Space</td>
    <td>{{ specs.diskSpace }} GB</td>
  </tr>
  <tr>
    <td>Country</td>
    <td>{{ specs.country }}</td>
  </tr>
</template>

<script setup lang="ts">
interface Specs {
  gpus: Array<{ gpu: string }>;
  cpu: string;
  ram: number;
  diskSpace: number;
  country: string;
  bandwidth?: {
    ping: number;
    download: number;
    upload: number;
  };
}

const props = defineProps<{
  specs: Specs;
}>();
</script>

<style lang="scss" scoped>
.info-icon {
  width: 20px;
  height: 20px;
  background-image: url("https://www.systemuicons.com/images/icons/info_circle.svg");
}
</style>
