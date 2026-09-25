/**
 * A CVM job runs its own job API inside the VM, published at the job's own
 * domain (`<job>.<nodeDomain>`). SSH keys and the web terminal live there, not
 * on the host node Kit addresses, so for CVM jobs the dashboard talks to the
 * VM directly — as it already does for the CVM's logs.
 */

/** Where a CVM job's own API answers. */
export function cvmJobApiUrl(jobAddress: string, nodeDomain: string): string {
  return `https://${jobAddress}.${nodeDomain}`;
}

/** A WebSocket factory for Kit's terminal that opens the VM's terminal instead of the host's. */
export function cvmTerminalSocket(
  jobAddress: string,
  nodeDomain: string,
): () => WebSocket {
  return () => new WebSocket(`wss://${jobAddress}.${nodeDomain}/terminal`);
}

export interface CvmSshKeyChange {
  jobAddress: string;
  nodeDomain: string;
  /**
   * The job owner's signature over the job address (for a deployment, its
   * vault's, from `deployment.generateAuthHeader`) — the header Kit sends nodes.
   */
  authorization: string;
  added: string[];
  removed: string[];
}

/**
 * Apply SSH key changes to a CVM job: revoke removed keys, then authorize added
 * ones (so a replacement at the key limit fits). Throws with the VM's error on
 * the first failure.
 */
export async function applyCvmSshKeys(
  { jobAddress, nodeDomain, authorization, added, removed }: CvmSshKeyChange,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const base = cvmJobApiUrl(jobAddress, nodeDomain);
  const send = async (method: "POST" | "DELETE", path: string, sshPublicKey: string) => {
    const response = await fetchImpl(`${base}${path}`, {
      method,
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify({ sshPublicKey }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error || `The VM returned ${response.status} for ${method} ${path}`);
    }
  };
  for (const key of removed) await send("DELETE", "/ssh/keys", key);
  for (const key of added) await send("POST", "/ssh/authorize", key);
}
