<template>
  <div id="app">
    <section class="columns ml-0 mr-0 mt-0 mb-0">
      <side-bar />
      <div
        id="content"
        class="column has-navbar-fixed-top-mobile is-flex is-flex-direction-column ultrawide-centered"
      >
        <div class="section">
          <div>
            <slot />
          </div>
        </div>
        <site-footer class="mt-auto" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Handle OAuth redirect for Google login popup
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (code && window.opener) {
    window.opener.postMessage(
      {
        type: "GOOGLE_AUTH_CODE",
        code: code,
      },
      window.location.origin
    );
    window.close();
  }
});
</script>

<style lang="scss" scoped>
#content {
  min-height: 100vh;
  max-width: 1600px;
  min-width: 0;
}

/* Ultrawide screen centering - center main content while keeping sidebar fixed */
@media screen and (min-width: 1920px) {
  .ultrawide-centered {
    margin-left: auto;
    margin-right: auto;
    padding-left: 2rem;
    padding-right: 2rem;
  }

  /* Adjust the main columns container to accommodate centered content */
  .columns {
    justify-content: flex-start;
  }
}
</style>
