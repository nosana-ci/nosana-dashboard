<template>
  <aside class="pg-side">
    <div class="pg-side-top">
      <span class="pg-side-heading">Chats</span>
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
            <form v-if="editingId === chat.id" class="pg-row-edit" @submit.prevent="commit(chat.id)">
              <UInput
                v-model="draft"
                size="xs"
                autofocus
                class="w-full"
                @blur="commit(chat.id)"
                @keydown.escape="editingId = null"
              />
            </form>
            <button
              v-else
              type="button"
              class="pg-row-open pg-plain"
              :title="chat.title || 'New chat'"
              @click="emit('open', chat.id)"
              @dblclick="edit(chat)"
            >
              <span class="pg-row-title">{{ chat.title || "New chat" }}</span>
            </button>
            <span v-if="editingId !== chat.id" class="pg-row-acts">
              <UTooltip text="Rename chat">
                <UButton
                  icon="i-lucide-pencil"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  aria-label="Rename chat"
                  @click.stop="edit(chat)"
                />
              </UTooltip>
              <UTooltip text="Delete chat">
                <UButton
                  icon="i-lucide-trash-2"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  aria-label="Delete chat"
                  @click.stop="emit('remove', chat.id)"
                />
              </UTooltip>
            </span>
          </li>
        </ul>
      </template>
      <p v-if="!chats.length" class="pg-side-empty">
        Your chats are kept in this browser and show up here.
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { PlaygroundChat } from "~/composables/usePlaygroundChats";

const props = defineProps<{
  /** Most recent first. */
  chats: PlaygroundChat[];
  currentId: string;
}>();


const emit = defineEmits<{
  open: [id: string];
  rename: [id: string, title: string];
  remove: [id: string];
}>();

// The chat whose name is being edited in place, and the name typed so far.
const editingId = ref<string | null>(null);
const draft = ref("");

function edit(chat: PlaygroundChat) {
  editingId.value = chat.id;
  draft.value = chat.title;
}

function commit(id: string) {
  if (editingId.value !== id) return;
  emit("rename", id, draft.value);
  editingId.value = null;
}

const DAY = 86_400_000;


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

// "Chats" on the left, the new-chat button on the right.
.pg-side-heading {
  flex: 1;
  padding-left: 0.5rem;
  font-weight: 600;
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

  .pg-row-acts {
    display: flex;
    position: absolute;
    top: 50%;
    right: 0.3rem;
    transform: translateY(-50%);
    opacity: 0;
  }

  &:hover .pg-row-acts,
  &:focus-within .pg-row-acts {
    opacity: 1;
  }

  &:hover .pg-row-open,
  &:focus-within .pg-row-open {
    padding-right: 3.8rem;
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

.pg-row-edit {
  flex: 1;
  min-width: 0;
  padding: 2px 4px;
}

.pg-side-empty {
  margin: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: var(--ui-text-muted);
}
</style>
