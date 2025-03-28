<template>
  <span v-if="formatted.days">{{ formatted.days }}d&nbsp;</span>
  <span v-if="formatted.days || formatted.hours"
    >{{ formatted.hours }}h&nbsp;</span
  >
  <span>{{ formatted.minutes }}m</span>
  <span v-if="props.showSeconds">&nbsp;{{ formatted.seconds }}s</span>
</template>
<script setup lang="ts">
import { useSecondsFormatter } from "~/composables/useSecondsFomatter";

interface Props {
  seconds: number;
  showSeconds?: boolean;
}

const secondsFormatter = useSecondsFormatter();
const props = defineProps<Props>();
const formatted = ref(secondsFormatter(props.seconds));

watch(props, (props) => {
  formatted.value = secondsFormatter(props.seconds);
});
</script>
