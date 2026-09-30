<template>
  <div class="dev-portal">
    <TopBar
      :title="'Developers'"
      :subtitle="'Build on the Nosana network'"
      ref="topBar"
      v-model="showSettingsModal"
    />

    <!-- Hero banner -->
    <section class="hero-banner mb-6">
      <div class="hero-grid"></div>
      <div class="columns is-vcentered is-variable is-5">
        <div class="column">
          <h1 class="title is-2 mb-4">
            One key.<br />GPUs and&nbsp;inference.
          </h1>
          <p class="subtitle is-5 hero-sub mb-5">
            Your Nosana API key deploys workloads to decentralized GPUs
            <em>and</em> calls our OpenAI-compatible inference endpoint. Same
            key, same credit balance, no separate signup.
          </p>
          <div class="is-flex is-flex-wrap-wrap is-gap-1.5">
            <button class="button is-glow" @click="openPlayground">
              <span>Open the playground</span>
              <ArrowRightIcon class="btn-arrow" />
            </button>
            <a
              href="https://learn.nosana.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="button is-white is-outlined"
            >
              Read the docs
            </a>
          </div>
        </div>

        <!-- One key, two ways -->
        <div class="column">
          <div class="bridge">
            <div class="bridge-head">
              <span class="is-size-7 is-uppercase is-family-monospace has-text-grey">
                your nosana api key
              </span>
              <code class="tag is-secondary is-light is-rounded is-family-monospace">
                nos_{{ "•".repeat(24) }}
              </code>
            </div>
            <div class="bridge-split" aria-hidden="true">
              <span class="bridge-line"></span>
              <span class="bridge-line"></span>
            </div>
            <div class="bridge-panes">
              <div class="bridge-pane">
                <span class="pane-title">Deploy to GPUs</span>
                <pre class="pane-code is-family-monospace"><span class="tok-key">import</span> { createNosanaClient }
<span class="tok-key">from</span> <span class="tok-str">'@nosana/kit'</span>

nosana.jobs.<span class="tok-fn">list</span>(def, 3600, market)</pre>
                <span class="is-size-7 is-family-monospace has-text-secondary">billed in credits</span>
              </div>
              <div class="bridge-pane">
                <span class="pane-title">Call inference</span>
                <pre class="pane-code is-family-monospace"><span class="tok-key">from</span> openai <span class="tok-key">import</span> OpenAI

