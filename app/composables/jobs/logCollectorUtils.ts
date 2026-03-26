import { JobState, type Job } from '@nosana/kit';
import type { DeploymentJobItem } from '@nosana/api';
import type { UnifiedLogEntry, JobItem } from './logCollectorTypes';

type DeploymentJobState = DeploymentJobItem['state'];

// Job data can come from the API (snake_case) or the kit/blockchain (camelCase)
export type JobData = JobItem | Job;

const STATE_MAP: Record<DeploymentJobState, JobState> = {
  QUEUED: JobState.QUEUED,
  RUNNING: JobState.RUNNING,
  COMPLETED: JobState.COMPLETED,
  STOPPED: JobState.STOPPED,
};

export function resolveJobState(state: DeploymentJobState | JobState): JobState {
  if (typeof state === 'number') return state;
  return STATE_MAP[state];
}

export const JOB_COLORS = [
  '#58a6ff', '#bc8cff', '#3fb950', '#d29922',
  '#f85149', '#39d2c0', '#a371f7', '#c9a227',
  '#db61a2', '#2dd4bf', '#818cf8', '#f97316',
] as const;

export function jobColor(index: number): string {
  return JOB_COLORS[index % JOB_COLORS.length]!;
}

export function formatCompactDate(date: Date): string {
  const pad2 = (n: number) => n.toString().padStart(2, '0');

  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export function formatEpochSeconds(epochSeconds: number): string {
  return formatCompactDate(new Date(epochSeconds * 1000));
}

export function formatEpochMs(epochMs: number): string {
  if (epochMs === 0) return '-';
  return formatCompactDate(new Date(epochMs));
}

export function formatIsoString(iso: string): string {
  return formatCompactDate(new Date(iso));
}

function getTimeStart(job: JobData): number {
  if ('timeStart' in job) return Number((job as Job).timeStart);
  return (job as DeploymentJobItem).time_start || 0;
}

function getTimeEnd(job: JobData): number {
  if ('timeEnd' in job) return Number((job as Job).timeEnd);
  return 0;
}

export function getJobTimeBounds(job: JobData): { start: number; end: number } {
  let start = getTimeStart(job);
  let end = getTimeEnd(job);

  if (start > 0 && start < 1e12) start *= 1000;
  if (end > 0 && end < 1e12) end *= 1000;

  return { start, end: end || start };
}

export function computeJobDuration(job: JobData, nowMs: number): number | null {
  const timeStart = getTimeStart(job);
  if (!timeStart) return null;

  const state = resolveJobState(job.state);
  const timeEnd = getTimeEnd(job);

  if (timeEnd && state >= JobState.COMPLETED) {
    return Math.max(0, timeEnd - timeStart);
  }

  if (state === JobState.RUNNING) {
    return Math.max(0, Math.floor(nowMs / 1000) - timeStart);
  }

  return null;
}

export type LogEntryType = 'container' | 'system' | 'error';

export interface LogTypeInfo {
  value: LogEntryType;
  label: string;
  desc: string;
}

export const LOG_TYPES: readonly LogTypeInfo[] = [
  { value: 'container', label: 'Output', desc: 'Container stdout' },
  { value: 'system', label: 'System', desc: 'System & status messages' },
  { value: 'error', label: 'Error', desc: 'Failures & errors' },
] as const;

const LOG_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  LOG_TYPES.map((t) => [t.value, t.label]),
);

export function logTypeLabel(type: string): string {
  return LOG_TYPE_LABELS[type] || type;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function extractPlainText(entry: UnifiedLogEntry): string {
  if (entry._plainText === undefined) {
    entry._plainText = stripHtml(entry.content).toLowerCase();
  }
  return entry._plainText;
}

