// NOTE: useLogScroll is a TypeScript module, so these tests need a TS-aware
// runner to execute, e.g. `node --import tsx --test tests/logScroll.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ref, nextTick, effectScope } from 'vue';

import { useLogScroll } from '../app/composables/jobs/useLogScroll';
import { insertSorted, makeEntry } from '../app/composables/jobs/logEntryUtils';

const ROW = 20;
const VIEWPORT = 100;
/** Past the settle gate the view stops being pulled to the bottom. */
const SETTLED = 800;

let nextId = 0;
const entry = (timestamp) =>
  makeEntry(++nextId, 'job', 'op', 'container', timestamp, `line ${timestamp}`);

const rows = (count, from = 1) =>
  Array.from({ length: count }, (_, i) => entry((from + i) * 10));

/**
 * The composable's whole view of the DOM is the container it scrolls and the
 * virtualiser it asks about rows, so both are stood up here: fixed-height rows
 * at `index * ROW`, and a viewport that shows whatever that puts on screen.
 */
function harness(initial) {
  const entries = ref(initial);
  const container = {
    scrollTop: 0,
    clientHeight: VIEWPORT,
    get scrollHeight() {
      return entries.value.length * ROW;
    },
  };

  const virtualizer = ref({
    getVirtualItems() {
      const first = Math.max(0, Math.floor(container.scrollTop / ROW));
      const last = Math.min(
        entries.value.length - 1,
        Math.floor((container.scrollTop + VIEWPORT) / ROW),
      );
      const items = [];
      for (let i = first; i <= last; i++) {
        items.push({ index: i, start: i * ROW, size: ROW, key: entries.value[i]?.id });
      }
      return items;
    },
    getOffsetForIndex: (index) => [index * ROW, 'start'],
    scrollToIndex: (index, { align } = {}) => {
      container.scrollTop =
        align === 'end'
          ? Math.max(0, (index + 1) * ROW - VIEWPORT)
          : index * ROW;
    },
  });

  const scope = effectScope();
  let api;
  const warn = console.warn;
  console.warn = () => {}; // onMounted outside a component
  scope.run(() => {
    api = useLogScroll({
      entries,
      outerRef: ref(container),
      virtualizer,
      allLogsLoaded: ref(true),
      loadingOlderLogs: ref(false),
      onScrolledNearTop: () => {},
    });
  });
  console.warn = warn;

  return { entries, container, ...api };
}

/** The watcher runs pre-flush, and its body defers the scroll to nextTick. */
const flush = async () => {
  await nextTick();
  await nextTick();
};

/** Scroll the way a reader does: move the bar, then let the handler see it. */
function scrollTo(h, scrollTop) {
  h.container.scrollTop = scrollTop;
  h.handleScroll();
}

async function arrive(h, batch) {
  h.entries.value = insertSorted(h.entries.value, batch);
  await flush();
}

async function settled(t, initial) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness(initial);
  await arrive(h, [entry(5)]);
  t.mock.timers.tick(SETTLED);
  await flush();
  return h;
}

test('holds the position when logs arrive below the fold', async (t) => {
  const h = await settled(t, rows(100));
  scrollTo(h, 510);

  await arrive(h, rows(20, 200));

  assert.equal(h.container.scrollTop, 510);
});

test('holds the position across a scroll followed by new logs', async (t) => {
  const h = await settled(t, rows(100));
  scrollTo(h, 900);
  await arrive(h, rows(5, 300));

  // The reader moves again before the next batch lands.
  scrollTo(h, 420);
  await arrive(h, rows(5, 400));

  assert.equal(h.container.scrollTop, 420);
});

test('keeps the same lines on screen when older logs land above', async (t) => {
  const h = await settled(t, rows(100, 100));
  scrollTo(h, 510);
  const onScreen = h.entries.value[25];

  // Ten older lines sort in ahead of everything held.
  await arrive(h, rows(10, 1));

  assert.equal(h.container.scrollTop, 510 + 10 * ROW);
  assert.equal(h.entries.value[35], onScreen);
});

test('follows the newest line while the reader is at the bottom', async (t) => {
  const h = await settled(t, rows(100));
  scrollTo(h, 100 * ROW - VIEWPORT);

  await arrive(h, rows(10, 200));

  assert.equal(h.container.scrollTop, 111 * ROW - VIEWPORT);
});
