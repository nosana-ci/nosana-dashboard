import { useRuntimeConfig } from "#imports";

export function useJobWebSocket(
  jobAddress: string,
  host: string,
  signMessage: () => Promise<string>,
  addLog: (log: string) => void,
  handleProgressEvent: (event: MessageEvent) => void
) {
  const frpServer = useRuntimeConfig().public.nodeDomain;
  const websocketUrl = `wss://${host}.${frpServer}/log`;

  const isConnecting = ref<boolean>(false);
  const webSocket = ref<WebSocket | undefined>(undefined);

  const initConnection = () => {
    if (webSocket.value && webSocket.value.OPEN) return;

    let connectionTimeout: NodeJS.Timeout;
    const socket = new WebSocket(websocketUrl);

    socket.onopen = async () => {
      isConnecting.value = true;

      connectionTimeout = setTimeout(() => {
        if (isConnecting) {
          socket.close();
          isConnecting.value = false;
          addLog(
            "Could not establish WebSocket connection to get the logs. The node may be offline."
          );
        }
      }, 10000);

      try {
        const header = await signMessage();

        socket.send(
          JSON.stringify({
            path: "/log",
            header,
            body: {
              jobAddress,
              address: host,
            },
          })
        );
      } catch {
        clearTimeout(connectionTimeout);
        isConnecting.value = false;
        // TODO: Add error
      }
    };

    socket.onmessage = (event: MessageEvent) => {
      isConnecting.value = false;
      clearTimeout(connectionTimeout);

      handleProgressEvent(event);
    };

    socket.onclose = () => {
      clearTimeout(connectionTimeout);
      webSocket.value = undefined;

      if (isConnecting.value) {
        addLog(
          "WebSocket connection closed. Could not establish connection to get the logs."
        );
      }

      isConnecting.value = false;
    };

    socket.onerror = async () => {
      clearTimeout(connectionTimeout);
      webSocket.value = undefined;
      isConnecting.value = false;

      addLog(
        "Error establishing coonect to WebSocket. The node may be offline."
      );

      // TODO: Add retry event attempts with sleep
    };

    webSocket.value = socket;
  };

  const closeConnection = () => {
    if (webSocket.value && webSocket.value.OPEN) {
      webSocket.value.close();
      webSocket.value = undefined;
    }
  };

  return {
    isConnecting,
    initConnection,
    closeConnection,
  };
}