<span class="tok-fn">OpenAI</span>(base_url=<span class="tok-str">"{{ shortBase }}/v1"</span>,
       api_key=<span class="tok-str">"nos_…"</span>)</pre>
                <span class="is-size-7 is-family-monospace has-text-secondary">billed in credits</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Tabs -->
    <div ref="tabBar" class="tabs mb-5">
      <ul>
        <li
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ 'is-active': activeTab === tab.id }"
        >
          <a @click="activeTab = tab.id">{{ tab.label }}</a>
        </li>
      </ul>
    </div>

    <template v-if="isAuthenticated">
      <section v-show="activeTab === 'playground'" class="mb-6">
        <LlmPlayground
          :models="models"
          :loading="loadingModels"
          :initial-model="playgroundModel"
          @model="playgroundModel = $event"
        />
        <div class="mt-5">
          <h3 class="title is-5 mb-3">The same call, in your code</h3>
          <LlmCodeSnippets
            :base-url="inferenceBase"
            :model="playgroundModel || models.find(isChatModel)?.id || 'model-id'"
          />
        </div>
      </section>

      <section v-show="activeTab === 'keys'" class="mb-6">
        <ApiKeys />
      </section>

      <section v-show="activeTab === 'apps'" class="mb-6">
        <OAuthApps />
      </section>
    </template>

    <div v-else class="box signin-prompt has-text-centered p-6 mb-6">
      <span class="icon is-large has-text-grey-light">
        <FontAwesomeIcon :icon="faKey" size="2x" />
      </span>
      <h5 class="title is-5 mt-2 mb-2">Sign in to get a key</h5>
      <p class="subtitle is-6 has-text-grey">
        One Nosana API key covers GPU deployments and inference, drawn from the
        same credit balance. Log in with email or Google to create one.
      </p>
      <nuxt-link to="/account" class="button is-dark">Go to account</nuxt-link>
    </div>

    <!-- Resources -->
    <section class="mb-6">
      <h3 class="title is-4 mb-4">Resources</h3>
      <div class="fixed-grid has-1-cols has-2-cols-tablet has-4-cols-desktop">
        <div class="grid resources-grid is-gap-2">
          <a
            v-for="res in resources"
            :key="res.title"
            :href="res.href"
            target="_blank"
            rel="noopener noreferrer"
            class="cell box res-card is-flex is-flex-direction-column is-gap-2 p-5"
          >
            <span class="res-icon icon is-medium has-text-secondary">
              <component :is="res.icon" v-if="res.svg" />
              <FontAwesomeIcon v-else :icon="res.icon" />
            </span>
            <span
              class="res-body is-flex is-flex-direction-column is-gap-0.5 is-flex-grow-1"
            >
              <span class="title is-6 mb-0">{{ res.title }}</span>
              <span class="is-size-7 has-text-grey">{{ res.desc }}</span>
            </span>
            <span class="res-meta is-size-7 is-family-monospace has-text-grey pt-3">{{ res.meta }}</span>
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faKey, faBookOpen, faCube } from "@fortawesome/free-solid-svg-icons";
import ApiKeys from "~/components/Account/ApiKeys.vue";
import OAuthApps from "~/components/Account/OAuthApps.vue";
import { isChatModel } from "~/composables/useLlmGateway";
import GithubIcon from "@/assets/img/icons/github.svg?component";
import DiscordIcon from "@/assets/img/icons/discord.svg?component";
import ArrowRightIcon from "@/assets/img/icons/arrow-right.svg?component";

const { isAuthenticated } = useSuperTokens();
const showSettingsModal = ref(false);
const route = useRoute();
const router = useRouter();

const { inferenceBase, models, loadingModels } = useLlmGateway();

const tabs = [
  { id: "keys", label: "API keys" },
  { id: "playground", label: "Playground" },
  { id: "apps", label: "Connected apps" },
];

const validTabs = tabs.map((tab) => tab.id);
const activeTab = ref(
  validTabs.includes(route.query.tab as string) ? (route.query.tab as string) : "keys",
);
const playgroundModel = ref<string | null>((route.query.model as string) ?? null);

// Keep the tab and model in the URL so a playground link can be shared.
watch([activeTab, playgroundModel], ([tab, model]) => {
  router.replace({
    query: { ...route.query, tab, ...(model ? { model } : {}) },
  });
});

const tabBar = ref<HTMLElement | null>(null);

// On a phone the hero fills the screen, so switching tabs from it changes something the
// reader cannot see. Bring the panel into view when it is not already near the top.
const openPlayground = async () => {
  activeTab.value = "playground";
  await nextTick();
  const el = tabBar.value;
  if (!el) return;
  const { top } = el.getBoundingClientRect();
  if (top >= 0 && top < window.innerHeight * 0.5) return;
  el.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
};

