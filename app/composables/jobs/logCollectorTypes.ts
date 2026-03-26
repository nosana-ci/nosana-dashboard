import type { DeploymentJobItem } from '@nosana/api';
import type { LogEntryType } from './logCollectorUtils';

// The API returns `node` on job items but the schema type doesn't declare it
export type JobItem = DeploymentJobItem & {
  node?: string;
};

export interface UnifiedLogEntry {
  id: number;
  jobId: string;
  opId: string | null;
  type: LogEntryType;
  timestamp: number;
  _plainText?: string;
  _html?: string;
  content: string;
}

export interface LogFilterState {
  jobIds: Set<string>;
  opIds: Set<string>;
  types: Set<LogEntryType>;
  searchText: string;
}