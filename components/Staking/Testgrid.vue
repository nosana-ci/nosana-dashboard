<template>
  <div class="dark-mode">
    <div class="box has-background-body mb-5" style="background-color: #051306 !important;">
      <logo width="130px" class="mt-3" :white="true" :animated="true" />
      <h2 class="title is-2 pt-2 mb-3 is-family-primary has-text-weight-semibold">
        Test Grid Specifications
      </h2>
      <a class="button is-outlined is-wider is-secondary has-text-weight-semibold is-rounded"
        href="https://nosana.com/compute" target="_blank">
        Find Out More
      </a>
    </div>
  </div>
</template>
<style scoped lang="scss">
.box {
  background-image: url('@/assets/img/testgrid.svg');
  background-position: right;
  background-size: contain;
  background-repeat: no-repeat;
  border: 1px solid $grey-darker !important;
}
</style>