<template>
  <div class="op-select-header">Operation</div>
  <button
    class="op-option"
    :class="{ active: !selectedOpId }"
    @click="selectOp('')"
  >
    <span class="option-check">{{ !selectedOpId ? '\u2713' : '' }}</span>
    <span class="option-label">All operations</span>
  </button>
  <button
    v-for="op in opIds"
    :key="op"
    class="op-option"
    :class="{ active: selectedOpId === op }"
    @click="selectOp(op)"
  >
    <span class="option-check">{{ selectedOpId === op ? '\u2713' : '' }}</span>
    <span class="option-label">{{ op }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  opIds: string[];
  selectedOpId: string;
}>();

const emit = defineEmits<{
  'update:selectedOpId': [value: string];
}>();

const closeDropdown = inject<() => void>('dropdown-close', () => {});

function selectOp(value: string) {
  emit('update:selectedOpId', value);
  closeDropdown();
}
</script>

<style lang="scss" scoped>
.op-select-header {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $text-light;
  border-bottom: 1px solid $border;
}

.op-option {
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

  &:hover { background: rgba($link, 0.06); }
  &:not(.active) { opacity: 0.4; }
}

.option-check { width: 1.2rem; text-align: center; font-size: 0.85rem; color: $link; flex-shrink: 0; }
.option-label { font-weight: 500; font-size: 1rem; }

html.dark-mode {
  .op-select-header { border-bottom-color: $grey-darker; }
  .op-option { color: $white-ter; &:hover { background: rgba($white, 0.04); } }
}
</style>
