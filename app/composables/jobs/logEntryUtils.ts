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

/**
 * Both sides are already in order — `arr` from the last call, the batch from
 * the stream it arrived on — so they are merged rather than re-sorted, and the
 * result costs one pass over a list that grows to the length of a run.
 */
export function insertSorted(arr: UnifiedLogEntry[], newEntries: UnifiedLogEntry[]): UnifiedLogEntry[] {
  if (newEntries.length === 0) return arr;

  const batch = [...newEntries].sort(compareEntries);
  if (arr.length === 0) return batch;

  // The overwhelmingly common case: everything in the batch is newer than
  // everything already held.
  if (compareEntries(arr[arr.length - 1]!, batch[0]!) <= 0) {
    return arr.concat(batch);
  }

  const merged: UnifiedLogEntry[] = new Array(arr.length + batch.length);
  let i = 0;
  let j = 0;
  let k = 0;
  while (i < arr.length && j < batch.length) {
    merged[k++] = compareEntries(arr[i]!, batch[j]!) <= 0 ? arr[i++]! : batch[j++]!;
  }
  while (i < arr.length) merged[k++] = arr[i++]!;
  while (j < batch.length) merged[k++] = batch[j++]!;
  return merged;
}

export function parseLogTs(ts: unknown): number {
  if (!ts) return 0;
  const ms = new Date(String(ts)).getTime();
  return isNaN(ms) ? 0 : ms;
}
