// NOTE: logEntryUtils is a TypeScript module, so these tests need a TS-aware
// runner to execute, e.g. `node --import tsx --test tests/logEntryMerge.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';

import { insertSorted, makeEntry } from '../app/composables/jobs/logEntryUtils';

const entry = (id, timestamp) =>
  makeEntry(id, 'job', 'op', 'container', timestamp, `line ${id}`);

const ids = (entries) => entries.map((e) => e.id);

test('appends a batch that is newer than everything held', () => {
  const held = [entry(1, 10), entry(2, 20)];

  assert.deepEqual(ids(insertSorted(held, [entry(3, 30), entry(4, 40)])), [1, 2, 3, 4]);
});

test('merges a batch that straddles what is already held', () => {
  const held = [entry(1, 10), entry(3, 30), entry(5, 50)];

  assert.deepEqual(
    ids(insertSorted(held, [entry(4, 40), entry(2, 20), entry(6, 60)])),
    [1, 2, 3, 4, 5, 6],
  );
});

test('orders a batch bigger than the old sort threshold', () => {
  const batch = Array.from({ length: 250 }, (_, i) => entry(250 - i, 250 - i));

  const merged = insertSorted([], batch);

  assert.equal(merged.length, 250);
  assert.deepEqual(ids(merged), ids(batch.slice().reverse()));
});

test('breaks ties on id so equal timestamps keep their arrival order', () => {
  const held = [entry(1, 10)];

  assert.deepEqual(ids(insertSorted(held, [entry(3, 10), entry(2, 10)])), [1, 2, 3]);
});

test('leaves the held list untouched when the batch is empty', () => {
  const held = [entry(1, 10)];

  assert.equal(insertSorted(held, []), held);
});

test('sorts entries without a timestamp ahead of stamped ones', () => {
  const held = [entry(1, 10), entry(2, 20)];

  assert.deepEqual(ids(insertSorted(held, [entry(3, 0)])), [3, 1, 2]);
});
