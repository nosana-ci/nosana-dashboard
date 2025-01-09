<template>
  <div class="dark-mode">
    <div class="box has-background-body mb-5" style="background-color: #051306 !important;">
      <logo width="130px" class="mt-3" :white="true" :animated="true" />
      <h2 class="title is-2 pt-2 mb-4 has-text-weight-semibold">
        AI innovation happens on Nosana
      </h2>
      <a class="button is-outlined is-widest is-white is-rounded" href="https://nosana.com/" target="_blank">
        Explore our Solutions
      </a>
    </div>
  </div>
</template>
<style scoped lang="scss">
.box {
  background-image: url('@/assets/img/grid.jpg');
  background-position: right;
  background-size: contain;
  background-repeat: no-repeat;
  border: 1px solid $grey-darker !important;
}
</style>