import type { JobEvent } from "~/utils/jobEvents";

/**
 * On-chain transaction events for a job, as decoded by the blockchain indexer.
 *
 * The indexer records one event per Nosana Jobs instruction (list, delist,
 * work/pickup, extend, end/stop, finish, complete, clean, ...), oldest first.
 * Events are indexed going forward only, so an older job can legitimately
 * return an empty list. The endpoint isn't available on every network yet, in
 * which case `supported` flips to false and polling stops.
 */
const POLL_INTERVAL_MS = 20000;

export function useJobEvents(
  jobAddress: string,
  options: { isActive?: Ref<boolean> } = {},
) {
  const config = useRuntimeConfig();
  const events = ref<JobEvent[]>([]);
  const loading = ref(true);
  // Set to false when the API has no events endpoint (older deployments).
  const supported = ref(true);

  const fetchEvents = async (): Promise<void> => {
    if (!jobAddress || !supported.value) return;

    try {
      const response = await $fetch<JobEvent[]>(
        `/api/jobs/${jobAddress}/events`,
        {
          baseURL: config.public.apiBase as string,
          headers: { Accept: "application/json" },
        },
      );
      events.value = Array.isArray(response) ? response : [];
    } catch (error: unknown) {
      const status =
        (error as { status?: number })?.status ??
        (error as { statusCode?: number })?.statusCode;
      if (status === 404) {
        supported.value = false;
      } else {
        console.error("[useJobEvents] Failed to fetch job events:", error);
      }
    } finally {
      loading.value = false;
    }
  };

  const { pause, resume } = useIntervalFn(fetchEvents, POLL_INTERVAL_MS, {
    immediate: false,
  });

  onMounted(fetchEvents);

  // Keep polling while the job can still produce events (queued or running).
  watch(
    [() => options.isActive?.value ?? false, supported],
    ([isActive, isSupported]) => {
      if (isActive && isSupported) resume();
      else pause();
    },
    { immediate: true },
  );

  onBeforeUnmount(pause);

  return {
    events,
    loading,
    supported,
    refresh: fetchEvents,
  };
}
