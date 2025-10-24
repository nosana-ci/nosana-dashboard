import type { JobDefinition } from "@nosana/sdk";

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
}


