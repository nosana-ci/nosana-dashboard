import test from "node:test";
import assert from "node:assert/strict";

import { useDeploymentStream } from "../app/composables/useDeploymentStream.ts";

/** A deployment whose stream the test drives by hand. */
const fakeDeployment = () => {
  let handlers;
  let closed = 0;
  return {
    deployment: {
      id: "d",
      stream(given) {
        handlers = given;
        return { close: () => { closed += 1; } };
      },
    },
    emit: (event) => handlers[event.on](event.frame),
    open: () => handlers.onOpen(),
    closes: () => closed,
  };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

test("applies deployment and job frames, and coalesces the refreshes", async () => {
  const applied = [];
  let refreshed = 0;
  const fake = fakeDeployment();

  const stream = useDeploymentStream({
    applyEvent: (event) => applied.push(event),
    refresh: async () => { refreshed += 1; },
  });

  stream.start(fake.deployment);
  fake.open();
  fake.emit({ on: "onDeployment", frame: { type: "deployment", status: "RUNNING" } });
  fake.emit({ on: "onJob", frame: { type: "job", job: "j", state: "QUEUED" } });
  await settle();

  assert.deepEqual(applied, [
    { type: "deployment", status: "RUNNING" },
    { type: "job", job: "j", state: "QUEUED" },
  ]);
  // Three frames, one refresh: they arrived inside the coalescing window.
  assert.equal(refreshed, 1);
  stream.stop();
});

test("event and task frames refresh without touching page state", async () => {
  const applied = [];
  let refreshed = 0;
  const fake = fakeDeployment();

  const stream = useDeploymentStream({
    applyEvent: (event) => applied.push(event),
    refresh: async () => { refreshed += 1; },
  });

  stream.start(fake.deployment);
  fake.emit({ on: "onEvent", frame: { type: "event", event: "X" } });
  fake.emit({ on: "onTask", frame: { type: "task", id: "t" } });
  await settle();

  assert.deepEqual(applied, []);
  assert.equal(refreshed, 1);
  stream.stop();
});

test("stopping closes the subscription", async () => {
  const fake = fakeDeployment();
  const stream = useDeploymentStream({
    applyEvent: () => {},
    refresh: async () => {},
  });

  stream.start(fake.deployment);
  stream.stop();

  assert.equal(fake.closes(), 1);
});

test("restarting closes the stream it replaces", async () => {
  const first = fakeDeployment();
  const second = fakeDeployment();
  const stream = useDeploymentStream({
    applyEvent: () => {},
    refresh: async () => {},
  });

  stream.start(first.deployment);
  stream.start(second.deployment);

  assert.equal(first.closes(), 1);
  assert.equal(second.closes(), 0);
  stream.stop();
});
