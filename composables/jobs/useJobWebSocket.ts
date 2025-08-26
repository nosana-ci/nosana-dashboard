import { useRuntimeConfig } from "#imports";

export function useJobWebSocket(
  jobAddress: string,
  host: string | Ref<string>,
  getAuth: () => Promise<string | Headers>,
  addLog: (log: string, isSystemLog: boolean) => void,
  handleProgressEvent: (event: MessageEvent) => void,
  maxRetries = 3,
  retryDelay = 3000
) {
  const frpServer = useRuntimeConfig().public.nodeDomain;

  const isConnecting = ref<boolean>(false);
  const webSocket = ref<WebSocket | undefined>(undefined);
  const retryCount = ref<number>(0);
  const connectionEstablished = ref<boolean>(false);
  const allowRetry = ref<boolean>(true);

  const initConnection = () => {
    // Avoid interrupting an in-flight connection attempt
    if (isConnecting.value) return;
    if (webSocket.value && webSocket.value.readyState === WebSocket.CONNECTING) return;
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

    const currentHost = typeof host === 'string' ? host : host.value;
    // Guard: do not attempt when host is placeholder or empty
    if (!currentHost || currentHost === '11111111111111111111111111111111') {
      isConnecting.value = false;
      connectionEstablished.value = false;
      return;
    }

    const websocketUrl = `wss://${currentHost}.${frpServer}/log`;
    let connectionTimeout: NodeJS.Timeout;
    const socket = new WebSocket(websocketUrl);
    isConnecting.value = true;
    allowRetry.value = true;

    socket.onopen = async () => {
      try {
        const auth = await getAuth();
        const header = auth instanceof Headers ? (auth.get('Authorization') || auth.get('authorization') || '') : auth;
        
        connectionTimeout = setTimeout(() => {
          if (!connectionEstablished.value) {
            // mark no auto-retry for this close; we'll retry via handleRetry
            allowRetry.value = true;
            try { socket.close(); } catch {}
            handleRetry("Connection timed out");
          }
        }, 10000);

        const payload = {
          path: "/log",
          headers: { Authorization: header },
          header, // legacy field
          body: {
            jobAddress,
            address: currentHost,
          },
        };
        socket.send(JSON.stringify(payload));
      } catch (error) {
        clearTimeout(connectionTimeout);
        allowRetry.value = true;
        try { socket.close(); } catch {}
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
        // console.log('[ws] message', event.data);
        handleProgressEvent(event);
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      clearTimeout(connectionTimeout);
      webSocket.value = undefined;
      
      if (allowRetry.value && !connectionEstablished.value) {
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
      addLog(`${reason}. Retrying connection (${retryCount.value}/${maxRetries})...`, true);
      
      setTimeout(() => {
        // prevent re-entrant connects
        if (isConnecting.value) return;
        connectWebSocket();
      }, retryDelay);
    } else {
      addLog(`Could not establish WebSocket connection after ${maxRetries} attempts. The node may be offline.`, true);
      isConnecting.value = false;
    }
  };

  const closeConnection = () => {
    if (webSocket.value) {
      allowRetry.value = false;
      webSocket.value.close();
      webSocket.value = undefined;
    }
    connectionEstablished.value = false;
    isConnecting.value = false;
  };

  return {
    isConnecting,
    connectionEstablished,
    initConnection,
    closeConnection,
  };
}
