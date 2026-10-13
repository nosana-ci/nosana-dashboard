import { ref, type Ref } from "vue";
import { useLocalStorage } from "@vueuse/core";

let hidden: Ref<boolean> | null = null;

/**
 * Whether the dashboard's navigation is hidden on the playground page, so the
 * workspace has the whole window. The chat list carries the toggle; the layout
 * reads the result. One ref, shared, remembered in this browser.
 */
export const usePlaygroundNav = (): Ref<boolean> => {
  if (import.meta.server) return ref(false);
  hidden ??= useLocalStorage("playground-nav-hidden", false);
  return hidden;
};
