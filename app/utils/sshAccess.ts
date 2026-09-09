import { SSH_USERNAME, sshHostname, type JobDefinition } from "@nosana/kit";

/** Preserve the index in the full definition, including non-container ops. */
export function getSshOperationIndex(
  definition: JobDefinition | null | undefined,
  operationId: string,
): number | undefined {
  const index = (definition?.ops ?? []).findIndex(
    (op) => op.type === "container/run" && op.id === operationId,
  );
  return index < 0 ? undefined : index;
}

export interface TerminalAccessContext {
  isRunning: boolean;
  operationReady: boolean;
  walletAddress?: string;
  projectAddress?: string;
  isDeploymentManaged?: boolean;
}

/** Dashboard-only availability copy for job access controls. */
export function getTerminalAccessReason({
  isRunning,
  operationReady,
  walletAddress,
  projectAddress,
  isDeploymentManaged = false,
}: TerminalAccessContext): string {
  if (!isRunning) return "The job must be running before access can start.";
  if (!operationReady) return "Select a container operation to continue.";
  if (isDeploymentManaged) return "";
  if (!walletAddress || walletAddress !== projectAddress) {
    return "Connect the wallet that posted this job to use wallet-authorized access.";
  }
  return "";
}

export interface DirectSshCommandOptions {
  job: string;
  node: string;
  nodeDomain: string;
  proxyPort: string;
  opIndex?: number;
}

/** Placeholder for the private key that matches one of the job's public keys. */
export const SSH_PRIVATE_KEY_PLACEHOLDER = "PATH_TO_PRIVATE_KEY";

/** The `ssh` invocation that reaches a job through its node's socat proxy. */
export function buildDirectSshCommand({
  job,
  node,
  nodeDomain,
  proxyPort,
  opIndex,
}: DirectSshCommandOptions): string {
  const hostname = sshHostname({ job, node, nodeDomain }, opIndex);
  return [
    "ssh -S none",
    "-o StrictHostKeyChecking=accept-new",
    `-o 'ProxyCommand=socat - PROXY:${nodeDomain}:%h:%p,proxyport=${proxyPort}'`,
    `${SSH_USERNAME}@${hostname}`,
    `-i ${SSH_PRIVATE_KEY_PLACEHOLDER}`,
  ].join(" \\\n  ");
}

/**
 * Kit and node failures we recognise, matched on the lower-cased message.
 * First match wins, so the more specific entries come first. Kit does not
 * expose error codes yet; when it does, match on those instead.
 */
const TERMINAL_ERROR_MESSAGES: ReadonlyArray<{
  match: readonly string[];
  message: string;
}> = [
  {
    match: ["user rejected", "user denied", "cancelled", "canceled"],
    message: "Signature request cancelled.",
  },
  {
    match: [
      "not the job poster",
      "invalid terminal authorization signature",
      "invalid job owner",
      "unauthorized",
    ],
    message: "Only the wallet that posted this job can open the web terminal.",
  },
  {
    match: ["expired"],
    message: "Terminal authorization expired. Try connecting again.",
  },
  {
    match: ["invalid path", "3003", "not enabled", "not supported"],
    message: "This node does not have web terminal access enabled.",
  },
  {
    match: ["assigned node"],
    message: "This job does not have an assigned node yet.",
  },
  {
    match: ["wallet", "authorization"],
    message:
      "Connect the wallet that posted this job and approve the signature request.",
  },
  {
    match: ["respond in time", "timeout"],
    message: "The node terminal did not respond in time.",
  },
];

/** Translate stable Kit/node failures into user-facing dashboard copy. */
export function translateTerminalError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  const known = TERMINAL_ERROR_MESSAGES.find(({ match }) =>
    match.some((fragment) => normalized.includes(fragment)),
  );
  return known?.message ?? (message || "Could not open the web terminal.");
}
