<template>
  <div class="search-wrapper">
    <input
      type="text"
      class="search-input"
      :placeholder="placeholder"
      :value="displayValue"
      @input="onInput(($event.target as HTMLInputElement).value)"
      @focus="focused = true"
      @blur="focused = false"
    />
    <button
      v-if="displayValue"
      class="clear-search"
      @click="clear"
    >
      &times;
    </button>
  </div>
</template>

<script setup lang="ts">
const model = defineModel<string>({ default: '' });

defineProps<{
  placeholder?: string;
}>();

const focused = defineModel<boolean>('focused', { default: false });

const displayValue = ref(model.value);

const debouncedEmit = useDebounceFn((value: string) => {
  model.value = value;
}, 300);

function onInput(value: string) {
  displayValue.value = value;
  debouncedEmit(value);
}

function clear() {
  displayValue.value = '';
  model.value = '';
}

watch(model, (val) => {
  displayValue.value = val;
});
</script>

<style lang="scss" scoped>
.search-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  color: $text;
  padding: 0.55rem 1.8rem 0.55rem 0.6rem;
  font-size: 1rem;
  min-width: 0;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: $text-light;
    opacity: 0.4;
  }
}

.clear-search {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: $text-light;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0 0.2rem;
  line-height: 1;

  &:hover {
    color: $text;
  }
}

html.dark-mode {
  .search-input { color: $white-ter; }
}
</style>