const shortBase = computed(() => inferenceBase.replace(/^https?:\/\//, ""));

const resources = [
  {
    title: "Documentation",
    desc: "Guides, tutorials, and how the network works.",
    meta: "learn.nosana.com",
    href: "https://learn.nosana.com/",
    icon: faBookOpen,
    svg: false,
  },
  {
    title: "SDK",
    desc: "The TypeScript kit for jobs, markets, and runs.",
    meta: "@nosana/kit",
    href: "https://www.npmjs.com/package/@nosana/kit",
    icon: faCube,
    svg: false,
  },
  {
    title: "GitHub",
    desc: "Read the source, open issues, and contribute.",
    meta: "github.com/nosana-ci",
    href: "https://nosana.com/github",
    icon: GithubIcon,
    svg: true,
  },
  {
    title: "Community",
    desc: "Get help and talk to the team on Discord.",
    meta: "nosana.com/discord",
    href: "https://nosana.com/discord",
    icon: DiscordIcon,
    svg: true,
  },
];
</script>

<style scoped lang="scss">
/* ---------- Hero ---------- */
/* A dark banner on a light page, so it sets its own surface rather than using
   `.box`; everything inside it uses Bulma classes. */
.hero-banner {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 3rem;
  background: radial-gradient(
      circle at 88% 12%,
      rgba($secondary, 0.16),
      transparent 42%
    ),
    linear-gradient(135deg, #0a0c0a 0%, #0f130d 55%, #0b0d0b 100%);
  border: 1px solid rgba($white, 0.07);
  box-shadow: 0 24px 60px -28px rgba(0, 0, 0, 0.6);
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba($white, 0.05) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: linear-gradient(to bottom, black, transparent 85%);
  pointer-events: none;
}

/* keep the hero columns above the dotted texture */
.columns {
  position: relative;
}

/* The banner stays dark in both themes, so its text is pinned light. Bulma's
   has-text-white resolves through the theme's lightness variables, which the
   dark theme inverts — it renders dark here, which is the opposite of the ask. */
.hero-banner .title,
.hero-banner .pane-title {
  color: $white;
}

.pane-title {
  font-weight: $weight-semibold;
}

/* Bulma's subtitle colour is meant for the page canvas, not this banner. */
.hero-sub {
  max-width: 30rem;
  color: $grey-lighter;

  em {
    color: $white;
    font-style: normal;
    font-weight: $weight-semibold;
  }
}

.btn-arrow {
  width: 15px;
  height: 15px;
  :deep(path) {
    fill: currentColor;
  }
}

/* ---------- One key, two ways ---------- */
.bridge {
  border-radius: 14px;
  background: rgba(6, 8, 6, 0.6);
  border: 1px solid rgba($white, 0.09);
  box-shadow: 0 20px 50px -20px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  padding: 1.1rem;
}

.bridge-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

/* The two rails make the "one key feeds both" point without a caption. */
.bridge-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 18px;
  margin: 0.2rem 0 0.6rem;
}

.bridge-line {
  border-top: 1px solid rgba($secondary, 0.3);
  border-right: 1px solid rgba($secondary, 0.3);
  margin-top: 8px;

  &:last-child {
    border-right: none;
    border-left: 1px solid rgba($secondary, 0.3);
  }
}

.bridge-panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.bridge-pane {
  border-radius: 10px;
  border: 1px solid rgba($white, 0.08);
  background: rgba($white, 0.02);
  padding: 0.75rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Smaller than any Bulma size step, to fit two panes side by side. */
.pane-code {
  margin: 0;
  padding: 0;
  background: transparent;
  font-size: 0.66rem;
  line-height: 1.5;
  color: $grey-lighter;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  flex-grow: 1;
}

.tok-key {
  color: #9aa7f0;
}
.tok-str {
  color: #8bf58f;
}
.tok-fn {
  color: #7fd7e6;
}

/* ---------- Resource cards ---------- */
.resources-grid > .res-card {
  margin-bottom: 0;
}

.res-card {
  transition:
    transform 0.15s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: $secondary;
    box-shadow: 0 14px 30px -18px rgba($secondary, 0.5);
  }
}

/* Bulma's `.icon` sizes the glyph; the tinted tile behind it is ours. */
.res-icon {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: rgba($secondary, 0.1);

  :deep(svg) {
    width: 20px;
    height: 20px;
  }
  :deep(path) {
    fill: $secondary;
  }
}

.res-meta {
  border-top: 1px solid $border;
}

.dark-mode .res-meta {
  border-top-color: rgba($white, 0.08);
}

/* ---------- Responsive (values Bulma helpers can't express) ---------- */
@media screen and (max-width: 768px) {
  .bridge-panes {
    grid-template-columns: 1fr;
  }
  .bridge-split {
    display: none;
  }
}

@media screen and (max-width: 600px) {
  .hero-banner {
    padding: 2rem 1.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .res-card:hover {
    transform: none;
  }
}
</style>
