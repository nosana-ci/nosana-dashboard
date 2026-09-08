<template>
  <div class="level-select-header">Log Level</div>
  <button
    v-for="t in LOG_TYPES"
    :key="t.value"
    class="level-option"
    :class="{ active: isActive(t.value) }"
    @click="$emit('toggle', t.value)"
  >
    <span class="option-check">{{ isActive(t.value) ? "\u2713" : "" }}</span>
    <span class="option-icon" :class="'icon-' + t.value"></span>
    <span class="option-label">{{ t.label }}</span>
    <span class="option-desc">{{ t.desc }}</span>
  </button>
  <div class="level-select-footer">
    <button class="menu-action" @click="$emit('showAll')">
      Show all
    </button>
    <button class="menu-action" @click="$emit('clearLevels')">
      Clear
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  LOG_TYPES,
  type LogEntryType,
} from "~/composables/jobs/logCollectorUtils";

const props = defineProps<{
  activeTypes: Set<LogEntryType>;
}>();

defineEmits<{
  toggle: [type: LogEntryType];
  showAll: [];
  clearLevels: [];
}>();

function isActive(type: LogEntryType): boolean {
  return props.activeTypes.size === 0 || props.activeTypes.has(type);
}
</script>

<style lang="scss" scoped>
.level-select-header {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $text-light;
  border-bottom: 1px solid $border;
}

.level-option {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  background: none;
  border: none;
  padding: 0.55rem 0.75rem;
  cursor: pointer;
  font-size: 1rem;
  color: $text;
  text-align: left;
  transition: background 0.1s;

  &:hover {
    background: rgba($link, 0.06);
  }
  &:not(.active) {
    opacity: 0.4;
  }
}

.option-check {
  width: 1.2rem;
  text-align: center;
  font-size: 0.85rem;
  color: $link;
  flex-shrink: 0;
}

.option-icon {
  font-size: 1rem;
  flex-shrink: 0;
  &.icon-container {
    color: #6e7681;
  }
  &.icon-system {
    color: #58a6ff;
  }
  &.icon-error {
    color: #f85149;
  }
}

.option-label {
  font-weight: 500;
  font-size: 1rem;
}
.option-desc {
  flex: 1;
  font-size: 0.85rem;
  color: $text-light;
}

.level-select-footer {
  display: flex;
  gap: 0.5rem;
  padding: 0.35rem 0.7rem;
  border-top: 1px solid $border;
}

.menu-action {
  background: none;
  border: none;
  color: $link;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  &:hover {
    text-decoration: underline;
  }
}

html.dark-mode {
  .level-select-header {
    border-bottom-color: $grey-darker;
  }
  .level-option {
    color: $white-ter;
    &:hover {
      background: rgba($white, 0.04);
    }
  }
  .level-select-footer {
    border-top-color: $grey-darker;
  }
}
</style>
