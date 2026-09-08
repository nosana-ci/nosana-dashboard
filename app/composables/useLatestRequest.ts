import { getCurrentScope, onScopeDispose } from "vue";

/**
 * Tracks which async request is the latest so stale results can be ignored.
 *
 *   const requests = useLatestRequest();
 *   const request = requests.begin();
 *   const data = await load();
 *   if (!requests.isCurrent(request)) return;
 *
 * begin() supersedes the previous request, cancel() supersedes without
 * starting a new one, and disposing the owning scope supersedes everything.
 */
export interface LatestRequest {
  begin(): number;
  isCurrent(token: number): boolean;
  cancel(): void;
}

export function useLatestRequest(): LatestRequest {
  let latest = 0;
  let disposed = false;

  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true;
      latest += 1;
    });
  }

  return {
    begin: () => ++latest,
    isCurrent: (token) => !disposed && token === latest,
    cancel: () => {
      latest += 1;
    },
  };
}
