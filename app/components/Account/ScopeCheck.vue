<template>
  <component
    :is="readonly ? 'span' : 'label'"
    class="scope-cell has-tooltip-arrow is-inline-flex is-align-items-center is-gap-1"
    :class="{
      checkbox: !readonly,
      'is-static': readonly,
      'is-checked': checked,
    }"
    :data-tooltip="tooltip"
  >
    <span v-if="!readonly" class="scope-check">
      <input type="checkbox" :checked="checked" @change="$emit('toggle')" />
      <FontAwesomeIcon :icon="faCheck" class="scope-check-mark" />
    </span>
    <span v-else-if="checked" class="icon is-small has-text-success">
      <FontAwesomeIcon :icon="faCheck" />
    </span>
    <span v-else class="has-text-grey-light">—</span>

    <slot />

    <span v-if="credits" class="icon is-small has-text-warning">
      <FontAwesomeIcon :icon="faCoins" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faCheck, faCoins } from "@fortawesome/free-solid-svg-icons";

defineProps<{
  tooltip?: string;
  credits?: boolean;
  readonly?: boolean;
  checked: boolean;
}>();

defineEmits<{ toggle: [] }>();
</script>

<style scoped lang="scss">
// Bulma's .checkbox/.icon/is-* helpers cover the layout and the readonly glyphs; a
// drawn checkbox skin is the one thing Bulma has no component for, so it stays custom.
.scope-cell {
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  transition: background-color 0.1s ease;

  &:not(.is-static):hover {
    background: $surface-hover;
  }

  &.is-static {
    cursor: default;
  }
}

.scope-check {
  position: relative;
  display: inline-flex;
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;

  input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border: 1.5px solid $border;
    border-radius: 4px;
    background: $scheme-main;
    transition:
      background-color 0.1s ease,
      border-color 0.1s ease;
  }

  .scope-check-mark {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 0.65rem;
    height: 0.65rem;
    color: $white;
    opacity: 0;
    transition: opacity 0.1s ease;
    pointer-events: none;
  }
}

.scope-cell.is-checked .scope-check {
  &::before {
    background: $secondary;
    border-color: $secondary;
  }

  .scope-check-mark {
    opacity: 1;
  }
}
</style>
