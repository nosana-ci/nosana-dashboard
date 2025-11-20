<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  totalPage: number;
  maxPage: number;
}>();

const page: Ref<number> = defineModel({ default: 1 });

// Direct page input
const directPageInput = ref<string>('');

// Enhanced pagination logic - shows current page ± 2 pages (5 pages total around current)
function paginationLogic(max: number, current: number, total: number) {
  let result: Array<string | number> = [];
  
  if (total <= 7) {
    // Show all pages if total is 7 or less
    for (let i = 1; i <= total; i++) result.push(i);
  } else {
    // Always show first page
    result.push(1);
    
    // Calculate 5 pages centered around current (current ± 2)
    let startPage = Math.max(current - 2, 2);
    let endPage = Math.min(current + 2, total - 1);
    
    // Ensure we always show 5 pages in the middle when possible
    if (endPage - startPage < 4) {
      if (startPage === 2) {
        // Near beginning, extend to the right
        endPage = Math.min(startPage + 4, total - 1);
      } else if (endPage === total - 1) {
        // Near end, extend to the left
        startPage = Math.max(endPage - 4, 2);
      }
    }
    
    // Add ellipsis after first page if there's a gap
    if (startPage > 2) {
      result.push('...');
    }
    
    // Add the middle pages
    for (let i = startPage; i <= endPage; i++) {
      result.push(i);
    }
    
    // Add ellipsis before last page if there's a gap
    if (endPage < total - 1) {
      result.push('...');
    }
    
    // Always show last page
    result.push(total);
  }

  return result;
}

const pageData = computed(() => {
  return paginationLogic(props.maxPage, page.value, props.totalPage);
});

function changePage(param: string | number) {
  if (param !== '...' && param !== '+' && param !== '-') {
    page.value = Number(param);
  }
}

function handleDirectInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    const pageNum = parseInt(directPageInput.value);
    if (pageNum >= 1 && pageNum <= props.totalPage) {
      page.value = pageNum;
      directPageInput.value = '';
    }
  } else if (event.key === 'Escape') {
    directPageInput.value = '';
  }
}
</script>

<template>
  <div class="enhanced-pagination">
    <div class="pagination-container">
      <nav class="pagination is-centered" role="navigation" aria-label="pagination">
        <ul class="pagination-list">
          <li v-for="i in pageData" :key="i">
            <span v-if="i === '...'" class="pagination-ellipsis">&hellip;</span>
            <a
              v-else
              class="pagination-link"
              :class="page == i ? 'is-current' : ''"
              @click="changePage(i)"
              >{{ i }}</a
            >
          </li>
        </ul>
      </nav>

      <!-- Direct page input - always visible, positioned to the right -->
      <div class="pagination-direct" v-if="totalPage > 5">
        <div class="field">
          <div class="control">
            <input
              class="input no-spinners"
              type="number"
              :min="1"
              :max="totalPage"
              placeholder="Go to page"
              v-model="directPageInput"
              @keydown="handleDirectInputKeydown"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.enhanced-pagination {
  display: flex;
  justify-content: center;
  
  .pagination-container {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  
  .pagination {
    margin: 0;
  }
  
  .pagination-direct {
    .field {
      margin-bottom: 0;
    }
    
    .input {
      width: 120px;
      height: 2.5em; // Match Bulma pagination button height
      text-align: center;
      
      &::placeholder {
        font-size: 0.85em;
        color: #999;
      }
    }
  }
  
  // Remove number input arrows/spinners
  .no-spinners {
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    
    &[type=number] {
      -moz-appearance: textfield;
    }
  }
}

@include touch {
  .enhanced-pagination {
    .pagination-container {
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .pagination {
      font-size: 12px;
    }
    
    .pagination-direct {
      .input {
        width: 100px !important;
        height: 2.25em !important; // Match smaller pagination buttons on mobile
        font-size: 12px;
        
        &::placeholder {
          font-size: 0.8em;
        }
      }
    }
  }
}
</style>
