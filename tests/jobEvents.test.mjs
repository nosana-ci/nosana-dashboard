// NOTE: jobEvents is a TypeScript module, so these tests need a TS-aware
// runner to execute, e.g. `node --import tsx --test tests/jobEvents.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildJobTimeline,
  formatEventDuration,
  formatEventTimeAgo,
  formatEventTimestamp,
  shortAddress,
  solscanTxUrl,
} from '../app/utils/jobEvents';

const JOB = '6KEvFiLDE6ZxFGYiPBoybcRV9a3cm6GVHVgZGKNu8hdZ';
const MARKET = 'W1BQDd4gwpFv5yfTYkmwmjKTVsxULHmc1DkwnHQmTTQ';
const NODE = 'AWM1sspTevTpx5r9CN8De7yCf5vuBgzAZwZwf6nrs6Wq';
const SIGNATURE = '5Uv1qHqk6mQ9L3PtN8xJ7Yz2WgKcRbA4dFsEhTn1oXvB2mZpQrLyC3uDjS8kNf6Ta';

const event = (type, overrides = {}) => ({
  jobAddress: JOB,
  nodeAddress: null,
  marketAddress: null,
  runAddress: null,
  type,
  signature: SIGNATURE,
  instructionIndex: 0,
  slot: 400000000,
  blockTime: 1784711439,
  data: null,
  ...overrides,
});

test('timeline keeps API order and labels each instruction', () => {
  const items = buildJobTimeline([
    event('List', { marketAddress: MARKET }),
    event('Work', { nodeAddress: NODE, instructionIndex: 1 }),
    event('Finish', { nodeAddress: NODE, instructionIndex: 2 }),
    event('Clean', { marketAddress: MARKET, instructionIndex: 3 }),
  ]);

  assert.deepEqual(
    items.map((i) => i.title),
    [
      'Posted to market',
      'Picked up by node',
      'Finished by node',
      'Job account closed',
    ],
  );
  assert.deepEqual(
    items.map((i) => i.tone),
    ['info', 'success', 'success', 'grey'],
  );
});

test('keys stay unique for several instructions in one transaction', () => {
  const items = buildJobTimeline([
    event('Finish', { instructionIndex: 0 }),
    event('Clean', { instructionIndex: 1 }),
  ]);
  assert.equal(new Set(items.map((i) => i.key)).size, 2);
});

test('unknown instruction types fall back to the raw type', () => {
  const [item] = buildJobTimeline([event('SomethingNew')]);
  assert.equal(item.title, 'SomethingNew');
  assert.equal(item.tone, 'grey');
  assert.equal(item.detail, null);
});

test('list events name the market when it is known, else show the address', () => {
  const [named] = buildJobTimeline([event('List', { marketAddress: MARKET })], [
    { address: MARKET, name: 'NVIDIA 4090' },
  ]);
  assert.deepEqual(named.detail, {
    label: 'Market',
    text: 'NVIDIA 4090',
    value: MARKET,
    href: `https://explore.nosana.com/markets/${MARKET}`,
  });

  const [unnamed] = buildJobTimeline([event('List', { marketAddress: MARKET })]);
  assert.equal(unnamed.detail.text, shortAddress(MARKET));
});

test('pickup events link the node, falling back to the market', () => {
  const [withNode] = buildJobTimeline([
    event('Work', { nodeAddress: NODE, marketAddress: MARKET }),
  ]);
  assert.equal(withNode.detail.label, 'Node');
  assert.equal(withNode.detail.href, `https://explore.nosana.com/hosts/${NODE}`);

  // A pickup whose run account had already closed may have no node attributed.
  const [withoutNode] = buildJobTimeline([
    event('Work', { marketAddress: MARKET }),
  ]);
  assert.equal(withoutNode.detail.label, 'Market');

  const [bare] = buildJobTimeline([event('Work')]);
  assert.equal(bare.detail, null);
});

test('extend events show the new absolute timeout as a duration', () => {
  const [item] = buildJobTimeline([
    event('Extend', { marketAddress: MARKET, data: { timeout: 93600 } }),
  ]);
  assert.deepEqual(item.detail, {
    label: 'New timeout:',
    text: '1d 2h 0m',
    value: '93600',
  });

  const [missing] = buildJobTimeline([event('Extend', { data: null })]);
  assert.equal(missing.detail, null);
});

test('formatEventDuration drops the day part when under a day', () => {
  assert.equal(formatEventDuration(3600), '1h 0m');
  assert.equal(formatEventDuration(5400), '1h 30m');
  assert.equal(formatEventDuration(90000), '1d 1h 0m');
});

test('solscan links carry the devnet cluster only on devnet', () => {
  assert.equal(
    solscanTxUrl(SIGNATURE, false),
    `https://solscan.io/tx/${SIGNATURE}`,
  );
  assert.equal(
    solscanTxUrl(SIGNATURE, true),
    `https://solscan.io/tx/${SIGNATURE}?cluster=devnet`,
  );
});

test('block times render as UTC timestamps with a relative hint', () => {
  assert.equal(formatEventTimestamp(1784711439), '2026-07-22 09:10:39');

  const now = 1784711439 * 1000;
  assert.equal(formatEventTimeAgo(1784711439, now), '0s ago');
  assert.equal(formatEventTimeAgo(1784711439 - 45, now), '45s ago');
  assert.equal(formatEventTimeAgo(1784711439 - 90 * 60, now), '1h ago');
  assert.equal(formatEventTimeAgo(1784711439 - 50 * 3600, now), '2d ago');
});

test('addresses are shortened for display but kept in full for titles', () => {
  assert.equal(shortAddress(JOB), '6KEvFi...Nu8hdZ');
  assert.equal(shortAddress('short'), 'short');
});
