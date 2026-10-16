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
        <h2 id="rq-title" class="rq-title">Change Requirements</h2>
        <button
          type="button"
          class="delete"
          aria-label="Close"
          @click="emit('close')"
        ></button>
      </header>

      <div class="rq-body">
        <DeployRequirementsSelection
          v-model="draftGpus"
          v-model:requirements="draftRequirements"
          :required-vram-gb="requiredVramGb"
          @matching="matching = $event"
        />
      </div>

      <footer class="rq-foot">
        <div class="rq-status">
          <p v-if="matching" :class="{ 'is-none': matching.hosts === 0 }">
            <strong>{{ hostsLabel(matching.hosts) }}</strong> with
            {{ draftGpus.length === 1 ? "this GPU" : "these GPUs" }} ·
            <template v-if="matching.qualifying !== null">
              {{ matching.qualifying }} of {{ matching.available }} free now
              meet the requirements
            </template>
            <template v-else>{{ matching.available }} free now</template>
          </p>
          <p class="rq-note">{{ note }}</p>
        </div>
        <button
          v-if="changed"
          type="button"
          class="button is-text"
          @click="undo"
        >
          Undo
        </button>
        <button
          type="button"
          class="button is-success"
          :disabled="!canSave || actionLoading"
          @click="save"
        >
          Save requirements
        </button>
      </footer>
    </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import {
  gpusInMarket,
  gpusOf,
  keepCategorizedRequirements,
  useGpuListings,
  withGpus,
  type DeploymentRequirements,
  type MatchingHosts,
  type Requirements,
} from "~/composables/useNodeRequirements";

// Mounted while open: the draft starts from the saved GPUs and requirements
// each time.
const props = defineProps<{
  /** The saved requirements: the GPUs under `name`, and the specs. */
  requirements: DeploymentRequirements;
  /** The deployment's market; set on one made when the GPU was picked as a market. */
  market: string | null;
  /** The VRAM the job definition asks for; GPUs below it are hidden. */
  requiredVramGb: number | null;
  actionLoading: boolean;
}>();

const emit = defineEmits<{
  close: [];
  /** The GPUs and the specs together, as on create: the market is dropped. */
  save: [requirements: DeploymentRequirements];
}>();

const saved = keepCategorizedRequirements(props.requirements);
const draftRequirements = ref<Requirements>({ ...saved });
const matching = ref<MatchingHosts | null>(null);

// The saved GPUs; a deployment made when the GPU was picked as a market
// starts from the GPUs that market serves, once the catalogue resolves.
const { listings } = useGpuListings();
const savedGpus = ref(gpusOf(props.requirements));
const draftGpus = ref([...savedGpus.value]);
if (!savedGpus.value.length && props.market) {
  const market = props.market;
  const stop = watch(
    listings,
    (gpus) => {
      const served = gpusInMarket(gpus, market);
      if (!served.length) return;
      savedGpus.value = served;
      draftGpus.value = [...served];
      stop();
    },
    { immediate: true },
  );
}

// Key and GPU order are not a change: compare sorted entries.
const entriesOf = (requirements: Requirements) =>
  JSON.stringify(
    Object.entries(requirements).sort(([a], [b]) => a.localeCompare(b)),
  );
const sameGpus = (a: string[], b: string[]) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const changed = computed(
  () =>
    !sameGpus(draftGpus.value, savedGpus.value) ||
    entriesOf(draftRequirements.value) !== entriesOf(saved),
);
// A deployment made on one market can always be saved: that moves it to
// every premium market serving its GPUs.
const canSave = computed(
  () => (changed.value || Boolean(props.market)) && draftGpus.value.length > 0,
);

const note = computed(() =>
  props.market
    ? "Saving lets new and replacement jobs run on these GPUs in any premium market, cheapest first. Running jobs keep their hosts."
    : "Running jobs keep their hosts. New and replacement jobs use these GPUs and requirements.",
);

const hostsLabel = (hosts: number) => `${hosts} host${hosts === 1 ? "" : "s"}`;

function undo() {
  draftGpus.value = [...savedGpus.value];
  draftRequirements.value = { ...saved };
}

function save() {
  emit("save", withGpus(draftRequirements.value, draftGpus.value));
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
