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
          <p class="eyebrow mb-4">// developer portal</p>
          <h1 class="hero-title mb-4">Build on the<br />Nosana&nbsp;network.</h1>
          <p class="hero-sub mb-5">
            Ship AI workloads to decentralized GPUs. Grab an API key, drop in
            the SDK, and let people sign in with their Nosana account.
          </p>
          <div class="is-flex is-flex-wrap-wrap is-gap-1.5">
            <a
              href="https://learn.nosana.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-primary"
            >
              <span>Read the docs</span>
              <ArrowRightIcon class="btn-arrow" />
            </a>
            <a
              href="https://www.npmjs.com/package/@nosana/kit"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-ghost"
            >
              Browse the SDK
            </a>
          </div>
        </div>

        <!-- Terminal signature -->
        <div class="column">
          <div class="terminal" aria-hidden="true">
            <div class="terminal-bar is-flex is-align-items-center is-gap-1">
              <span class="dot dot-red"></span>
              <span class="dot dot-amber"></span>
              <span class="dot dot-green"></span>
              <span class="terminal-path ml-2">~/my-app</span>
            </div>
            <pre
              class="terminal-body"
            ><span class="ln"><span class="tok-prompt">$</span> npm install <span class="tok-pkg">@nosana/kit</span></span>
<span class="ln ln-gap"></span>
<span class="ln"><span class="tok-key">import</span> { createNosanaClient } <span class="tok-key">from</span> <span class="tok-str">'@nosana/kit'</span></span>
<span class="ln ln-gap"></span>
<span class="ln"><span class="tok-key">const</span> nosana = <span class="tok-fn">createNosanaClient</span>()</span>
<span class="ln"><span class="tok-key">const</span> job = <span class="tok-key">await</span> nosana.jobs.<span class="tok-fn">get</span>(<span class="tok-str">'job-address'</span>)<span class="caret">▋</span></span></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- Resources -->
    <section class="mb-6">
      <p class="section-eyebrow mb-4">// resources</p>
      <div class="fixed-grid has-1-cols has-2-cols-tablet has-4-cols-desktop">
        <div class="grid is-gap-2">
          <a
            v-for="res in resources"
            :key="res.title"
            :href="res.href"
            target="_blank"
            rel="noopener noreferrer"
            class="cell res-card is-flex is-flex-direction-column is-gap-2 p-5"
          >
            <span class="res-icon">
              <component :is="res.icon" v-if="res.svg" />
              <FontAwesomeIcon v-else :icon="res.icon" />
            </span>
            <span
              class="res-body is-flex is-flex-direction-column is-gap-0.5 is-flex-grow-1"
            >
              <span class="res-title">{{ res.title }}</span>
              <span class="res-desc">{{ res.desc }}</span>
            </span>
            <span class="res-meta pt-3">{{ res.meta }}</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Credentials -->
    <section class="mb-6">
      <p class="section-eyebrow mb-4">// manage</p>

      <template v-if="isAuthenticated">
        <ApiKeys class="mb-6" />
        <!-- Temporarily hidden: Nosana Connected Apps (OAuth apps) section -->
        <!-- <OAuthApps /> -->
      </template>

      <div v-else class="box signin-prompt has-text-centered p-6">
        <span class="icon is-large has-text-grey-light">
          <FontAwesomeIcon :icon="faKey" size="2x" />
        </span>
        <h5 class="title is-5 mt-2 mb-2">Sign in to manage credentials</h5>
        <p class="subtitle is-6 has-text-grey">
          API keys and connected apps are tied to a Nosana account. Log in with
          email or Google to create and manage them.
        </p>
        <nuxt-link to="/account" class="button is-dark">Go to account</nuxt-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faKey, faBookOpen, faCube } from "@fortawesome/free-solid-svg-icons";
import ApiKeys from "~/components/Account/ApiKeys.vue";
import OAuthApps from "~/components/Account/OAuthApps.vue";
import GithubIcon from "@/assets/img/icons/github.svg?component";
import DiscordIcon from "@/assets/img/icons/discord.svg?component";
import ArrowRightIcon from "@/assets/img/icons/arrow-right.svg?component";

const { isAuthenticated } = useSuperTokens();
const showSettingsModal = ref(false);

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
.dev-portal {
  // Monospace utility stack — the developer "voice" of the page.
  --mono: ui-monospace, "SF Mono", "JetBrains Mono", "Cascadia Code", Menlo,
    Consolas, monospace;
}

