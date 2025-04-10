import { useRuntimeConfig } from "#imports";

export function useJobWebSocket(
  jobAddress: string,
  host: string,
  signMessage: () => Promise<string>,
  addLog: (log: string) => void,
  handleProgressEvent: (event: MessageEvent) => void,
  maxRetries = 3,
  retryDelay = 3000
) {
  const frpServer = useRuntimeConfig().public.nodeDomain;
  const websocketUrl = `wss://${host}.${frpServer}/log`;

  const isConnecting = ref<boolean>(false);
  const webSocket = ref<WebSocket | undefined>(undefined);
  const retryCount = ref<number>(0);
  const connectionEstablished = ref<boolean>(false);

  const initConnection = () => {
    if (webSocket.value && webSocket.value.readyState === WebSocket.OPEN && connectionEstablished.value) return;
    
    retryCount.value = 0;
    connectionEstablished.value = false;
    connectWebSocket();
  };

  const connectWebSocket = () => {
    if (webSocket.value) {
      webSocket.value.close();
      webSocket.value = undefined;
    }

    let connectionTimeout: NodeJS.Timeout;
    const socket = new WebSocket(websocketUrl);
    isConnecting.value = true;

    socket.onopen = async () => {
      try {
        const header = await signMessage();
        
        connectionTimeout = setTimeout(() => {
          if (!connectionEstablished.value) {
            socket.close();
            handleRetry("Connection timed out");
          }
        }, 10000);

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
      } catch (error) {
        clearTimeout(connectionTimeout);
        socket.close();
        handleRetry("Failed to sign message");
      }
    };

    socket.onmessage = (event: MessageEvent) => {
      try {
        // Mark connection as successful on first message
        connectionEstablished.value = true;
        isConnecting.value = false;
        clearTimeout(connectionTimeout);
        retryCount.value = 0;
        handleProgressEvent(event);
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      clearTimeout(connectionTimeout);
      webSocket.value = undefined;
      
      if (isConnecting.value && !connectionEstablished.value) {
        handleRetry("WebSocket connection closed unexpectedly");
      }
      
      isConnecting.value = false;
    };

    socket.onerror = () => {
      clearTimeout(connectionTimeout);
      webSocket.value = undefined;
      isConnecting.value = false;
      
      if (!connectionEstablished.value) {
        handleRetry("Error establishing connection to WebSocket");
      }
    };

    webSocket.value = socket;
  };

  const handleRetry = (reason: string) => {
    retryCount.value += 1;
    
    if (retryCount.value <= maxRetries) {
      addLog(`${reason}. Retrying connection (${retryCount.value}/${maxRetries})...`);
      
      setTimeout(() => {
        connectWebSocket();
      }, retryDelay);
    } else {
      addLog(`Could not establish WebSocket connection after ${maxRetries} attempts. The node may be offline.`);
      isConnecting.value = false;
    }
  };

  const closeConnection = () => {
    if (webSocket.value) {
      webSocket.value.close();
      webSocket.value = undefined;
    }
    connectionEstablished.value = false;
    isConnecting.value = false;
  };

  return {
    isConnecting,
    initConnection,
    closeConnection,
  };
}
