import type {
  TerminalSession,
  TerminalStatus as KitTerminalStatus,
} from "@nosana/api";
import { useLatestRequest } from "../useLatestRequest";
import { getNodeJob } from "~/utils/kitJobAccess";
import { translateTerminalError } from "~/utils/sshAccess";

export type TerminalStatus = "idle" | KitTerminalStatus;

export type TerminalConnectOptions = {
  cols: number;
  rows: number;
  op?: string;
  onData: (data: Uint8Array) => void;
  onStatus: (status: TerminalStatus, detail?: string) => void;
  onExit?: (code: number | null) => void;
};

/** Thin Vue lifecycle adapter around the framework-independent Kit terminal. */
export function useJobTerminal(jobAddress: string, deploymentId?: string) {
  const { nosana } = useKit();
  const attempts = useLatestRequest();
  const status = ref<TerminalStatus>("idle");
  const session = shallowRef<TerminalSession | null>(null);
  let abortController: AbortController | null = null;

  const closeConnection = (nextStatus: TerminalStatus = "closed") => {
    attempts.cancel();
    abortController?.abort();
    abortController = null;
    session.value?.close();
    session.value = null;
    status.value = nextStatus;
  };

  const connect = async (options: TerminalConnectOptions) => {
    closeConnection("idle");
    const attempt = attempts.begin();
    const controller = new AbortController();
    abortController = controller;

    try {
      status.value = "authorizing";
      options.onStatus("authorizing");
      const job = await getNodeJob(nosana.value.api, jobAddress, deploymentId);
      controller.signal.throwIfAborted();
      const terminalSession = await job.terminal({
        op: options.op,
        cols: options.cols,
        rows: options.rows,
        signal: controller.signal,
        onData: options.onData,
        onExit: options.onExit,
        onStatus: (nextStatus, detail) => {
          if (!attempts.isCurrent(attempt)) return;
          status.value = nextStatus;
          options.onStatus(nextStatus, detail);
        },
      });

      if (!attempts.isCurrent(attempt)) {
        terminalSession.close();
        return;
      }
      session.value = terminalSession;
    } catch (error) {
      if (!attempts.isCurrent(attempt) || controller.signal.aborted) return;
      const detail = translateTerminalError(error);
      status.value = "error";
      options.onStatus("error", detail);
    }
  };

  const sendInput = (data: string) => session.value?.sendInput(data);
  const resize = (cols: number, rows: number) =>
    session.value?.resize(cols, rows);

  onScopeDispose(() => closeConnection("idle"));

  return {
    status,
    connect,
    sendInput,
    resize,
    closeConnection,
  };
}
