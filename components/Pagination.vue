<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  totalPage: number;
  maxPage: number;
}>();

const page: Ref<number> = defineModel({ default: 1 });

function paginationLogic(max: number, current: number, total: number) {
  let result: Array<string | number> = [];
  let temp: Array<string | number> = [];

  if (total <= max) {
    for (let i = 1; i <= total; i++) result.push(i);
  } else if (current <= max - 2) {
    for (let i = 1; i <= max - 2; i++) temp.push(i);
    result = [...temp, '...', total];
  } else if (total - (max - 3) <= current && current <= total) {
    temp = [];
    for (let i = 0; i <= max - 3; i++) temp.unshift(total - i);
    result = [1, '...', ...temp];
  } else {
    temp = [current];
    const loop = (max - 4) / 2;
    for (let i = 1; i <= loop; i++) temp.unshift(current - i);
    for (let i = 1; i <= loop; i++) temp.push(current + i);
    result = [1, '...', ...temp, '...', total];
  }

  return result;
}

const pageData = computed(() => {
  return paginationLogic(props.maxPage, page.value, props.totalPage);
});

function changePage(param: string | number) {
  if (param === '+' && page.value < props.totalPage) {
    page.value = page.value + 1;
  } else if (param === '-' && page.value > 1) {
    page.value = page.value - 1;
  } else if (param !== '...' && param !== '+' && param !== '-') {
    page.value = Number(param);
  }
}
</script>

<template>
  <div>
    <slot name="prev-button" :change-page="changePage">
      <a
        class="pagination-previous"
        :disabled="modelValue < 2 ? true : null"
        @click="changePage('-')"
      >
        <span class="is-hidden-touch">Previous</span>
        <span class="is-hidden-desktop">&lt;</span>
      </a>
    </slot>
    <slot :pagination="pageData" :change-page="changePage">
      <ul class="pagination-list">
        <li v-for="i in pageData" :key="i">
          <span v-if="i === '...'" class="pagination-ellipsis">&hellip;</span>
          <a
            v-else
            class="pagination-link"
            :class="modelValue == i ? 'is-current has-text-weight-bold' : ''"
            @click="changePage(i)"
            >{{ i }}</a
          >
        </li>
      </ul>
    </slot>
    <slot name="next-button" :change-page="changePage">
      <a
        :disabled="modelValue >= totalPage ? true : null"
        class="pagination-next"
        @click="changePage('+')"
      >
        <span class="is-hidden-touch">Next</span>
        <span class="is-hidden-desktop">&gt;</span>
      </a>
    </slot>
  </div>
</template>

<style lang="scss" scoped>
@include touch {
  .pagination {
    font-size: 12px;
  }
}
</style>