/* ---------- Hero ---------- */
.hero-banner {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 3rem;
  background: radial-gradient(
      circle at 88% 12%,
      rgba(16, 232, 12, 0.16),
      transparent 42%
    ),
    linear-gradient(135deg, #0a0c0a 0%, #0f130d 55%, #0b0d0b 100%);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 24px 60px -28px rgba(0, 0, 0, 0.6);
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    rgba(255, 255, 255, 0.05) 1px,
    transparent 1px
  );
  background-size: 22px 22px;
  mask-image: linear-gradient(to bottom, black, transparent 85%);
  pointer-events: none;
}

/* keep the hero columns above the dotted texture */
.columns {
  position: relative;
}

.eyebrow {
  font-family: var(--mono);
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  color: $secondary;
}

.hero-title {
  font-family: $title-family;
  font-weight: 600;
  font-size: 2.75rem;
  line-height: 1.05;
  color: #fff;
  letter-spacing: -0.01em;
}

.hero-sub {
  color: #b7c0b6;
  font-size: 1.0625rem;
  line-height: 1.55;
  max-width: 30rem;
}

.btn-primary,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.25rem;
  border-radius: 9px;
  font-weight: 600;
  font-size: 0.95rem;
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.btn-primary {
  background: $secondary;
  color: #05230a;
  box-shadow: 0 8px 24px -8px rgba(16, 232, 12, 0.6);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 28px -8px rgba(16, 232, 12, 0.75);
    color: #05230a;
  }
}

.btn-arrow {
  width: 15px;
  height: 15px;
  :deep(path) {
    fill: currentColor;
  }
}

.btn-ghost {
  color: #e8f0e8;
  border: 1px solid rgba(255, 255, 255, 0.18);

  &:hover {
    border-color: $secondary;
    color: #fff;
    transform: translateY(-1px);
  }
}

/* ---------- Terminal ---------- */
.terminal {
  border-radius: 12px;
  overflow: hidden;
  background: #06080699;
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: 0 20px 50px -20px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
}

.terminal-bar {
  padding: 0.65rem 0.9rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  display: inline-block;
}
.dot-red {
  background: #ff5f56;
}
.dot-amber {
  background: #ffbd2e;
}
.dot-green {
  background: #27c93f;
}

.terminal-path {
  font-family: var(--mono);
  font-size: 0.75rem;
  color: #6f7a6e;
}

.terminal-body {
  margin: 0;
  padding: 1.25rem 1.4rem;
  font-family: var(--mono);
  font-size: 0.82rem;
  line-height: 1.25;
  color: #dfe6de;
  background: transparent;
  overflow-x: auto;
  white-space: pre;
}

.ln {
  display: block;
}
.ln-gap {
  height: 0.4rem;
}

.tok-prompt {
  color: $secondary;
  font-weight: 700;
}
.tok-pkg {
  color: #8bf58f;
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

.caret {
  color: $secondary;
  animation: blink 1.1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* ---------- Section labels ---------- */
.section-eyebrow {
  font-family: var(--mono);
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  color: $grey;
}

/* ---------- Resource cards ---------- */
.res-card {
  border-radius: 14px;
  background: $box-background-color;
  border: 1px solid $border;
  transition:
    transform 0.15s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: $secondary;
    box-shadow: 0 14px 30px -18px rgba(16, 232, 12, 0.5);
  }
}

.res-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: rgba(16, 232, 12, 0.1);
  color: $secondary;

  :deep(svg) {
    width: 20px;
    height: 20px;
  }
  :deep(path) {
    fill: $secondary;
  }
}

.res-title {
  font-family: $title-family;
  font-weight: 600;
  font-size: 1.05rem;
  color: $text;
}

.res-desc {
  font-size: 0.875rem;
  color: $text-light;
  line-height: 1.4;
}

.res-meta {
  font-family: var(--mono);
  font-size: 0.75rem;
  color: $grey;
  border-top: 1px solid $border;
}

/* ---------- Dark mode ---------- */
.dark-mode {
  .res-card {
    background: $black-bis;
    border-color: rgba(255, 255, 255, 0.07);

    &:hover {
      border-color: $secondary;
    }
  }

  .res-title {
    color: $white;
  }

  .res-desc {
    color: $grey-light;
  }

  .res-meta {
    border-top-color: rgba(255, 255, 255, 0.08);
  }
}

/* ---------- Responsive (values Bulma helpers can't express) ---------- */
@media screen and (max-width: 600px) {
  .hero-banner {
    padding: 2rem 1.5rem;
  }
  .hero-title {
    font-size: 2.1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .caret {
    animation: none;
  }
  .btn-primary:hover,
  .btn-ghost:hover,
  .res-card:hover {
    transform: none;
  }
}
</style>
