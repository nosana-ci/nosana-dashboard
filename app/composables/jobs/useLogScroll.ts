import { ref, watch, nextTick, onMounted, onUnmounted, type Ref } from 'vue';
import type { Virtualizer } from '@tanstack/vue-virtual';
import type { UnifiedLogEntry } from './logCollectorTypes';

interface UseLogScrollDeps {
  entries: Ref<UnifiedLogEntry[]>;
  outerRef: Ref<HTMLElement | null>;
  virtualizer: Ref<Virtualizer<HTMLElement, Element>>;
  allLogsLoaded: Ref<boolean>;
  loadingOlderLogs: Ref<boolean>;
  onScrolledNearTop: () => void;
}

export function useLogScroll(deps: UseLogScrollDeps) {
  const shouldAutoScroll = ref(true);

  let initialSettled = false;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let prevEntryCount = 0;
  let anchorEntryId: number | null = null;

  function scrollToBottom() {
    if (!deps.outerRef.value) return;
    deps.virtualizer.value.scrollToIndex(deps.entries.value.length - 1, { align: 'end' });
  }

  function captureAnchor() {
    const items = deps.virtualizer.value.getVirtualItems();
    anchorEntryId = items.length > 0 ? deps.entries.value[items[0]!.index]?.id ?? null : null;
    prevEntryCount = deps.entries.value.length;
  }

  function restoreAnchor() {
    if (anchorEntryId === null) return;
    const idx = deps.entries.value.findIndex((e) => e.id === anchorEntryId);
    if (idx >= 0) {
      deps.virtualizer.value.scrollToIndex(idx, { align: 'start' });
    }
  }

  function checkNeedMoreLogs() {
    if (deps.allLogsLoaded.value || deps.loadingOlderLogs.value) return;
    const container = deps.outerRef.value;
    if (!container) return;
    if (container.scrollHeight <= container.clientHeight && deps.entries.value.length > 0) {
      deps.onScrolledNearTop();
    }
  }

  function handleScroll() {
    if (!deps.outerRef.value) return;
    const { scrollTop, scrollHeight, clientHeight } = deps.outerRef.value;
    shouldAutoScroll.value = scrollHeight - (scrollTop + clientHeight) < 60;

    if (scrollTop < 100 && deps.entries.value.length > 0
      && !deps.allLogsLoaded.value && !deps.loadingOlderLogs.value) {
      deps.onScrolledNearTop();
    }
  }

  watch(
    () => deps.entries.value.length,
    () => {
      if (!initialSettled) {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          initialSettled = true;
          nextTick(() => {
            scrollToBottom();
            captureAnchor();
          });
        }, 800);
        nextTick(() => {
          scrollToBottom();
          prevEntryCount = deps.entries.value.length;
        });
        return;
      }

      if (shouldAutoScroll.value) {
        nextTick(() => {
          scrollToBottom();
          captureAnchor();
          checkNeedMoreLogs();
        });
      } else if (deps.entries.value.length > prevEntryCount) {
        nextTick(() => {
          restoreAnchor();
          captureAnchor();
          checkNeedMoreLogs();
        });
      } else {
        nextTick(() => {
          captureAnchor();
          checkNeedMoreLogs();
        });
      }
    },
  );

  onMounted(() => {
    if (deps.entries.value.length > 0) {
      nextTick(() => {
        scrollToBottom();
        captureAnchor();
      });
    }
  });

  onUnmounted(() => clearTimeout(settleTimer));

  return { handleScroll, scrollToBottom };
}
