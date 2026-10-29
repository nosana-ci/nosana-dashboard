<template>
  <section class="mb-5">
    <h3 class="title is-5 mb-3">Quick start</h3>

    <!-- One tile a registry, styled like the template tiles -->
    <div class="fixed-grid has-1-cols has-2-cols-tablet">
      <div class="grid is-gap-2">
        <article
          v-for="info in QUICK_START_SOURCES"
          :key="info.id"
          class="deploy-tile quick-tile"
          :class="{ 'is-open': open === info.id }"
          :style="{ '--accent': info.accent }"
          :data-source="info.id"
        >
          <span class="tile-glow" aria-hidden="true"></span>
          <span class="tile-grid" aria-hidden="true"></span>
          <span class="tile-identity is-flex is-align-items-center is-gap-2">
            <img class="tile-logo" :src="info.logo" alt="" />
            <span>
              <small class="tile-label is-family-monospace is-block is-uppercase has-text-weight-semibold">{{ info.label }}</small>
              <strong class="title is-2 mb-0">{{ info.name }}</strong>
            </span>
          </span>
          <p class="is-muted">{{ info.blurb }}</p>

          <!-- The search, with its results in a dropdown under it while focused -->
          <div class="dropdown is-block" :class="{ 'is-active': open === info.id }">
            <div
              class="control has-icons-left"
              :class="{
                'is-loading':
                  picking === info.id ||
                  (info.id === 'huggingface' && hfLoading),
              }"
            >
              <input
                v-model="terms[info.id]"
                class="input is-rounded"
                type="search"
                :placeholder="info.placeholder"
                :aria-label="`Search ${info.name} models`"
                autocomplete="off"
                spellcheck="false"
                @focus="openList(info.id)"
                @keydown.escape="open = null"
              />
              <span class="icon is-left">
                <DeployCategoryIcon icon="search" class="search-icon" />
              </span>
            </div>

            <div class="dropdown-menu">
              <div class="dropdown-content">
                <p class="dropdown-item is-family-monospace is-uppercase is-size-7 is-muted">
                  {{ terms[info.id].trim() ? "Results" : "Popular" }}
                </p>
                <!-- Mounted on first open: the Ollama library loads, and
                     Hugging Face is searched, only once someone looks -->
                <template v-if="opened.has(info.id)">
                  <DeployQuickStartOllama
                    v-if="info.id === 'ollama'"
                    :term="terms.ollama"
                    @pick="pickOllama"
                  />
                  <DeployQuickStartHuggingFace
                    v-else
                    :term="terms.huggingface"
                    @loading="hfLoading = $event"
                    @pick="pickHuggingFace"
                  />
                </template>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import { useToast } from "vue-toastification";
import type { Template } from "~/composables/useTemplates";
import {
  QUICK_START_SOURCES,
  loadHuggingFaceTemplate,
  loadOllamaTemplate,
  type HuggingFaceModel,
  type QuickStartApp,
  type QuickStartSource,
} from "~/utils/quickStart";

const emit = defineEmits<{
  /** A registry model as a template, ready for the template page. */
  select: [template: Template];
}>();

// Each tile searches its own registry; its results show while its search
// has the focus, until a click lands outside the tile.
const terms = reactive<Record<QuickStartSource, string>>({
  ollama: "",
  huggingface: "",
});
const open = ref<QuickStartSource | null>(null);
const opened = reactive(new Set<QuickStartSource>());
const hfLoading = ref(false);

const openList = (source: QuickStartSource) => {
  open.value = source;
  opened.add(source);
};

useEventListener(document, "pointerdown", (event) => {
  const tile = (event.target as Element | null)?.closest("[data-source]");
  if (tile?.getAttribute("data-source") !== open.value) open.value = null;
});

// A picked model loads its readme before its page opens; the search spins
// meanwhile, and further picks wait for it.
const toast = useToast();
const picking = ref<QuickStartSource | null>(null);
const pick = async (source: QuickStartSource, load: () => Promise<Template>) => {
  if (picking.value) return;
  open.value = null;
  picking.value = source;
  try {
    emit("select", await load());
  } catch (error) {
    console.error("Quick start load error:", error);
    toast.error("That model could not be loaded. Try again in a moment.");
  } finally {
    picking.value = null;
  }
};

const pickOllama = (model: string) =>
  pick("ollama", () => loadOllamaTemplate(model));

const pickHuggingFace = (
  model: HuggingFaceModel,
  app: QuickStartApp,
  token: string,
) => pick("huggingface", () => loadHuggingFaceTemplate(model, app, token));
</script>

<style lang="scss" scoped>
/* The tile: .deploy-tile (deploy-surface.scss), with a search in the body */
.quick-tile {
  padding: 24px;

  &:hover,
  &:focus-within {
    box-shadow: 0 18px 40px -24px rgba($secondary, 0.45);
  }

  > * {
    position: relative;
    margin: 0;
  }

  // The open tile's dropdown sits above its neighbour and the templates.
  &.is-open {
    z-index: 5;
  }
}

// The brand's colour, glowing out of the tile's top corner like the hero's
// green, over a dot grid that fades out past the head.
.tile-glow,
.tile-grid {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}

.tile-glow {
  background: radial-gradient(
    circle at 100% 0%,
    color-mix(in srgb, var(--accent) 22%, transparent),
    transparent 42%
  );
}

.tile-grid {
  background-image: radial-gradient(rgba(0, 0, 0, 0.09) 1px, transparent 1px);
  background-size: 20px 20px;
  mask-image: linear-gradient(to bottom, black, transparent 140px);

  html.dark-mode & {
    background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);
  }
}

.tile-logo {
  width: 60px;
  height: 60px;
  padding: 9px;
  border-radius: 15px;
  background: #fff;
  border: 1px solid $border-soft;
  box-shadow: 0 10px 24px -14px color-mix(in srgb, var(--accent) 70%, black);
  object-fit: contain;

  html.dark-mode & {
    border-color: transparent;
  }
}

.tile-label {
  margin-bottom: 3px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: $secondary-text;

  html.dark-mode & {
    color: $secondary;
  }
}

.search-icon {
  width: 17px;
  height: 17px;
}

// The dropdown spans the search field and scrolls past a few results.
.dropdown-menu {
  width: 100%;
}

.dropdown-content {
  max-height: 400px;
  overflow-y: auto;

  /* The result rows, shared by both registries' lists */

  // A result: its name and tags, a line about it, and its sizes, stacked.
  :deep(.dropdown-item) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    white-space: normal;
  }

  :deep(.dropdown-item + .dropdown-item) {
    border-top: 1px solid $border-soft;
  }

  :deep(.result-name) {
    color: inherit;
    word-break: break-all;
  }

  :deep(.result-meta) {
    display: -webkit-box;
    color: $text-muted;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

// Muted text that follows the theme, unlike .has-text-grey.
:deep(.is-muted) {
  color: $text-muted;
}

// Bulma's dark theme recolours the list but not its button items.
html.dark-mode .dropdown-content {
  :deep(.dropdown-item) {
    background: transparent;
    color: #fff;
  }

  :deep(button.dropdown-item:hover) {
    background: rgba(255, 255, 255, 0.06);
  }

  :deep(.dropdown-item + .dropdown-item) {
    border-top-color: rgba(255, 255, 255, 0.08);
  }

  // The dark theme paints every .tag $black-ter, which vanishes on this list.
  :deep(.tag) {
    background-color: rgba(255, 255, 255, 0.08) !important;
  }

  :deep(.tag.is-warning span) {
    color: #e6c04a;
  }
}
</style>
