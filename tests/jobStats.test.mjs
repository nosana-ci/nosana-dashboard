import test from "node:test";
import assert from "node:assert/strict";
import { useStatsFetch } from "../app/composables/jobs/useStatsFetch.ts";
import { useStatsStream } from "../app/composables/jobs/useStatsStream.ts";

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test("stats polling ignores a previous range that finishes after a newer request", async () => {
  const first = deferred();
  const second = deferred();
  let calls = 0;
  const received = [];
  const stats = useStatsFetch(
    async () => ({
      stats: () => (++calls === 1 ? first.promise : second.promise),
    }),
    (data) => received.push(data),
  );
  const oldRequest = stats.fetch(5, 30);
  await Promise.resolve();
  const newRequest = stats.fetch(10, 60);
  await Promise.resolve();
  first.resolve([{ timestamp: 1 }]);
  await oldRequest;
  assert.equal(stats.isLoading.value, true);
  second.resolve([{ timestamp: 2 }]);
  await newRequest;
  assert.deepEqual(received, [[{ timestamp: 2 }]]);
  assert.equal(stats.isLoading.value, false);
});

test("unmounting during job resolution prevents a stats request or stream", async () => {
  const job = deferred();
  let opened = 0;
  const getJob = () => job.promise;
  const stats = useStatsFetch(getJob, () =>
    assert.fail("received data after abort"),
  );
  const stream = useStatsStream(getJob, () =>
    assert.fail("received data after destroy"),
  );
  const pending = [stats.fetch(5, 30), stream.start()];
  stats.abort();
  stream.destroy();
  job.resolve({
    stats: () => {
      opened++;
    },
    streamStats: () => {
      opened++;
    },
  });
  await Promise.all(pending);
  assert.equal(opened, 0);
  assert.equal(stats.isLoading.value, false);
});

test("stats stream accepts batched readings and closes on disposal", async () => {
  let handlers;
  let closed = 0;
  const received = [];
  const stream = useStatsStream(
    async () => ({
      streamStats(h, query) {
        assert.equal(query.interval, 5);
        handlers = h;
        return {
          close: () => {
            closed++;
          },
        };
      },
    }),
    (data) => received.push(data),
  );
  await stream.start();
  handlers.onData([{ opId: "web" }, { opId: "worker" }]);
  stream.destroy();
  handlers.onData([{ opId: "late" }]);
  assert.equal(received.length, 1);
  assert.equal(received[0].length, 2);
  assert.equal(closed, 1);
});
