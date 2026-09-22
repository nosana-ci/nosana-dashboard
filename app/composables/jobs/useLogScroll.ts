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

/** Quiet needed after the last arrival before the first load counts as done. */
const SETTLE_QUIET_MS = 800;
/** How long that quiet is waited for before the load counts as done anyway. */
const SETTLE_DEADLINE_MS = 5000;

export function useLogScroll(deps: UseLogScrollDeps) {
  const shouldAutoScroll = ref(true);

  let initialSettled = false;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let settleDeadline = 0;
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
        const settle = () => {
          initialSettled = true;
          nextTick(() => {
            scrollToBottom();
            captureAnchor();
          });
        };

        // The initial load counts as done once the arrivals pause, but a job
        // that logs on a timer never pauses. Past the deadline the view stops
        // being pulled to the bottom whether or not that pause ever comes.
        if (settleDeadline === 0) settleDeadline = Date.now() + SETTLE_DEADLINE_MS;
        clearTimeout(settleTimer);
        settleTimer = setTimeout(
          settle,
          Math.max(0, Math.min(SETTLE_QUIET_MS, settleDeadline - Date.now())),
        );

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
