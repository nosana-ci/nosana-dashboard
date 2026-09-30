<template>
  <span class="account-avatar" aria-hidden="true">
    <NosanaMark />
  </span>
</template>

<script setup lang="ts">
/**
 * The account's picture. Accounts have no picture of their own to set, so every
 * one wears the Nosana mark rather than a blank silhouette.
 */
import NosanaMark from "@/assets/img/icon.svg?component";
</script>

<style scoped lang="scss">
.account-avatar {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 28%;
  background: rgba($secondary, 0.14);

  // On the mark itself: the places this sits in set a text colour on their icon.
  svg {
    width: 56%;
    height: 56%;
    color: $secondary;
  }
}
</style>
