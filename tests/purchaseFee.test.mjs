import test from "node:test";
import assert from "node:assert/strict";

import {
  purchaseFeeUsd,
  purchaseTotalUsd,
  usdcToSend,
} from "../app/utils/purchaseFee.ts";

test("2% on $100 of credits is $2, for a $102 total", () => {
  assert.equal(purchaseFeeUsd(100, 200), 2);
  assert.equal(purchaseTotalUsd(100, 200), 102);
  assert.equal(usdcToSend(100, 200), 102);
});

test("rounds card fees to cents", () => {
  assert.equal(purchaseFeeUsd(25, 200), 0.5);
  assert.equal(purchaseTotalUsd(25, 200), 25.5);
  assert.equal(purchaseFeeUsd(1, 250), 0.03);
  assert.equal(purchaseTotalUsd(1, 250), 1.03);
});

test("rounds the USDC to send up to 6 decimals", () => {
  assert.equal(usdcToSend(10.5, 200), 10.71);
  assert.equal(usdcToSend(0.000001, 200), 0.000002);
});

test("a zero fee changes nothing", () => {
  assert.equal(purchaseFeeUsd(42, 0), 0);
  assert.equal(purchaseTotalUsd(42, 0), 42);
  assert.equal(usdcToSend(42, 0), 42);
});
