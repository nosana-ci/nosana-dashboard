// Comma-separated job-state filters for the deployment jobs endpoint.
export const ACTIVE_JOB_STATES = "QUEUED,RUNNING";
export const HISTORY_JOB_STATES = "COMPLETED,STOPPED";

/** A page of results that can yield the next page via a keyset cursor. */
export interface CursorPage<T> {
  jobs?: T[];
  nextPage?: (() => Promise<CursorPage<T>>) | null;
}

/**
 * Follow keyset-pagination cursors, accumulating every job across all pages.
 */
export async function collectAllJobs<T>(
  firstResult: CursorPage<T> | null | undefined,
): Promise<T[]> {
  let result = firstResult;
  let all: T[] = result && Array.isArray(result.jobs) ? [...result.jobs] : [];
  while (result && typeof result.nextPage === "function") {
    result = await result.nextPage();
    if (result && Array.isArray(result.jobs)) {
      all = all.concat(result.jobs);
    }
  }
  return all;
}

/** Clamp a 1-based page index into [1, total]. */
export function clampPage(page: number, total: number): number {
  if (total < 1) return 1;
  if (page < 1) return 1;
  if (page > total) return total;
  return page;
}

/**
 * Slice items for a 1-based page. Returns [] for a non-positive perPage or a
 * page below 1 (callers should clamp with clampPage first).
 */
export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  if (perPage <= 0 || page < 1) return [];
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}
