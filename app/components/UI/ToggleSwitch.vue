<template>
  <label class="switch" :class="{ 'is-small': small, 'is-disabled': disabled }">
    <input
      type="checkbox"
      role="switch"
      :checked="modelValue"
      :aria-checked="modelValue"
      :disabled="disabled"
      @change="
        emit('update:modelValue', ($event.target as HTMLInputElement).checked)
      "
    />
    <span class="track" aria-hidden="true"></span>
    <span v-if="$slots.default" class="switch-label"><slot /></span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  small?: boolean;
  disabled?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>

<style scoped lang="scss">
.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;

  input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
  }

  .track {
    position: relative;
    flex: none;
    width: 38px;
    height: 22px;
    border-radius: $radius-rounded;
    background: $border;
    transition: background 0.18s;

    &::after {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: $white;
      box-shadow: 0 1px 2px rgba($black, 0.3);
      transition: transform 0.18s;
    }
  }

  input:checked + .track {
    background: $secondary;

    &::after {
      transform: translateX(16px);
    }
  }

  input:focus-visible + .track {
    outline: 2px solid $secondary;
    outline-offset: 2px;
  }

  .switch-label {
    font-size: 0.875rem;
  }

  &.is-small {
    gap: 0.5rem;

    .track {
      width: 32px;
      height: 18px;

      &::after {
        width: 14px;
        height: 14px;
      }
    }

    input:checked + .track::after {
      transform: translateX(14px);
    }

    .switch-label {
      font-size: 0.75rem;
    }
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

html.dark-mode .switch .track {
  background: $grey-darker;
}
</style>
