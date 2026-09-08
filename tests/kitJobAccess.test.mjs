import test from "node:test";
import assert from "node:assert/strict";
import { createNosanaApi } from "@nosana/api";
import { getDeploymentJobData } from "../app/utils/kitJobAccess.ts";

const config = {
  blockchain_indexer_url: "https://indexer.test",
  deployment_manager_url: "https://dm.test",
  node_domain: "nodes.test",
};

test("queued deployment job data remains available without an assigned node", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({
      job: "33333333333333333333333333333333",
      node: null,
      state: "QUEUED",
    }),
  );
  const api = createNosanaApi("devnet", undefined, {
    ...config,
    include_credentials: true,
  });
  const data = await getDeploymentJobData(
    api,
    "d",
    "33333333333333333333333333333333",
  );
  assert.equal(data.state, "QUEUED");
  assert.equal(data.node, null);
});
