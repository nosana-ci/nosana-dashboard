<template>
  <Teleport to="body">
    <div class="modal credit-transaction-history-modal" :class="{ 'is-active': modelValue }">
      <div class="modal-background" @click="closeModal"></div>
      <div
        class="modal-content credit-transaction-history-content"
        style="max-width: 720px; width: 100%"
        @click.stop
      >
        <div class="box p-0" style="border-radius: 16px; overflow: hidden">
          <div class="px-5 pt-5 pb-4">
            <h3 class="title is-4 mb-1">Balance history</h3>
            <p class="subtitle is-6 has-text-grey mb-0">
              Your recent credit activity
            </p>
          </div>

          <progress
            v-if="loading && !transactions.length"
            class="progress is-small is-info mb-0"
            max="100"
          ></progress>
          <div v-else-if="error" class="has-text-centered py-6 px-5">
            <p class="has-text-danger mb-3">{{ error }}</p>
            <button type="button" class="button is-small" @click="fetchTransactions">
              Try again
            </button>
          </div>
          <div v-else-if="!transactions.length" class="has-text-centered py-6 px-5">
            <span class="icon is-large has-text-grey-light mb-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 36px; height: 36px">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                <path d="M12 17.5v-11" />
              </svg>
            </span>
            <p class="has-text-grey">No credit activity yet.</p>
          </div>
          <template v-else>
            <div class="table-container mb-0">
              <table class="table is-fullwidth is-hoverable mb-0">
                <thead>
                  <tr>
                    <th class="px-5 py-4">Date</th>
                    <th class="px-5 py-4">Type</th>
                    <th class="px-5 py-4 has-text-right">Amount</th>
                    <th class="px-5 py-4 has-text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="transaction in transactions" :key="transaction.id">
                    <td class="px-5 py-4">{{ formatDate(transaction.createdAt) }}</td>
                    <td class="px-5 py-4">
                      <span
                        class="tag is-light"
                        :class="isCreditTransactionInflow(transaction.type) ? 'is-success' : 'is-danger'"
                      >
                        <span>{{ getCreditTransactionLabel(transaction.type) }}</span>
                      </span>
                    </td>
                    <td class="px-5 py-4 has-text-right">
                      <strong
                        :style="{
                          color: isCreditTransactionInflow(transaction.type) ? '#48c78e' : '#f14668',
                        }"
                      >
                        {{ isCreditTransactionInflow(transaction.type) ? "+" : "-" }}${{
                          transaction.amountUsd.toFixed(2)
                        }}
                      </strong>
                    </td>
                     <td class="px-5 py-4 has-text-right">
                      <span v-if="transaction.method"
                        :class="transaction.type === 'token_topup' ? 'is-uppercase' : 'is-capitalized'">
                        {{ transaction.method }}
                      </span>
                      <span v-else>-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <nav
              v-if="totalPages > 1"
              class="pagination is-centered is-small px-5 py-4 mb-0 credit-transaction-history-footer"
              role="navigation"
              aria-label="pagination"
            >
              <button
                type="button"
                class="pagination-previous"
                :disabled="currentPage <= 1 || loading"
                @click="goToPage(currentPage - 1)"
              >
                Previous
              </button>
              <button
                type="button"
                class="pagination-next"
                :disabled="currentPage >= totalPages || loading"
                @click="goToPage(currentPage + 1)"
              >
                Next
              </button>
              <ul class="pagination-list">
                <li>
                  <span class="has-text-grey is-size-7">
                    Page {{ currentPage }} of {{ totalPages }}
                  </span>
                </li>
              </ul>
            </nav>
          </template>
        </div>
      </div>
      <button
        class="modal-close is-large"
        aria-label="close"
        @click="closeModal"
      ></button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { formatDate } from "~/utils/formatDate";
import {
  getCreditTransactionLabel,
  isCreditTransactionInflow,
} from "~/utils/creditTransactionTypes";

interface CreditTransaction {
  id: string;
  type: string;
  method?: string;
  amountUsd: number;
  createdAt: string;
}

interface CreditTransactionsResponse {
  transactions: CreditTransaction[];
  total: number;
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const PAGE_SIZE = 8;
const MODAL_ID = "credit-transaction-history";
const config = useRuntimeConfig().public;
const { onCreditRefresh } = useCreditRefresh();
const { lockScroll, unlockScroll } = useModalScrollLock();

const transactions = ref<CreditTransaction[]>([]);
const total = ref(0);
const currentPage = ref(1);
const loading = ref(false);
const error = ref<string | null>(null);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

const closeModal = () => {
  emit("update:modelValue", false);
};

const fetchTransactions = async () => {
  loading.value = true;
  error.value = null;

  try {
    const offset = (currentPage.value - 1) * PAGE_SIZE;
    const data = await $fetch<CreditTransactionsResponse>(
      `${config.apiBase}/api/credits/transactions`,
      {
        credentials: "include",
        query: {
          limit: PAGE_SIZE,
          offset,
        },
      },
    );

    transactions.value = data.transactions;
    total.value = data.total;

    if (!data.transactions.length && data.total > 0 && currentPage.value > 1) {
      currentPage.value = Math.min(currentPage.value - 1, totalPages.value);
      await fetchTransactions();
    }
  } catch (err) {
    console.error("Error fetching credit transactions:", err);
    transactions.value = [];
    total.value = 0;
    error.value = "Failed to load credit activity.";
  } finally {
    loading.value = false;
  }
};

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value || loading.value) {
    return;
  }
  currentPage.value = page;
  fetchTransactions();
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeModal();
  }
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      currentPage.value = 1;
      fetchTransactions();
      lockScroll(MODAL_ID);
      window.addEventListener("keydown", onKeydown);
    } else {
      unlockScroll(MODAL_ID);
      window.removeEventListener("keydown", onKeydown);
    }
  },
);

onBeforeUnmount(() => {
  unlockScroll(MODAL_ID);
  window.removeEventListener("keydown", onKeydown);
});

onCreditRefresh(() => {
  if (!props.modelValue) return;
  currentPage.value = 1;
  fetchTransactions();
});
</script>

<style scoped>
.credit-transaction-history-content {
  position: relative;
  z-index: 2;
}

.credit-transaction-history-footer {
  border-top: 1px solid #ededed;
}
</style>

<style>
.dark-mode .credit-transaction-history-footer {
  border-top-color: #363636;
}
</style>
