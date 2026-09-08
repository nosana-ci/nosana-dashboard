import type { DeploymentJob, NodeJobApi, NosanaApiClient } from "@nosana/api";

type ApiDeployment = Awaited<ReturnType<NosanaApiClient["deployments"]["get"]>>;

// Every view of a deployment job (info stream, logs, stats, shells, key
// management) resolves the same deployment and node job. Share those lookups
// per API client for a short while so opening a job costs one round trip,
// not one per widget; a failed lookup is forgotten so the next call retries.
const MEMO_TTL_MS = 30_000;

type Memo<T> = { promise: Promise<T>; at: number };
const deploymentMemo = new WeakMap<NosanaApiClient, Map<string, Memo<ApiDeployment>>>();
const nodeJobMemo = new WeakMap<NosanaApiClient, Map<string, Memo<NodeJobApi>>>();

function memoized<T>(
  store: WeakMap<NosanaApiClient, Map<string, Memo<T>>>,
  api: NosanaApiClient,
  key: string,
  load: () => Promise<T>,
): Promise<T> {
  let byKey = store.get(api);
  if (!byKey) {
    byKey = new Map();
    store.set(api, byKey);
  }
  const hit = byKey.get(key);
  if (hit && Date.now() - hit.at < MEMO_TTL_MS) return hit.promise;

  const promise = load();
  byKey.set(key, { promise, at: Date.now() });
  promise.catch(() => {
    if (byKey.get(key)?.promise === promise) byKey.delete(key);
  });
  return promise;
}

/** The deployment's API object, shared for a short while. */
export function getDeployment(
  api: NosanaApiClient,
  deploymentId: string,
): Promise<ApiDeployment> {
  return memoized(deploymentMemo, api, deploymentId, () =>
    api.deployments.get(deploymentId),
  );
}

/**
 * Let Kit choose the signer: the deployment manager for managed jobs, and the
 * wallet or the client manager for standalone jobs. Each connection resolves
 * its node; a node answers 401 to a caller that cannot sign for the job.
 */
export async function getNodeJob(
  api: NosanaApiClient,
  jobAddress: string,
  deploymentId: string | undefined,
): Promise<NodeJobApi> {
  if (!deploymentId) return api.jobs.get(jobAddress);
  return memoized(nodeJobMemo, api, `${deploymentId}:${jobAddress}`, async () =>
    (await getDeployment(api, deploymentId)).getJob(jobAddress),
  );
}

/**
 * Detail/history views also need queued jobs without a node. Kit's getJob()
 * requires an assigned node, so use its authenticated data client here.
 */
export async function getDeploymentJobData(
  api: NosanaApiClient,
  deployment: string,
  job: string,
): Promise<DeploymentJob> {
  const { data, error } = await api.clients.deploymentManager.GET(
    "/deployments/{deployment}/jobs/{job}",
    { params: { path: { deployment, job } } },
  );
  if (error || !data) throw new Error("Could not load deployment job.");
  return data;
}
