<template>
  <span class="jdot" :class="[stateClass, { 'is-pulsing': pulse }]"></span>
</template>

<script setup lang="ts">
const props = defineProps<{ state: number; pulse?: boolean }>();

// Numeric job state (0-3) → presentation class.
const stateClass = computed(
  () =>
    ({ 0: "queued", 1: "running", 2: "completed", 3: "stopped" })[
      props.state
    ] || "stopped",
);
</script>

<style lang="scss" scoped>
.jdot {
  position: relative;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
  background: $grey-light;
}

.jdot.queued {
  background: $warning;
}
.jdot.running {
  background: $success;
}
.jdot.completed {
  background: $info;
}
.jdot.stopped {
  background: $grey-light;
}

.jdot.running.is-pulsing::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px solid $success;
  opacity: 0.5;
  animation: jpulse 2.4s ease-out infinite;
}

@keyframes jpulse {
  0% {
    transform: scale(0.5);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
</style>
