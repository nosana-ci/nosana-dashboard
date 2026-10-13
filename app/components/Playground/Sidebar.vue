<template>
  <aside class="pg-side">
    <div class="pg-side-top">
      <UTooltip :text="navHidden ? 'Show navigation' : 'Hide navigation'">
        <UButton
          :icon="navHidden ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
          color="neutral"
          variant="ghost"
          size="sm"
          class="pg-nav-toggle"
          :aria-pressed="navHidden"
          aria-label="Toggle navigation"
          @click="navHidden = !navHidden"
        />
      </UTooltip>
      <button type="button" class="pg-search pg-plain" @click="emit('search')">
        <UIcon name="i-lucide-search" class="pg-search-icon" />
        <span class="pg-search-label">Search</span>
        <span class="pg-kbds">
          <UKbd value="meta" size="sm" /><UKbd value="k" size="sm" />
        </span>
      </button>
      <UTooltip text="New chat" :kbds="['meta', 'shift', 'o']">
        <UButton
          icon="i-lucide-square-pen"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="New chat"
          @click="emit('create')"
        />
      </UTooltip>
    </div>

    <div class="pg-side-scroll">
      <template v-for="group in groups" :key="group.label">
        <p class="pg-side-label">{{ group.label }}</p>
        <ul class="pg-side-list">
          <li
            v-for="chat in group.chats"
            :key="chat.id"
            class="pg-row"
            :class="{ 'is-active': chat.id === currentId }"
          >
            <button
              type="button"
              class="pg-row-open pg-plain"
              :title="branchNote(chat) ?? chat.title ?? 'New chat'"
              @click="emit('open', chat.id)"
            >
              <UIcon
                v-if="chat.parentId"
                name="i-lucide-git-branch"
                class="pg-row-icon"
              />
              <span class="pg-row-title">{{ chat.title || "New chat" }}</span>
            </button>
            <UTooltip text="Delete chat">
              <UButton
                icon="i-lucide-trash-2"
                color="neutral"
                variant="ghost"
                size="xs"
                class="pg-row-del"
                aria-label="Delete chat"
                @click.stop="emit('remove', chat.id)"
              />
            </UTooltip>
          </li>
        </ul>
      </template>
      <p v-if="!chats.length" class="pg-side-empty">
        Your chats are kept in this browser and show up here.
      </p>

      <p class="pg-side-label">Prompts</p>
      <ul class="pg-side-list">
        <li v-for="prompt in prompts" :key="prompt.label" class="pg-row">
          <button
            type="button"
            class="pg-row-open pg-plain"
            :title="prompt.text"
            @click="emit('prompt', prompt.text)"
          >
            <UIcon name="i-lucide-sparkles" class="pg-row-icon" />
            <span class="pg-row-title">{{ prompt.label }}</span>
          </button>
        </li>
      </ul>
    </div>

    <footer class="pg-side-foot">
      <UKbd value="escape" size="sm" /> stops a reply ·
      <UKbd value="enter" size="sm" /> sends
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PlaygroundChat } from "~/composables/usePlaygroundChats";

const props = defineProps<{
  /** Most recent first. */
  chats: PlaygroundChat[];
  currentId: string;
  prompts: { label: string; text: string }[];
}>();

// Hides the dashboard's navigation so the workspace takes the window.
const navHidden = usePlaygroundNav();

const emit = defineEmits<{
  open: [id: string];
  create: [];
  remove: [id: string];
  prompt: [text: string];
  search: [];
}>();

const DAY = 86_400_000;

/** "Branched from …", for the row's tooltip. */
function branchNote(chat: PlaygroundChat): string | null {
  if (!chat.parentId) return null;
  const parent = props.chats.find((entry) => entry.id === chat.parentId);
  return `Branched from “${parent?.title || "a deleted chat"}”`;
}


/** Chats by when they were last touched, newest group first. */
const groups = computed(() => {
  const now = Date.now();
  const start = new Date(now).setHours(0, 0, 0, 0);
  const buckets: { label: string; chats: PlaygroundChat[] }[] = [
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "Previous 7 days", chats: [] },
    { label: "Older", chats: [] },
  ];
  for (const chat of props.chats) {
    const age = start - chat.updatedAt;
    const index = age < 0 ? 0 : age < DAY ? 1 : age < 7 * DAY ? 2 : 3;
    buckets[index]!.chats.push(chat);
  }
  return buckets.filter((bucket) => bucket.chats.length);
});
</script>

<style scoped lang="scss">
.pg-side {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.pg-side-top {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  height: var(--pg-toolbar);
  padding: 0 0.5rem;
  border-bottom: 1px solid var(--ui-border);
}

.pg-nav-toggle {
  display: none;
}

@media screen and (min-width: 1024px) {
  .pg-nav-toggle {
    display: inline-flex;
  }
}

// The search field the window opens with; it runs the palette.
.pg-search {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  height: 30px;
  padding: 0 0.5rem 0 0.6rem;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: var(--ui-bg);
  color: var(--ui-text-dimmed);
  font: inherit;
  font-size: 0.85rem;
  cursor: text;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: var(--ui-border-accented);
  }
}

.pg-search-icon {
  width: 14px;
  height: 14px;
}

.pg-search-label {
  flex: 1;
  text-align: left;
}

.pg-kbds {
  display: inline-flex;
  gap: 2px;
  opacity: 0.8;
}

.pg-side-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.25rem 0.6rem 1rem;
}

.pg-side-label {
  margin: 1.35rem 0.75rem 0.45rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.pg-side-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1px;
}

// One quiet line per chat; the delete shows on hover at the end of it.
.pg-row {
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: background-color 0.12s ease;

  &:hover {
    background: var(--pg-pane-hover);
  }

  &.is-active {
    background: var(--ui-bg-accented);
  }

  &.is-active .pg-row-title {
    color: var(--ui-text-highlighted);
  }

  .pg-row-del {
    position: absolute;
    top: 50%;
    right: 0.3rem;
    transform: translateY(-50%);
    opacity: 0;
  }

  &:hover .pg-row-del,
  &:focus-within .pg-row-del {
    opacity: 1;
  }

  &:hover .pg-row-open,
  &:focus-within .pg-row-open {
    padding-right: 2.1rem;
  }
}

.pg-row-open {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 0;
  background: none;
  color: var(--ui-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.pg-row-icon {
  flex: none;
  width: 14px;
  height: 14px;
  color: var(--ui-text-dimmed);
}

.pg-row-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--ui-text);
}

.pg-side-empty {
  margin: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: var(--ui-text-muted);
}

.pg-side-foot {
  flex: none;
  padding: 0.7rem 1rem;
  font-size: 0.72rem;
  color: var(--ui-text-dimmed);
}
</style>
