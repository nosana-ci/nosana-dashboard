<template>
  <div class="box has-background-black">
    <logo width="110px" class="mt-3" :white="true" :animated="true" />
    <h2 class="title is-3 pt-2 mb-3 has-text-white is-family-primary has-text-weight-semibold">
      Test Grid Specifications Phase 1
    </h2>
    <a class="button is-outlined is-secondary mb-3 px-5 has-text-weight-semibold	has-radius-large" href="https://nosana.io/test-grid/" target="_blank">
      Find Out More
    </a>
  </div>
</template>
<style scoped lang="scss">
.box {
  background-image: url('@/assets/img/testgrid.svg');
  background-position: right;
  background-size:contain;
  background-repeat: no-repeat;
}
.button {
  border-radius: 2rem;
  padding: 0 1.8rem !important;
  height: 30px;
  font-size: 12px;
}
</style>