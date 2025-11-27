<template>
  <svg 
    :width="size" 
    :height="size" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    :class="['wallet-icon', className]"
  >
    <rect 
      x="2" 
      y="4" 
      width="20" 
      height="14" 
      rx="2" 
      :stroke="color" 
      stroke-width="2"
      :fill="filled ? color : 'none'"
    />
    <line 
      x1="2" 
      y1="9" 
      x2="22" 
      y2="9" 
      :stroke="color" 
      stroke-width="2"
    />
    <circle 
      cx="18" 
      cy="14" 
      r="1" 
      :fill="color" 
      stroke="none"
    />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  size?: string | number;
  color?: string;
  filled?: boolean;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  color: 'currentColor',
  filled: false,
  className: ''
});
</script>

<style scoped>
.wallet-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>