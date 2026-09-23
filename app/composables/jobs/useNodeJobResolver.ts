import type { NodeJobApi, NosanaApiClient } from "@nosana/api";
import { getNodeJob } from "~/utils/kitJobAccess";

/**
 * Resolves the job's node client once per authenticated SDK client. The
 * returned function re-resolves after the client changes or a lookup fails.
 * Deployment jobs come from `deployment.getJob()`, so the deployment manager
 * signs node requests; standalone jobs come from `jobs.get()` and the wallet signs.
 */
export function useNodeJobResolver(
  jobAddress: string,
  deploymentId?: string,
): () => Promise<NodeJobApi> {
  const { nosana } = useKit();
  let client: NosanaApiClient | undefined;
  let pending: Promise<NodeJobApi> | undefined;

  return () => {
    const current = nosana.value.api;
    if (pending && current === client) return pending;

    client = current;
    const request = getNodeJob(current, jobAddress, deploymentId);
    pending = request;
    request.catch(() => {
      if (pending === request) pending = undefined;
    });
    return request;
  };
}
