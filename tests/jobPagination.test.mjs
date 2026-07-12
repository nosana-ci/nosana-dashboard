// NOTE: jobPagination is a TypeScript module, so these tests need a TS-aware
// runner to execute, e.g. `node --import tsx --test tests/jobPagination.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectAllJobs,
  paginate,
  clampPage,
  ACTIVE_JOB_STATES,
  HISTORY_JOB_STATES,
} from '../app/utils/jobPagination';

test('state filters are the comma-separated API values', () => {
  assert.equal(ACTIVE_JOB_STATES, 'QUEUED,RUNNING');
  assert.equal(HISTORY_JOB_STATES, 'COMPLETED,STOPPED');
});

test('clampPage keeps page within [1, total]', () => {
  assert.equal(clampPage(0, 3), 1);
  assert.equal(clampPage(2, 3), 2);
  assert.equal(clampPage(5, 3), 3);
  assert.equal(clampPage(1, 0), 1);
});

test('paginate slices the correct 1-based page', () => {
  const items = [1, 2, 3, 4, 5];
  assert.deepEqual(paginate(items, 1, 2), [1, 2]);
  assert.deepEqual(paginate(items, 2, 2), [3, 4]);
  assert.deepEqual(paginate(items, 3, 2), [5]);
});

test('collectAllJobs returns first-page jobs when there is no next page', async () => {
  const first = { jobs: [{ job: 'a' }, { job: 'b' }], nextPage: null };
  const all = await collectAllJobs(first);
  assert.deepEqual(all.map((j) => j.job), ['a', 'b']);
});

test('collectAllJobs follows nextPage cursors until exhausted', async () => {
  const page3 = { jobs: [{ job: 'e' }], nextPage: null };
  const page2 = { jobs: [{ job: 'c' }, { job: 'd' }], nextPage: () => Promise.resolve(page3) };
  const page1 = { jobs: [{ job: 'a' }, { job: 'b' }], nextPage: () => Promise.resolve(page2) };
  const all = await collectAllJobs(page1);
  assert.deepEqual(all.map((j) => j.job), ['a', 'b', 'c', 'd', 'e']);
});

test('collectAllJobs tolerates a null result and missing jobs', async () => {
  assert.deepEqual(await collectAllJobs(null), []);
  assert.deepEqual(await collectAllJobs({ nextPage: null }), []);
});

test('paginate returns [] for non-positive perPage or page below 1', () => {
  assert.deepEqual(paginate([1, 2, 3], 1, 0), []);
  assert.deepEqual(paginate([1, 2, 3], 0, 2), []);
  assert.deepEqual(paginate([1, 2, 3], -1, 2), []);
});

test('collectAllJobs stops when nextPage resolves to null mid-chain', async () => {
  const page1 = { jobs: [{ job: 'a' }], nextPage: () => Promise.resolve(null) };
  const all = await collectAllJobs(page1);
  assert.deepEqual(all.map((j) => j.job), ['a']);
});
