import { ref, watch, nextTick, onMounted, onUnmounted, type Ref } from 'vue';
import type { Virtualizer } from '@tanstack/vue-virtual';
import type { UnifiedLogEntry } from './logCollectorTypes';
import { indexOfEntry } from './logEntryUtils';

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
  /**
   * The row at the top of the viewport and how far the viewport has scrolled
   * into it. Both are needed: keeping only the row would snap it flush to the
   * top on every restore, which reads as a jump of up to one row.
   */
  let anchor: { entry: UnifiedLogEntry; offsetIntoRow: number } | null = null;

  function scrollToBottom() {
    if (!deps.outerRef.value) return;
    deps.virtualizer.value.scrollToIndex(deps.entries.value.length - 1, { align: 'end' });
  }

  function captureAnchor() {
    const container = deps.outerRef.value;
    const [first] = deps.virtualizer.value.getVirtualItems();
    const entry = first ? deps.entries.value[first.index] : undefined;

    anchor =
      first && entry && container
        ? { entry, offsetIntoRow: container.scrollTop - first.start }
        : null;
  }

  /**
   * Logs arriving below the viewport move nothing that is on screen, so the
   * scroll position is left exactly where it is and only the scrollbar changes.
   * Anything landing above shifts the anchor down, and the viewport follows by
   * the same amount so the same lines stay under the reader's eye.
   */
  function restoreAnchor() {
    const container = deps.outerRef.value;
    if (!anchor || !container) return;

    const index = indexOfEntry(deps.entries.value, anchor.entry);
    const start = deps.virtualizer.value.getOffsetForIndex(index, 'start')?.[0];
    if (start === undefined) return;

    const target = start + anchor.offsetIntoRow;
    if (Math.abs(container.scrollTop - target) > 1) container.scrollTop = target;
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

        nextTick(() => scrollToBottom());
        return;
      }

      nextTick(() => {
        // Reading along at the bottom means following the newest line; anywhere
        // above it means staying put. Entries are removed as well as added — a
        // completed job's logs are refetched and replace what was streamed —
        // and a removal above the viewport shifts it just as an insert does, so
        // the anchor is restored whichever way the count went.
        if (shouldAutoScroll.value) scrollToBottom();
        else restoreAnchor();

        captureAnchor();
        checkNeedMoreLogs();
      });
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
