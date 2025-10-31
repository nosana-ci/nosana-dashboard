import type { Job, JobDefinition } from "@nosana/sdk";

export type EndpointStatus = "ONLINE" | "OFFLINE" | "UNKNOWN";

export interface EndpointInfo {
  opId: string;
  url?: string;
  port?: number;
  status: EndpointStatus;
  [key: string]: unknown;
}

export interface EndpointsSection {
  urls: Record<string, EndpointInfo>;
}

export interface OpState {
  operationId: string;
  status: string;
  startTime?: number;
  endTime?: number;
  exitCode?: number;
  results?: unknown;
  logs?: Array<{ log?: string; type?: string } | string> | any[];
}

export interface OperationsInfo {
  all?: Record<string, string>;
  currentGroup?: string | null;
  currentGroupStatus?: string;
  opStates: OpState[];
}

export interface ResultsSection {
  status?: string;
  startTime?: number;
  endTime?: number;
  opStates: OpState[];
}

export interface JobInfo {
  jobId: string;
  status: string;
  startTime?: number;
  endTime?: number;
  project: string;
  errors?: unknown[];
  jobDefinition?: JobDefinition;
  operations: OperationsInfo;
  endpoints?: EndpointsSection;
  results?: ResultsSection;
  secrets?: NodeSecrets;
}

export type LiveEndpoint = {
  url: string;
  port: number;
  opIndex: number;
  opId: string;
  hasHealthCheck: boolean;
  status: EndpointStatus;
};

export type LiveEndpoints = Map<string, LiveEndpoint>;

export type NodeSecretEndpointRaw = {
  opID: string;
  port: number;
  url: string;
  status: EndpointStatus | string;
  opId?: string;
};

export type NodeSecrets = Record<string, Record<string, NodeSecretEndpointRaw>>;

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
      opId: raw.opID ?? raw.opId ?? meta?.opId ?? "",
      opIndex: meta?.opIndex ?? 0,
      port: portNum,
      hasHealthCheck: Boolean(meta?.hasHealthCheck),
    });
  }
  
  return newEndpoints;
}

export interface JobViewModel extends Job {
  address: string;
  usdRewardPerHour?: number;
  jobDefinition?: JobDefinition & {
    state?: {
      "nosana/job-type"?: string;
      "input/repo"?: string;
      "input/commit-sha"?: string;
    };
  };
  jobStatus?: "success" | "failed";
  results?: ResultsSection | null;
  isActive: boolean;
  isRunning: boolean;
  isCompleted: boolean;
  hasResultsRegex: boolean;

  stopJob: () => Promise<void>;
  extendJob: (extensionHours: number) => Promise<void>;
  refresh: () => Promise<void>;
}

