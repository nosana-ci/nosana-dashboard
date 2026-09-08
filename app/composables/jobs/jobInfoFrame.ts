import type { Ref } from "vue";
import { getJobExposedServices, type JobDefinition } from "@nosana/kit";
import type { JobInfo, JobViewModel, LiveEndpoints, ResultsSection } from "./types";
import { normalizeEndpoints } from "./normalizeEndpoints";

/**
 * The pieces of a node's job info frame that `useJob` and `useDeploymentJob`
 * read the same way. Both compose them differently: the deployment job keeps
 * its definition from the API and hides results from non-posters of a
 * confidential job, so only these steps are shared.
 */

/** What the job definition exposes, keyed by port, for endpoint lookups. */
export type PortMeta = Map<
  number,
  { opId: string; opIndex: number; hasHealthCheck: boolean }
>;

export function servicesByPort(
  definition: JobDefinition | undefined,
  jobId: string,
): PortMeta {
  const metaByPort: PortMeta = new Map();
  const services = definition ? getJobExposedServices(definition, jobId) : [];
  for (const { port, opId, opIndex, hasHealthCheck } of services) {
    metaByPort.set(Number(port), { opId, opIndex, hasHealthCheck });
  }
  return metaByPort;
}

/** Adds the frame's endpoints to the live map, keeping the ones it omits. */
export function mergeEndpoints(
  endpoints: Ref<LiveEndpoints>,
  info: JobInfo,
  jobId: string,
  metaByPort: PortMeta,
): void {
  const normalized = normalizeEndpoints(info, jobId, metaByPort);
  if (normalized.size === 0) return;
  const merged = new Map(endpoints.value);
  for (const [url, endpoint] of normalized) {
    merged.set(url, endpoint);
  }
  endpoints.value = merged;
}

/** Records the node's results, and whether any op matched a results regex. */
export function applyResults(job: JobViewModel, results: ResultsSection): void {
  job.results = results;
  job.hasResultsRegex = Array.isArray(results.opStates)
    ? results.opStates.some((op) => (op as { results?: unknown }).results !== undefined)
    : false;
}
