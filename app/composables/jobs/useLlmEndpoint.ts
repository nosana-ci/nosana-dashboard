import type { JobDefinition } from "@nosana/kit";
import { findChatEndpoints } from "~/utils/llmChat";

/**
 * - starting: running, but the chat port is not online or not yet checked
 * - ready: online, and the server answered `/v1/models`
 * - auth: online, but it wants an API key (none given, or the wrong one)
 * - error: online, but the browser could not get an answer from it
 * - ended: nothing is running
 */
export type LlmChatStatus = "starting" | "ready" | "auth" | "error" | "ended";

/** An exposed port and whether it answers: a job's or a deployment's. */
export type ChatEndpointState = {
  opId: string;
  port: number | string;
  url: string;
  online: boolean;
};

/**
 * The chat-completions endpoint the definition declares, and whether it can be
 * talked to right now. Works for a single job (its own URLs) and for a
 * deployment (the deployment's URLs).
 */
export function useLlmEndpoint(options: {
  definition: () => JobDefinition | null | undefined;
  endpoints: () => Iterable<ChatEndpointState>;
  running: () => boolean;
  /** A key the reader entered, sent as a bearer token. */
  apiKey?: () => string;
}) {
  const candidate = computed(
    () => findChatEndpoints(options.definition())[0] ?? null,
  );

  const endpoint = computed<ChatEndpointState | null>(() => {
    const target = candidate.value;
    if (!target) return null;
    for (const item of options.endpoints()) {
      if (item.opId === target.opId && Number(item.port) === target.port) {
        return item;
      }
    }
    return null;
  });

  // The health check's own headers, with the reader's key on top.
  const headers = computed<Record<string, string>>(() => {
    const key = options.apiKey?.().trim();
    return {
      ...candidate.value?.headers,
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    };
  });

  // Set when a look on tab open found the model answering before the status
  // stream said so; cleared whenever the stream reports again.
  const answered = ref(false);
  watch(
    () => [endpoint.value?.online, endpoint.value?.url],
    () => (answered.value = false),
  );

  const online = computed(
    () => options.running() && (!!endpoint.value?.online || answered.value),
  );

  // Asking the server for its models proves the browser can reach it and
  // gives the exact model id, which the health check does not always name.
  const probe = ref<
    "idle" | "pending" | "ok" | "unauthorized" | "unreachable" | "unavailable"
  >("idle");
  const probeStatus = ref(0);
  const probedModel = ref<string | null>(null);

  const runProbe = async () => {
    const url = endpoint.value?.url;
    if (!url) return;
    probe.value = "pending";
    try {
      const response = await fetch(`${url.replace(/\/+$/, "")}/v1/models`, {
        headers: headers.value,
      });
      probeStatus.value = response.status;
      if (response.ok) {
        const data = (await response.json()) as { data?: Array<{ id?: string }> };
        probedModel.value = data.data?.[0]?.id ?? null;
      }
      // A gateway error usually means the model behind it is still loading.
      // Any other answer means the server is there; the chat reports whatever
      // else is wrong.
      probe.value =
        response.status === 401 || response.status === 403
          ? "unauthorized"
          : response.status >= 500
            ? "unavailable"
            : "ok";
    } catch {
      probe.value = "unreachable";
    }
  };

  watch(
    [online, () => endpoint.value?.url],
    ([isOnline]) => {
      if (isOnline) void runProbe();
      else probe.value = "idle";
    },
    { immediate: true },
  );

  // A new key is tried at once.
  watch(
    () => options.apiKey?.(),
    () => {
      if (online.value) void runProbe();
    },
  );

  const model = computed(
    () => probedModel.value ?? candidate.value?.model ?? "",
  );

  const status = computed<LlmChatStatus | null>(() => {
    if (!candidate.value) return null;
    if (!options.running()) return "ended";
    if (!online.value || probe.value === "idle" || probe.value === "pending") {
      return "starting";
    }
    if (probe.value === "unauthorized") return "auth";
    if (probe.value !== "ok") return "error";
    // Reachable, but neither the server nor the definition named a model.
    return model.value ? "ready" : "error";
  });

  /**
   * For when the chat comes on screen: look again, once, unless it is already
   * usable. An error is retried; an endpoint the stream still calls offline
   * counts as up only if it answers, so a failed look leaves it "starting".
   */
  const recheck = async () => {
    const url = endpoint.value?.url;
    if (!url || !options.running() || status.value === "ready") return;
    if (probe.value === "pending") return;
    if (online.value) return runProbe();
    try {
      const response = await fetch(`${url.replace(/\/+$/, "")}/v1/models`, {
        headers: headers.value,
      });
      // A key prompt counts as up too: the server is there, it wants a key.
      if (response.ok || response.status === 401 || response.status === 403) {
        answered.value = true;
      }
    } catch {
      /* still starting */
    }
  };

  const error = computed(() => {
    if (status.value !== "error") return "";
    if (probe.value === "unreachable") {
      return "Couldn't reach the endpoint from the browser. It may still be restarting, or its server refused the request.";
    }
    if (probe.value === "unavailable") {
      return `The endpoint answered ${probeStatus.value}. The model may still be loading; try again in a moment.`;
    }
    return "The server didn't list a model at /v1/models. Chat needs an OpenAI-compatible server.";
  });

  return {
    candidate,
    endpoint,
    headers,
    model,
    status,
    error,
    retry: runProbe,
    recheck,
  };
}
