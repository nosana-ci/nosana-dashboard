import test from "node:test";
import assert from "node:assert/strict";

import {
  canArchiveDeployment,
  canStartDeployment,
  canStopDeployment,
} from "../app/utils/deploymentStatusActions.ts";

const STATUSES = [
  "DRAFT",
  "ERROR",
  "STARTING",
  "RUNNING",
  "STOPPING",
  "STOPPED",
  "INSUFFICIENT_FUNDS",
  "ARCHIVED",
];

const allowed = (predicate) => STATUSES.filter(predicate);

test("start is offered for draft, stopped and errored deployments", () => {
  assert.deepEqual(allowed(canStartDeployment), ["DRAFT", "ERROR", "STOPPED"]);
});

test("stop is offered while a deployment is starting or running", () => {
  assert.deepEqual(allowed(canStopDeployment), ["STARTING", "RUNNING"]);
});

test("archive is refused for archived, running, stopping and draft deployments", () => {
  assert.deepEqual(allowed(canArchiveDeployment), [
    "ERROR",
    "STARTING",
    "STOPPED",
    "INSUFFICIENT_FUNDS",
  ]);
});
