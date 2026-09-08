<template>
  <div
    class="ep-row"
    :class="{ 'is-off': status !== 'online' }"
    role="button"
    tabindex="0"
    :title="status === 'online' ? 'Open endpoint in a new tab' : 'Copy URL'"
    @click="onRowClick"
    @keydown.enter.prevent="onRowClick"
    @keydown.space.prevent="onRowClick"
  >
    <span class="ep-status" :class="status">
      <span class="ep-dot" :title="statusLabel"></span>
    </span>
    <div class="ep-main">
      <div class="ep-top">
        <span class="ep-name">{{ name }}</span>
        <span class="port-chip">:{{ port }}</span>
      </div>
      <a
        v-if="status === 'online'"
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
        v-if="status === 'online'"
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

/** One exposed port: status dot, name, port chip, URL, copy and open. */
export type EndpointStatus = "online" | "starting" | "inactive";

const props = defineProps<{
  name: string;
  port: number | string;
  url: string;
  status: EndpointStatus;
}>();

const statusLabel = computed(
  () => props.status.charAt(0).toUpperCase() + props.status.slice(1),
);

const toast = useToast();

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(props.url);
    toast.success("Copied endpoint URL");
  } catch {
    toast.error("Copy blocked by the browser");
  }
};

// The whole bar is clickable: open the endpoint when it's live, otherwise copy
// the URL (a dead endpoint can't be opened but is still worth copying).
const onRowClick = () => {
  if (props.status === "online") {
    window.open(props.url, "_blank", "noopener");
  } else {
    copyUrl();
  }
};
</script>

<style lang="scss" scoped>
.ep-row {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 13px 16px;
  cursor: pointer;
  transition: background 0.12s ease;

  & + & {
    border-top: 1px solid $grey-lighter;
  }

  &:hover {
    background: $white-bis;
  }

  &:focus-visible {
    outline: 2px solid $secondary;
    outline-offset: -2px;
  }

  &.is-off {
    opacity: 0.55;
  }
}

.ep-status {
  flex: none;
  display: inline-flex;
  align-items: center;
}

.ep-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
  background: $grey-light;
}

.ep-status.online .ep-dot {
  background: $success;
}

.ep-status.starting .ep-dot {
  background: $warning;
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
    background: $white-ter;
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
