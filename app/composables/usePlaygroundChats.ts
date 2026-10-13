import { computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { ModelUIMessage } from "~/utils/modelTransport";

export type PlaygroundChat = {
  id: string;
  /** Taken from the first message once there is one. */
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ModelUIMessage[];
  /** The chat this one was branched from, if any. */
  parentId?: string;
};

const TITLE_LENGTH = 48;

const newId = () => Math.random().toString(36).slice(2, 10);

const make = (messages: ModelUIMessage[] = []): PlaygroundChat => {
  const now = Date.now();
  return { id: newId(), title: titleOf(messages), createdAt: now, updatedAt: now, messages };
};

/** The first thing the reader asked, cut to fit a menu. */
export function titleOf(messages: ModelUIMessage[]): string {
  const first = messages.find((message) => message.role === "user");
  const text = first?.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  return text.length > TITLE_LENGTH ? `${text.slice(0, TITLE_LENGTH - 1)}…` : text;
}

/**
 * The reader's conversations, kept in this browser. One is current; the chat edits
 * its messages and saves them back here.
 */
export const usePlaygroundChats = () => {
  const chats = useLocalStorage<PlaygroundChat[]>("playground-ui-chats", []);
  const currentId = useLocalStorage("playground-ui-chat", "");

  // The single conversation from before there were several becomes the first chat.
  if (import.meta.client && chats.value.length === 0) {
    try {
      const raw = localStorage.getItem("playground-ui-history");
      const old: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(old) && old.length) {
        chats.value = [make(old as ModelUIMessage[])];
        currentId.value = chats.value[0]!.id;
      }
      localStorage.removeItem("playground-ui-history");
    } catch {
      // Unreadable storage is nothing to migrate.
    }
  }

  const current = computed(
    () => chats.value.find((chat) => chat.id === currentId.value) ?? null,
  );
  const recent = computed(() =>
    [...chats.value].sort((a, b) => b.updatedAt - a.updatedAt),
  );

  /** A fresh chat, unless the current one is still empty, which serves as well. */
  function create(): PlaygroundChat {
    if (current.value && current.value.messages.length === 0) return current.value;
    const chat = make();
    chats.value = [chat, ...chats.value];
    currentId.value = chat.id;
    return chat;
  }

  /** A copy of a chat up to a point, to carry on differently from there. */
  function branch(
    fromId: string,
    messages: ModelUIMessage[],
    title: string,
  ): PlaygroundChat {
    const chat = { ...make(messages), title, parentId: fromId };
    chats.value = [chat, ...chats.value];
    currentId.value = chat.id;
    return chat;
  }

  function open(id: string) {
    if (chats.value.some((chat) => chat.id === id)) currentId.value = id;
  }

  function remove(id: string) {
    chats.value = chats.value.filter((chat) => chat.id !== id);
    if (currentId.value === id) currentId.value = recent.value[0]?.id ?? "";
  }

  function rename(id: string, title: string) {
    const chat = chats.value.find((entry) => entry.id === id);
    if (chat) chat.title = title.trim() || chat.title;
  }

  /** Writes the chat's messages back; the first message names it. */
  function save(messages: ModelUIMessage[]) {
    const chat = current.value ?? create();
    const grew = messages.length !== chat.messages.length;
    chat.messages = messages;
    if (!chat.title) chat.title = titleOf(messages);
    if (grew && messages.length) chat.updatedAt = Date.now();
  }

  return {
    chats,
    recent,
    current,
    currentId,
    create,
    branch,
    open,
    remove,
    rename,
    save,
  };
};
