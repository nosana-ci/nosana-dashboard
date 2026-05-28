<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="dismissModal"></div>
    <div class="modal-content" style="max-width: 450px; width: 100%">
      <div class="box has-text-centered p-6" style="border-radius: 16px">
        <h1 class="title is-3 mb-3">Verify to claim free credits</h1>
        <p class="subtitle is-6 has-text-grey mb-4">
          <template v-if="formattedAmount">
            Add a valid debit or credit card to unlock
            <strong class="has-text-success">{{ formattedAmount }}</strong> in
            free credits.
          </template>
          <template v-else>
            Add a valid debit or credit card to unlock your free credits.
          </template>
        </p>

        <p v-if="errorMessage" class="help is-danger mb-4">{{ errorMessage }}</p>

        <div class="mt-5">
          <nuxt-link
            to="/account/payments?source=free-credits"
            class="button is-dark is-fullwidth is-medium"
            style="border-radius: 8px"
            @click="closeModal"
          >
            Verify payment method
          </nuxt-link>
        </div>

        <div class="mt-4">
          <a
            @click="dismissModal"
            class="has-text-grey-light is-size-7 is-clickable is-block"
          >
            Maybe later
          </a>
        </div>
      </div>
    </div>
    <button
      class="modal-close is-large"
      aria-label="close"
      @click="dismissModal"
    ></button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";

const props = defineProps<{
  modelValue: boolean;
  amount?: number | null;
  errorMessage?: string | null;
}>();

const emit = defineEmits(["update:modelValue", "dismissed"]);

const formattedAmount = computed(() => {
  if (props.amount != null) {
    const dollars = props.amount / 1000;
    return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
  }
  return null;
});

const justOpened = ref(false);
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      justOpened.value = true;
      nextTick(() => {
        justOpened.value = false;
      });
    }
  },
);

const closeModal = () => {
  if (!justOpened.value) {
    emit("update:modelValue", false);
  }
};

const dismissModal = () => {
  if (!justOpened.value) {
    emit("dismissed");
    emit("update:modelValue", false);
  }
};
</script>
