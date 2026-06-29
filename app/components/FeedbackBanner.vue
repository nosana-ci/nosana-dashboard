<template>
  <a
    v-if="!dismissed"
    :href="SURVEY_URL"
    target="_blank"
    rel="noopener noreferrer"
    class="notification clickable-notification feedback-banner is-secondary is-light is-radiusless mb-0 py-2 px-6 has-text-centered is-block"
  >
    <span class="has-text-weight-semibold">
      Share your feedback for a chance to win $50 in GPU credits.
    </span>
    <span class="is-hidden-mobile">
      3-minute survey for Nosana deployment users · 4 winners drawn · $200 total
    </span>
    <button class="delete" aria-label="Dismiss" @click.prevent.stop="dismiss" />
  </a>
</template>

<style scoped lang="scss">
@use "sass:color";

// Banner-specific tweaks only — layout/colour come from Bulma classes,
// and dark-mode overrides live in assets/styles/dark-mode.scss.
.feedback-banner {
  // Deepen the tint on hover (.clickable-notification adds the lift + shadow).
  &:hover {
    background-color: rgba($secondary, 0.28);
  }

  // Vertically centre Bulma's close button in the slim bar and recolour its
  // cross to match the banner instead of the default dark circle.
  .delete {
    top: 50%;
    transform: translateY(-50%);
    background-color: transparent;

    &:hover {
      background-color: rgba($secondary, 0.2);
    }

    &::before,
    &::after {
      background-color: color.adjust($secondary, $lightness: -25%);
    }
  }

  // The fixed mobile top-navbar would otherwise cover the banner.
  @include touch {
    margin-top: $navbar-height;
  }
}
</style>

<script setup lang="ts">
const SURVEY_URL =
  "https://nosana.notion.site/81dc36dd38c947f087a5fd6ea8b5179d?pvs=105";

// Bump this key to re-show the banner to users who previously dismissed it.
const STORAGE_KEY = "feedback_survey_banner_dismissed:2026-06";

const dismissed = ref(true);

onMounted(() => {
  if (typeof localStorage === "undefined") {
    dismissed.value = false;
    return;
  }
  dismissed.value = localStorage.getItem(STORAGE_KEY) === "1";
});

const dismiss = () => {
  dismissed.value = true;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, "1");
  }
};
</script>
