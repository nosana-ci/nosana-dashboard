import type { Ref } from 'vue';
import type { UnifiedLogEntry } from './logCollectorTypes';
import { escapeHtml } from '~/utils/htmlSanitization';
import { makeEntry, makeLazyAnsiEntry, parseLogTs } from './logEntryUtils';

export interface ParsedResult {
  entries: UnifiedLogEntry[];
  opIds: string[];
}

export function parseJobResult(
  jobId: string,
  result: Record<string, unknown>,
  jobBounds: { start: number; end: number },
  seq: Ref<number>,
): ParsedResult {
  const entries: UnifiedLogEntry[] = [];
  const opIds: string[] = [];
  const opStates = result.opStates as Array<Record<string, unknown>> | undefined;

  if (opStates && opStates.length > 0) {
    for (const opState of opStates) {
      const opId = (opState.operationId as string) || null;
      if (opId) opIds.push(opId);
      const logs = opState.logs as Array<Record<string, unknown>> | undefined;
      const firstLogTs = logs?.length ? parseLogTs(logs[0]!.timestamp) : 0;
      const lastLogTs = logs?.length ? parseLogTs(logs[logs.length - 1]!.timestamp) : 0;
      const opStartTs = firstLogTs || jobBounds.start;
      const opEndTs = lastLogTs || jobBounds.end;

      // Step header
      entries.push(makeEntry(
        ++seq.value, jobId, opId, 'system',
        opStartTs > 0 ? opStartTs - 1 : 0,
        `<span class="ansi-blue-fg">- Executed step '${escapeHtml(opId || 'unknown')}'</span>`,
      ));

      // Log entries — lazy HTML conversion
      if (logs) {
        for (const log of logs) {
          const raw = ((log.log as string) || '').slice(0, 10000);
          entries.push(makeLazyAnsiEntry(
            ++seq.value, jobId, opId, 'container',
            parseLogTs(log.timestamp),
            raw,
          ));
        }
      }

      // Exit status
      if (opState.status) {
        const isError = (opState.exitCode as number) !== 0;
        entries.push(makeEntry(
          ++seq.value, jobId, opId,
          isError ? 'error' : 'system',
          opEndTs > 0 ? opEndTs + 1 : 0,
          `<span class="${isError ? 'ansi-red-fg' : 'ansi-blue-fg'}">Exited with status ${escapeHtml(String(opState.status))} with code ${opState.exitCode}</span>`,
        ));
      }

      // Op errors
      const opErrors = opState.errors as Array<Record<string, unknown>> | undefined;
      if (opErrors) {
        for (let i = 0; i < opErrors.length; i++) {
          const err = opErrors[i]!;
          const msg = (err.message as string) || (err.event as string) || JSON.stringify(err);
          entries.push(makeEntry(
            ++seq.value, jobId, opId, 'error',
            opEndTs > 0 ? opEndTs + 2 + i : 0,
            `<span class="ansi-red-fg">${escapeHtml(msg)}</span>`,
          ));
        }
      }
    }
  }

  // Top-level errors
  const topErrors = result.errors as Array<unknown> | undefined;
  const fallbackTs = jobBounds.end || jobBounds.start;
  if (topErrors && topErrors.length > 0) {
    for (let i = 0; i < topErrors.length; i++) {
      const msg = typeof topErrors[i] === 'string' ? topErrors[i] as string : JSON.stringify(topErrors[i]);
      entries.push(makeEntry(
        ++seq.value, jobId, null, 'error',
        fallbackTs > 0 ? fallbackTs + 10 + i : 0,
        `<span class="ansi-red-fg">${escapeHtml(msg)}</span>`,
      ));
    }
  }

  // Top-level status
  if (result.status) {
    entries.push(makeEntry(
      ++seq.value, jobId, null, 'system',
      fallbackTs > 0 ? fallbackTs + 100 : 0,
      `<span class="ansi-yellow-fg">Status: ${escapeHtml(String(result.status))}</span>`,
    ));
  }

  return { entries, opIds };
}
