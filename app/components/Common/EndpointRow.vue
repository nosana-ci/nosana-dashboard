<template>
  <div
    class="ep-row"
    :class="{ 'is-off': status === 'inactive' }"
    role="button"
    tabindex="0"
    :title="reachable ? 'Open endpoint in a new tab' : 'Copy URL'"
    @click="onRowClick"
    @keydown.enter.prevent="onRowClick"
    @keydown.space.prevent="onRowClick"
  >
    <StatusMark
      :tone="tone"
      :pulse="status === 'online'"
      :label="statusLabel"
    />
    <div class="ep-main">
      <div class="ep-top">
        <span class="ep-name">{{ name }}</span>
        <span class="port-chip">:{{ port }}</span>
        <span v-if="chat" class="llm-chip" title="Serves a chat model"
          >LLM</span
        >
      </div>
      <a
        v-if="reachable"
        :href="url"
        target="_blank"
        rel="noopener"
        class="ep-url is-link"
        @click.stop
        >{{ url }}</a
      >
      <span v-else class="ep-url struck">{{ url }}</span>
    </div>
    <div class="ep-acts">
      <button
        v-if="chat && status === 'online'"
        type="button"
        class="ep-icobtn"
        title="Chat with this model"
        aria-label="Chat with this model"
        @click.stop="emit('chat')"
        @keydown.enter.stop
        @keydown.space.stop
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          />
        </svg>
      </button>
      <button
        type="button"
        class="ep-icobtn"
        title="Copy URL"
        @click.stop="copyUrl"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
      <a
        v-if="reachable"
        :href="url"
        target="_blank"
        rel="noopener"
        class="ep-icobtn"
        title="Open in new tab"
        @click.stop
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <path d="M15 3h6v6M10 14 21 3" />
        </svg>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "vue-toastification";
import StatusMark from "~/components/Common/StatusMark.vue";
import type { StatusTone } from "~/composables/useStatus";

/** One exposed port: status mark, name, port chip, URL, copy and open. */
export type EndpointStatus = "online" | "starting" | "inactive";

const TONES: Record<EndpointStatus, StatusTone> = {
  online: "live",
  starting: "warn",
  inactive: "neutral",
};

const props = defineProps<{
  name: string;
  port: number | string;
  url: string;
  status: EndpointStatus;
  /** Serves a chat model: shows the LLM chip and a Chat button. */
  chat?: boolean;
}>();
const emit = defineEmits<{ chat: [] }>();

const statusLabel = computed(
  () => props.status.charAt(0).toUpperCase() + props.status.slice(1),
);

const tone = computed(() => TONES[props.status]);

// A starting endpoint's URL is worth offering even though the node's proxy may
// not answer yet: waiting for it is the normal thing to do, and the orange mark
// already says it is not up. Only a stopped one has nothing behind it.
const reachable = computed(() => props.status !== "inactive");

const toast = useToast();

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(props.url);
    toast.success("Copied endpoint URL");
  } catch {
    toast.error("Copy blocked by the browser");
  }
};

// The whole bar is clickable: open the endpoint when there is something to
// open, otherwise copy the URL (a dead endpoint is still worth copying).
const onRowClick = () => {
  if (reachable.value) {
    window.open(props.url, "_blank", "noopener");
  } else {
    copyUrl();
  }
};
</script>

<style lang="scss" scoped>
@use "sass:color";

.ep-row {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 13px 16px;
  cursor: pointer;
  transition: background 0.12s ease;

  & + & {
    border-top: 1px solid $border-soft;
  }

  &:hover {
    background: $surface-hover;
  }

  &:focus-visible {
    outline: 2px solid $secondary;
    outline-offset: -2px;
  }

  &.is-off {
    opacity: 0.55;
  }
}

.ep-main {
  flex: 1;
  min-width: 0;
}

.ep-top {
  display: flex;
  align-items: center;
  gap: 9px;
}

.ep-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: $text;
}

.port-chip {
  font-family: $family-monospace;
  font-size: 0.72rem;
  color: $grey-dark;
  background: $white-ter;
  padding: 2px 9px;
  border-radius: 999px;
}

.ep-url {
  display: block;
  font-family: $family-monospace;
  font-size: 0.78rem;
  color: $text-muted;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

a.ep-url:hover {
  color: $secondary;
}

.ep-url.struck {
  text-decoration: line-through;
}

.ep-acts {
  display: inline-flex;
  gap: 3px;
  flex: none;
}

.llm-chip {
  font-family: $title-family;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: color.adjust($secondary, $lightness: -18%);
  background: rgba($secondary, 0.12);
  padding: 2px 8px;
  border-radius: 999px;
}

.ep-icobtn {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 0;
  background: transparent;
  color: $text-muted;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover {
    background: $surface-hover;
    color: $secondary;
  }
}

html.dark-mode {
  .ep-row {
    & + & {
      border-top-color: rgba($white, 0.08);
    }

    &:hover {
      background: rgba($white, 0.04);
    }
  }

  .ep-name {
    color: $white;
  }

  .port-chip {
    background: rgba($white, 0.08);
    color: $grey-light;
  }

  .llm-chip {
    color: $secondary;
  }

  .ep-icobtn:hover {
    background: rgba($white, 0.08);
  }
}

@media screen and (max-width: 768px) {
  .ep-url {
    font-size: 0.72rem;
  }
}
</style>
