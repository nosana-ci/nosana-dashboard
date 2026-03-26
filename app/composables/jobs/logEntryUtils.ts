import AnsiUp from 'ansi_up';
import { sanitizeAnsiHtml } from '~/utils/htmlSanitization';
import type { UnifiedLogEntry } from './logCollectorTypes';

// AnsiUp is created per-call to avoid shared state corruption across streams
export function ansiToHtml(raw: string): string {
  const a = new AnsiUp();
  a.use_classes = true;
  return sanitizeAnsiHtml(a.ansi_to_html(raw));
}

export function makeEntry(
  id: number,
  jobId: string,
  opId: string | null,
  type: UnifiedLogEntry['type'],
  timestamp: number,
  content: string,
): UnifiedLogEntry {
  return { id, jobId, opId, type, timestamp, content };
}

export function makeLazyAnsiEntry(
  id: number,
  jobId: string,
  opId: string | null,
  type: UnifiedLogEntry['type'],
  timestamp: number,
  rawAnsi: string,
): UnifiedLogEntry {
  let raw: string | undefined = rawAnsi;
  let html: string | undefined;
  return {
    id, jobId, opId, type, timestamp,
    get content() {
      if (html === undefined) {
        html = ansiToHtml(raw!);
        raw = undefined;
      }
      return html;
    },
    set content(v: string) {
      html = v;
    },
  };
}

function compareEntries(a: UnifiedLogEntry, b: UnifiedLogEntry): number {
  if (a.timestamp === 0 && b.timestamp === 0) return a.id - b.id;
  if (a.timestamp === 0) return -1;
  if (b.timestamp === 0) return 1;
  return a.timestamp - b.timestamp || a.id - b.id;
}

function binaryInsertionIndex(arr: UnifiedLogEntry[], entry: UnifiedLogEntry): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (compareEntries(arr[mid]!, entry) <= 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function insertSorted(arr: UnifiedLogEntry[], newEntries: UnifiedLogEntry[]): UnifiedLogEntry[] {
  if (newEntries.length === 0) return arr;
  if (newEntries.length > 100) {
    const merged = [...arr, ...newEntries];
    merged.sort(compareEntries);
    return merged;
  }
  const result = [...arr];
  for (const entry of newEntries) {
    const idx = binaryInsertionIndex(result, entry);
    result.splice(idx, 0, entry);
  }
  return result;
}

export function parseLogTs(ts: unknown): number {
  if (!ts) return 0;
  const ms = new Date(String(ts)).getTime();
  return isNaN(ms) ? 0 : ms;
}
