import type { JobInfo, LiveEndpoints, LiveEndpoint, EndpointStatus } from "./types";

export function normalizeEndpoints(
  info: JobInfo,
  jobId: string,
  metaByPort: Map<number, { opId: string; opIndex: number; hasHealthCheck: boolean }>
): LiveEndpoints {
  const newEndpoints = new Map<string, LiveEndpoint>();

  const secretsData = info.secrets?.[jobId];
  if (!secretsData) return newEndpoints;

  for (const [, raw] of Object.entries(secretsData)) {
    if (!raw?.url) continue;
    const portNum = Number(raw.port);
    const meta = metaByPort.get(portNum);
    newEndpoints.set(raw.url, {
      status: (raw.status ?? "UNKNOWN") as EndpointStatus,
      url: raw.url,
      opId: (raw as any).opID ?? (raw as any).opId ?? meta?.opId ?? "",
      opIndex: meta?.opIndex ?? 0,
      port: portNum,
      hasHealthCheck: Boolean(meta?.hasHealthCheck),
    });
  }

  return newEndpoints;
}


