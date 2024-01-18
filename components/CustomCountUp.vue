<template>
  <CountUp :end-val="customEndVal" @init="onInit">
    <template #prefix>
      <slot name="prefix"></slot>
    </template>
    <template #suffix>
      <slot name="suffix"></slot>
    </template>
  </CountUp>
</template>

<script setup lang="ts">
import CountUp from 'vue-countup-v3'
interface Props {
  endVal: number;
}
const props: Props = defineProps({
  endVal: {
    type: Number,
    required: true,
  }
});
let countUp: any;

const onInit = (ctx: any) => {
  countUp = ctx;
};
const customEndVal: Ref<Props['endVal']> = ref(props.endVal);

watch(() => props.endVal, (newValue: Props['endVal']) => {
  countUp?.update(newValue)
});
</script>

<style lang="scss">
.countup-wrap {
  overflow: hidden;
  width: 100%;
}
</style>