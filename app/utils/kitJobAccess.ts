import type { DeploymentJob, NodeJobApi, NosanaApiClient } from "@nosana/api";

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
  if (deploymentId) {
    const deployment = await api.deployments.get(deploymentId);
    return deployment.getJob(jobAddress);
  }
  return api.jobs.get(jobAddress);
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
