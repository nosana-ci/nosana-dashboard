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
    emit: (on, frame) => handlers[on](frame),
    closes: () => closed,
  };
};

/** Counts a refresh per record, so a frame's blast radius is visible. */
const spyRefreshers = () => {
  const counts = { deployment: 0, jobs: 0, events: 0, tasks: 0 };
  const refresh = {};
  for (const key of Object.keys(counts)) {
    refresh[key] = async () => { counts[key] += 1; };
  }
  return { refresh, counts };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

test("a frame refreshes only the record it belongs to", async () => {
  const cases = [
    ["onDeployment", { type: "deployment", status: "RUNNING" }, "deployment"],
    ["onJob", { type: "job", job: "j", state: "QUEUED" }, "jobs"],
    ["onEvent", { type: "event", event: "X" }, "events"],
    ["onTask", { type: "task", id: "t" }, "tasks"],
    // An online flip touches only the endpoints, which live on the deployment.
    ["onEndpoint", { type: "endpoint", opId: "Pytorch", online: true }, "deployment"],
  ];

  for (const [handler, frame, expected] of cases) {
    const fake = fakeDeployment();
    const { refresh, counts } = spyRefreshers();
    const stream = useDeploymentStream({ applyEvent: () => {}, refresh });

    stream.start(fake.deployment);
    fake.emit(handler, frame);
    await settle();
    stream.stop();

    const touched = Object.keys(counts).filter((k) => counts[k] > 0);
    assert.deepEqual(touched, [expected], `${handler} should refresh only ${expected}`);
  }
});

test("only deployment and job frames reach page state", async () => {
  const fake = fakeDeployment();
  const { refresh } = spyRefreshers();
  const applied = [];
  const stream = useDeploymentStream({
    applyEvent: (event) => applied.push(event.type),
    refresh,
  });

  stream.start(fake.deployment);
  fake.emit("onDeployment", { type: "deployment", status: "RUNNING" });
  fake.emit("onJob", { type: "job", job: "j", state: "QUEUED" });
  fake.emit("onEvent", { type: "event", event: "X" });
  fake.emit("onTask", { type: "task", id: "t" });
  fake.emit("onEndpoint", { type: "endpoint", opId: "Pytorch", online: true });
  await settle();
  stream.stop();

  assert.deepEqual(applied, ["deployment", "job"]);
});

test("a burst of frames for one record collapses into a single refresh", async () => {
  const fake = fakeDeployment();
  const { refresh, counts } = spyRefreshers();
  const stream = useDeploymentStream({ applyEvent: () => {}, refresh });

  stream.start(fake.deployment);
  for (let i = 0; i < 5; i += 1) {
    fake.emit("onJob", { type: "job", job: `j${i}`, state: "RUNNING" });
  }
  await settle();
  stream.stop();

  assert.equal(counts.jobs, 1);
});

test("opening resynchronises every record", async () => {
  const fake = fakeDeployment();
  const { refresh, counts } = spyRefreshers();
  const stream = useDeploymentStream({ applyEvent: () => {}, refresh });

  stream.start(fake.deployment);
  fake.emit("onOpen");
  await settle();
  stream.stop();

  assert.deepEqual(counts, { deployment: 1, jobs: 1, events: 1, tasks: 1 });
});

test("stopping closes the subscription, and restarting closes the one it replaces", async () => {
  const first = fakeDeployment();
  const second = fakeDeployment();
  const { refresh } = spyRefreshers();
  const stream = useDeploymentStream({ applyEvent: () => {}, refresh });

  stream.start(first.deployment);
  stream.start(second.deployment);
  assert.equal(first.closes(), 1);
  assert.equal(second.closes(), 0);

  stream.stop();
  assert.equal(second.closes(), 1);
});
