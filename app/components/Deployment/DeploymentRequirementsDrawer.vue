<template>
  <Teleport to="body">
    <div class="rq-scrim" @click="emit('close')"></div>
    <aside
      class="rq"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rq-title"
    >
      <header class="rq-head">
        <h2 id="rq-title" class="rq-title">Change GPU</h2>
        <button
          type="button"
          class="delete"
          aria-label="Close"
          @click="emit('close')"
        ></button>
      </header>

      <div class="rq-body">
        <DeployRequirementsSelection
          v-model="draft"
          :markets="markets"
          :required-vram-gb="requiredVramGb"
          @matching="matching = $event"
        />
      </div>

      <footer class="rq-foot">
        <div class="rq-status">
          <p v-if="matching" :class="{ 'is-none': matching.hosts === 0 }">
            <strong>{{ hostsLabel(matching.hosts) }}</strong> on this GPU ·
            {{ matching.available }} free now
          </p>
          <p class="rq-note">{{ note }}</p>
        </div>
        <button
          v-if="changed"
          type="button"
          class="button is-text"
          @click="draft = market"
        >
          Undo
        </button>
        <button
          type="button"
          class="button is-success"
          :disabled="!changed || actionLoading"
          @click="save"
        >
          Save GPU
        </button>
      </footer>
    </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import type {
  MarketRate,
  MatchingHosts,
} from "~/composables/useNodeRequirements";

// Mounted while open: the draft starts from the deployment's market each time.
const props = defineProps<{
  /** The deployment's market: the draft starts here. */
  market: string;
  /** The testgrid `/markets` rows: the markets to choose from. */
  markets: MarketRate[] | null;
  /** The VRAM the job definition asks for; GPUs below it are hidden. */
  requiredVramGb: number | null;
  actionLoading: boolean;
}>();

const emit = defineEmits<{
  close: [];
  /** The market to move the deployment to. */
  save: [market: string];
}>();

const draft = ref(props.market);
const matching = ref<MatchingHosts | null>(null);
const changed = computed(() => draft.value !== props.market);

const note = computed(() =>
  changed.value
    ? "A new GPU moves the deployment to its market: running jobs restart on the new GPU's hosts."
    : "Pick another GPU to move the deployment to its market.",
);

const hostsLabel = (hosts: number) => `${hosts} host${hosts === 1 ? "" : "s"}`;

function save() {
  emit("save", draft.value);
  emit("close");
}

useEventListener(document, "keydown", (event: KeyboardEvent) => {
  if (event.key === "Escape") emit("close");
});
</script>

<style scoped lang="scss">
// As the job panel: level with the top bar's account control, later in the DOM.
.rq-scrim {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba($black, 0.45);
}

.rq {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  width: min(100vw, 760px);
  display: flex;
  flex-direction: column;
  background: $body-background-color;
  color: $text;
  border-left: 1px solid $border-soft;
  box-shadow: -40px 0 80px -30px rgba($black, 0.35);
}

.rq-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem 1.75rem 1.25rem;
  border-bottom: 1px solid $border-soft;
}

.rq-title {
  margin: 0;
  font-family: $title-family;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: $text;
}

// The selector's steps number themselves from here: 01 the GPU, 02 the hosts.
.rq-body {
  counter-reset: deploy-step;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 1.5rem 1.75rem;
}

.rq-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 1rem 1.75rem;
  border-top: 1px solid $border-soft;
}

.rq-status {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: $text-muted;

  p {
    margin: 0;
  }

  strong {
    font-weight: 600;
    color: $text;
  }

  // Nothing matches: jobs would wait in the queue until a host does.
  .is-none strong {
    color: #9a5b00;
  }
}

.rq-note {
  font-size: 12.5px;
}

html.dark-mode {
  .rq {
    background: $body-background-color-dark;
    color: $white;
    border-left-color: rgba($white, 0.1);
    box-shadow: -40px 0 80px -30px rgba($black, 0.8);
  }

  .rq-head,
  .rq-foot {
    border-color: rgba($white, 0.08);
  }

  .rq-title,
  .rq-status strong {
    color: $white;
  }

  .rq-status {
    color: $grey-light;
  }

  .rq-status .is-none strong {
    color: $warning;
  }
}

@include touch {
  .rq-head,
  .rq-body,
  .rq-foot {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
