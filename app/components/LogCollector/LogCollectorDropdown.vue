<template>
  <div class="dropdown" :class="[dropdownClass, { 'is-active': open }]" ref="dropdownRef">
    <div class="dropdown-trigger">
      <button class="dropdown-btn" @click="open = !open">
        <span class="dropdown-btn-label">{{ label }}</span>
        <span class="icon is-small">
          <i class="fas fa-angle-down"></i>
        </span>
      </button>
    </div>
    <div class="dropdown-menu" :class="menuClass">
      <div class="dropdown-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  menuClass?: string;
  dropdownClass?: string;
}>();

const dropdownRef = ref<HTMLElement | null>(null);
const open = ref(false);

function close() { open.value = false; }

onClickOutside(dropdownRef, close);

provide('dropdown-close', close);
defineExpose({ open });
</script>

<style lang="scss" scoped>
.dropdown {
  flex: 0 0 auto;
  width: auto;

  &--jobs {
    min-width: 160px;
  }
}

.dropdown-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: none;
  padding: 0.55rem 0.75rem;
  cursor: pointer;
  color: $text;
  font-size: 1rem;
  white-space: nowrap;
  transition: background 0.1s;

  &:hover {
    background: rgba($text, 0.04);
  }
}

.dropdown-btn-label {
  font-weight: 500;
}

html.dark-mode {
  .dropdown-btn {
    color: $white-ter;
  }
}

.dropdown-menu {
  min-width: 240px;

  &--jobs {
    min-width: 300px;
  }
}

.dropdown-content {
  padding: 0;
  border: 1px solid $border;
  border-radius: 4px;
}

.dropdown--jobs .dropdown-content {
  max-height: min(75vh, 400px) !important;
  overflow-y: auto !important;
}
</style>
