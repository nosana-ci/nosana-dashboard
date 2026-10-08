import { ref, computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import Session from "supertokens-web-js/recipe/session";
import { parseSse, pendingApproval, type NosaMessage } from "~/utils/nosaChat";

/**
 * Nosa acts on the user's account using the existing SuperTokens session. The browser
 * sends the HttpOnly session cookie directly; dashboard code never reads the token.
 */
const NOT_CONNECTED = "Your session has ended. Sign in again to use Nosa.";

export type NosaLive = { text: string; steps: { callId: string; name: string; state: "running" | "done" | "failed" }[] };

export function useNosa() {
  const nosaUrl = useRuntimeConfig().public.nosaUrl as string | undefined;
  const history = useLocalStorage<NosaMessage[]>("nosa-history", []);
  const live = ref<NosaLive | null>(null);
  const error = ref<string | null>(null);
  let controller: AbortController | null = null;

  const busy = computed(() => live.value !== null);
  const pending = computed(() => pendingApproval(history.value));

  const post = (messages: NosaMessage[]) =>
    fetch(`${nosaUrl}/dashboard/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ messages }),
      signal: controller!.signal,
    });

  async function run(next: NosaMessage) {
    error.value = null;
    const messages = [...history.value, next];
    history.value = messages;
    live.value = { text: "", steps: [] };
    controller = new AbortController();

    try {
      if (!(await Session.doesSessionExist())) throw new Error(NOT_CONNECTED);
      const response = await post(messages);
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Nosa answered ${response.status}`);
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const parsed = parseSse(buffer + value);
        buffer = parsed.rest;
        for (const event of parsed.events) {
          const state = live.value!;
          if (event.type === "delta") state.text += event.delta;
          else if (event.type === "tool-call") state.steps.push({ callId: event.callId, name: event.name, state: "running" });
          else if (event.type === "tool-result") {
            const step = state.steps.find((s) => s.callId === event.callId);
            if (step) step.state = event.failed ? "failed" : "done";
          } else if (event.type === "done") history.value = [...messages, ...event.messages];
          else if (event.type === "error") error.value = event.error;
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") error.value = (err as Error).message;
    } finally {
      live.value = null;
      controller = null;
    }
  }

  return {
    enabled: Boolean(nosaUrl),
    history,
    live,
    busy,
    error,
    pending,
    send: (text: string) => run({ role: "user", content: text }),
    answer: (approvalId: string, approved: boolean) =>
      run({ role: "tool", content: [{ type: "tool-approval-response", approvalId, approved }] }),
    stop: () => controller?.abort(),
    reset: () => {
      controller?.abort();
      history.value = [];
      error.value = null;
    },
  };
}
