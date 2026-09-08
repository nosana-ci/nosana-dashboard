import test from "node:test";
import assert from "node:assert/strict";
import { effectScope } from "vue";
import { useLatestRequest } from "../app/composables/useLatestRequest.ts";

test("a newer request makes the earlier one stale", () => {
  const requests = useLatestRequest();
  const first = requests.begin();
  const second = requests.begin();
  assert.equal(requests.isCurrent(first), false);
  assert.equal(requests.isCurrent(second), true);
});

test("cancel makes in-flight requests stale without starting a new one", () => {
  const requests = useLatestRequest();
  const token = requests.begin();
  requests.cancel();
  assert.equal(requests.isCurrent(token), false);
  assert.equal(requests.isCurrent(requests.begin()), true);
});

test("disposing the owning scope makes every request stale for good", () => {
  const scope = effectScope();
  const requests = scope.run(() => useLatestRequest());
  const token = requests.begin();
  scope.stop();
  assert.equal(requests.isCurrent(token), false);
  assert.equal(requests.isCurrent(requests.begin()), false);
});

test("a stale async result is ignored while the latest one lands", async () => {
  const requests = useLatestRequest();
  const results = [];
  const load = async (value, delay) => {
    const request = requests.begin();
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (requests.isCurrent(request)) results.push(value);
  };
  await Promise.all([load("slow", 20), load("fast", 1)]);
  assert.deepEqual(results, ["fast"]);
});
