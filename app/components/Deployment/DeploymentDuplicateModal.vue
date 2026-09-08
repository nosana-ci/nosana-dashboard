<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="close"></div>
    <div class="modal-card is-app-modal is-normal">
      <header class="modal-card-head">
        <div
          class="is-flex is-align-items-center is-gap-2 is-flex-grow-1"
          style="min-width: 0"
        >
          <span class="app-modal-icon">
            <DuplicateIcon />
          </span>
          <div style="min-width: 0">
            <p class="modal-card-title title is-5 mb-0">Duplicate Deployment</p>
            <p class="has-text-grey is-size-7">
              Copy of
              <span class="has-text-weight-semibold">{{
                currentName || "Deployment"
              }}</span>
            </p>
          </div>
        </div>
        <button class="delete" aria-label="close" @click="close"></button>
      </header>

      <section class="modal-card-body">
        <div class="field">
          <label class="label is-size-7">New deployment name</label>
          <div class="control">
            <input
              type="text"
              class="input"
              :value="name"
              maxlength="100"
              :placeholder="defaultName"
              @input="
                $emit('update:name', ($event.target as HTMLInputElement).value)
              "
              @keydown.enter.prevent="submit"
            />
          </div>
        </div>

        <!-- Optional market override, folded away so the default (same GPU as
             the source) needs no interaction. -->
        <div class="dup-accordion" :class="{ 'is-open': marketOpen }">
          <button
            type="button"
            class="dup-accordion-head"
            :aria-expanded="marketOpen"
            @click="toggleMarket"
          >
            <span class="dup-accordion-text">
              <span class="dup-accordion-title">
                Deploy on a different GPU
                <span class="dup-optional-tag">Optional</span>
              </span>
              <span class="dup-accordion-sub">{{ marketSummary }}</span>
            </span>
            <ChevronDownIcon class="dup-accordion-caret" aria-hidden="true" />
          </button>

          <!-- Mounted only while the panel is open, so the market fetch is
               paid for by the people who actually want a different GPU. -->
          <div v-if="marketOpen" class="dup-accordion-panel">
            <DeploymentMarketPicker
              :currentMarket="currentMarket"
              :testgridMarkets="testgridMarkets"
              :jobDefinition="jobDefinition"
              @select="onSelectMarket"
            />
          </div>
        </div>

        <p class="is-size-7 has-text-grey mt-4 mb-0">
          The copy keeps this deployment's replicas, timeout, strategy and
          active revision. You'll be taken to it once it's created.
        </p>
      </section>

      <footer class="modal-card-foot">
        <p class="has-text-grey is-size-7 modal-foot-summary">
          Creates
          <span class="has-text-weight-semibold">{{
            name.trim() || defaultName
          }}</span>
          on
          <span class="has-text-weight-semibold">{{ targetMarketName }}</span>
        </p>
        <div class="buttons mb-0">
          <button
            class="button"
            title="Open this copy in the create form instead of deploying it now"
            @click="configure"
          >
            Configure
          </button>
          <button
            class="button is-success"
            :class="{ 'is-loading': actionLoading }"
            :disabled="actionLoading"
            @click="submit"
          >
            Duplicate
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JobDefinition, Market } from "@nosana/kit";
import ChevronDownIcon from "@/assets/img/icons/chevron-down.svg?component";
import DuplicateIcon from "@/assets/img/icons/duplicate.svg?component";
import { marketName } from "~/utils/solana";

const props = defineProps<{
  modelValue: boolean;
  name: string;
  /** Empty string means "same market as the source deployment". */
  market: string;
  currentName: string;
  /** Address of the source deployment's market. */
  currentMarket: string;
  testgridMarkets: any[];
  jobDefinition: JobDefinition | null;
  actionLoading: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:name": [value: string];
  "update:market": [value: string];
  confirm: [];
  configure: [];
}>();

const marketOpen = ref(false);

// Every open starts from the source's market with the picker folded away.
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    marketOpen.value = false;
    emit("update:market", "");
  },
  { immediate: true },
);

const toggleMarket = () => {
  marketOpen.value = !marketOpen.value;
};

const onSelectMarket = (market: Market | null) => {
  const address = market?.address?.toString() ?? "";
  emit("update:market", address === props.currentMarket ? "" : address);
};

const targetMarketName = computed(() =>
  marketName(props.market || props.currentMarket, props.testgridMarkets),
);

const marketSummary = computed(() =>
  props.market
    ? `Moving to ${targetMarketName.value}`
    : `Same GPU as the original (${targetMarketName.value})`,
);

// Shown as the placeholder and used when the field is left empty.
const defaultName = computed(
  () => `${props.currentName || "Deployment"} (copy)`,
);

const close = () => emit("update:modelValue", false);

const submit = () => {
  if (props.actionLoading) return;
  emit("confirm");
  emit("update:modelValue", false);
};

// Hand the copy to the create page instead of deploying it straight away, so
// the job definition and settings can be edited first. The dialog is left open
// on purpose: closing it clears ?action=duplicate from the deployment's URL,
// and that navigation would cancel the pending one. Leaving the page unmounts
// this dialog anyway, and the parent closes it if the navigation fails.
const configure = () => emit("configure");
</script>

<style lang="scss" scoped>
.dup-accordion {
  border: 1px solid $grey-lightest;
  border-radius: 12px;
  overflow: hidden;

  &.is-open {
    border-color: $grey-lighter;
  }
}

.dup-accordion-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: inherit;

  &:hover {
    background: rgba($grey, 0.06);
  }
}

.dup-accordion-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.dup-accordion-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 600;
}

.dup-optional-tag {
  font-family: $title-family;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba($grey, 0.16);
  color: $grey;
}

.dup-accordion-sub {
  font-size: 0.75rem;
  color: $grey;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dup-accordion-caret {
  width: 18px;
  height: 18px;
  flex: none;
  color: $grey;
  transition: transform 0.18s ease;

  .is-open & {
    transform: rotate(180deg);
  }
}

.dup-accordion-panel {
  padding: 0 1rem 1rem;
  border-top: 1px solid $grey-lightest;
  /* The grid can be long; keep the dialog itself a sane height. */
  max-height: 46vh;
  overflow-y: auto;
}



html.dark-mode {
  .dup-accordion {
    border-color: #2c2c2c;

    &.is-open {
      border-color: #3a3a3a;
    }
  }

  .dup-accordion-head:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .dup-accordion-panel {
    border-top-color: #2c2c2c;
  }
}
</style>
