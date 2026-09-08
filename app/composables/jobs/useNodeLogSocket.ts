import { getCurrentScope, onScopeDispose, ref } from "vue";
import type {
  NodeStreamHandlers,
  NodeStreamSubscription,
  NodeTaskLog,
} from "@nosana/api";
import { useLatestRequest } from "../useLatestRequest";

type OpenLogSocket = (
  handlers: NodeStreamHandlers<NodeTaskLog>,
) => Promise<NodeStreamSubscription>;

const FIRST_FRAME_TIMEOUT_MS = 10_000;

/**
 * A node log socket with the dashboard's connection policy: "connecting" until
 * the first frame arrives, a bounded number of retries while nothing has
 * arrived yet (the node or CVM may still be starting), and none after that,
 * which is how the log views treat a stream that ends.
 */
export function useNodeLogSocket(
  open: OpenLogSocket,
  onLog: (log: NodeTaskLog) => void,
  maxRetries = 3,
  retryDelay = 3000,
) {
  const isConnecting = ref(false);
  const connectionEstablished = ref(false);
  const attempts = useLatestRequest();
  let subscription: NodeStreamSubscription | null = null;
  let firstFrameTimer: ReturnType<typeof setTimeout> | null = null;
  let retries = 0;

  const clearFirstFrameTimer = () => {
    if (firstFrameTimer) clearTimeout(firstFrameTimer);
    firstFrameTimer = null;
  };

  const dropSocket = () => {
    clearFirstFrameTimer();
    subscription?.close();
    subscription = null;
  };

  const scheduleRetry = (attempt: number) => {
    if (!attempts.isCurrent(attempt) || connectionEstablished.value) return;
    const next = attempts.begin();
    dropSocket();
    if (retries >= maxRetries) {
      isConnecting.value = false;
      return;
    }
    retries += 1;
    setTimeout(() => {
      if (attempts.isCurrent(next)) void connect(next);
    }, retryDelay);
  };

  const connect = async (attempt: number) => {
    isConnecting.value = true;
    connectionEstablished.value = false;
    firstFrameTimer = setTimeout(() => scheduleRetry(attempt), FIRST_FRAME_TIMEOUT_MS);
    try {
      const opened = await open({
        onData: (log) => {
          if (!attempts.isCurrent(attempt)) return;
          clearFirstFrameTimer();
          connectionEstablished.value = true;
          isConnecting.value = false;
          retries = 0;
          onLog(log);
        },
        onError: () => scheduleRetry(attempt),
        onClose: () => scheduleRetry(attempt),
      });
      if (!attempts.isCurrent(attempt)) {
        opened.close();
        return;
      }
      subscription = opened;
    } catch {
      scheduleRetry(attempt);
    }
  };

  const initConnection = () => {
    if (isConnecting.value || connectionEstablished.value) return;
    retries = 0;
    void connect(attempts.begin());
  };

  const closeConnection = () => {
    attempts.cancel();
    dropSocket();
    isConnecting.value = false;
    connectionEstablished.value = false;
  };

  if (getCurrentScope()) onScopeDispose(closeConnection);

  return { isConnecting, connectionEstablished, initConnection, closeConnection };
}
