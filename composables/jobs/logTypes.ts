// Shared log-related types used by flog viewer and tabs

export interface ProgressBar {
  id: string;
  current: number;
  total: number;
  currentDisplay: number;
  totalDisplay: number;
  status: string;
  currentFormat: string;
  totalFormat: string;
  completed: boolean;
}

export interface LogEntry {
  id: number;
  type: "log" | "progress";
  content: string;
  timestamp: number;
  html?: boolean;
  isContainerLog?: boolean;
}


