// Which lifecycle actions a deployment status allows. Shared by the detail
// page's actions menu and the list page's bulk actions so both agree.
export type DeploymentStatusLike = string | null | undefined;

export const canStartDeployment = (status: DeploymentStatusLike): boolean =>
  status === "DRAFT" || status === "STOPPED" || status === "ERROR";

export const canStopDeployment = (status: DeploymentStatusLike): boolean =>
  status === "RUNNING" || status === "STARTING";

export const canArchiveDeployment = (status: DeploymentStatusLike): boolean =>
  status !== "ARCHIVED" &&
  status !== "RUNNING" &&
  status !== "STOPPING" &&
  status !== "DRAFT";
