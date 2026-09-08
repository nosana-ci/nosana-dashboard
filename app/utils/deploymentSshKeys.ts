import { getSshKeyIdentity, parseSshPublicKeys } from "@nosana/kit";
import type { DeploymentSsh, DeploymentSshKeysResult } from "@nosana/api";

/** The part of a key update the dashboard shows: the keys now saved and per-job outcomes. */
export type DeploymentSshKeysProgress = Pick<
  DeploymentSshKeysResult,
  "public_keys" | "jobs"
>;
export type DeploymentSshJobResult = DeploymentSshKeysProgress["jobs"][number];

/**
 * Apply the editor's changes through Kit's add/remove API. Remove first so a
 * replacement at the ten-key limit is valid. Report each completed step so
 * failures from either operation remain visible, even if the next call fails.
 */
export async function saveDeploymentSshKeys(
  ssh: DeploymentSsh,
  previousKeys: string[],
  desiredKeys: string[],
  onProgress: (result: DeploymentSshKeysProgress) => void = () => {},
): Promise<DeploymentSshKeysProgress> {
  const { keys, errors } = parseSshPublicKeys(desiredKeys.join("\n"));
  if (errors.length) {
    throw new Error(errors.map((error) => error.message).join(" "));
  }
  const previousIds = new Set(previousKeys.map(getSshKeyIdentity));
  const desiredIds = new Set(keys.map(getSshKeyIdentity));
  const removed = previousKeys.filter(
    (key) => !desiredIds.has(getSshKeyIdentity(key)),
  );
  const added = keys.filter((key) => !previousIds.has(getSshKeyIdentity(key)));

  const steps: Array<["remove" | "add", string[]]> = [
    ["remove", removed],
    ["add", added],
  ];
  let result: DeploymentSshKeysProgress = {
    public_keys: [...previousKeys],
    jobs: [],
  };
  for (const [action, changed] of steps) {
    if (!changed.length) continue;
    const step = await ssh[action](changed);
    result = {
      public_keys: step.public_keys,
      jobs: [...result.jobs, ...step.jobs],
    };
    onProgress(result);
  }
  return result;
}

/** A job can fail both add and remove; show it once in the warning. */
export function failedSshJobs(
  result: DeploymentSshKeysProgress | null | undefined,
): DeploymentSshJobResult[] {
  return [
    ...new Map(
      (result?.jobs ?? [])
        .filter((job) => job.status === "failed")
        .map((job) => [job.job, job] as const),
    ).values(),
  ];
}
