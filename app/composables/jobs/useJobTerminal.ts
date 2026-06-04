import { walletToAuthorizationSigner } from "@nosana/kit";
import { useRuntimeConfig } from "#imports";

const TERMINAL_AUTHORIZATION_HEADER = "Nosana Terminal Authorization v1";
const TERMINAL_AUTHORIZATION_AUDIENCE = "nosana-web-terminal";
// Node enforces a 5 minute max TTL; stay comfortably under it to absorb clock skew.
const TERMINAL_GRANT_TTL_MS = 4 * 60 * 1000;

export type TerminalStatus =
  | "idle"
  | "authorizing"
  | "connecting"
  | "connected"
  | "closed"
  | "error";

export type TerminalConnectOptions = {
  cols: number;
  rows: number;
  op?: string;
  onData: (data: Uint8Array) => void;
  onStatus: (status: TerminalStatus, detail?: string) => void;
  onExit?: (code: number | null) => void;
};

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function buildTerminalAuthorizationMessage({
  job,
  node,
  expiresAt,
  op,
  network,
}: {
  job: string;
  node: string;
  expiresAt: string;
  op?: string;
  network: string;
}): string {
  const lines = [
    TERMINAL_AUTHORIZATION_HEADER,
    "",
    `job: ${job}`,
    `node: ${node}`,
    `expiresAt: ${expiresAt}`,
  ];

  if (op) {
    lines.push(`op: ${op}`);
  }

  lines.push(`network: ${network}`);
  lines.push(`audience: ${TERMINAL_AUTHORIZATION_AUDIENCE}`);

  return lines.join("\n");
}

/**
 * Opens a wallet-authorized interactive terminal session to a job's container.
 *
 * The wallet (job poster) signs a short-lived "Nosana Terminal Authorization"
 * grant; the node validates the signature against the job's project before
 * exec-ing a PTY into the container. No SSH key is involved.
 */
export function useJobTerminal(
  jobAddress: string,
  node: string | Ref<string>,
) {
  const config = useRuntimeConfig();
  const nodeDomain = config.public.nodeDomain as string;
  const network = (config.public.network as string) ?? "mainnet";

  const { nosana } = useKit();

  const status = ref<TerminalStatus>("idle");
  const socket = ref<WebSocket | undefined>(undefined);

  const signGrant = async (op?: string): Promise<{ message: string; signature: string }> => {
    const nodeAddress = typeof node === "string" ? node : node.value;
    if (!nodeAddress || nodeAddress === "11111111111111111111111111111111") {
      throw new Error("Job has no assigned node");
    }

    const wallet = nosana.value.wallet;
    if (!wallet) {
      throw new Error("Connect your wallet to open a terminal");
    }

    const expiresAt = new Date(Date.now() + TERMINAL_GRANT_TTL_MS).toISOString();
    const message = buildTerminalAuthorizationMessage({
      job: jobAddress,
      node: nodeAddress,
      expiresAt,
      op,
      network,
    });

    const signFn = walletToAuthorizationSigner(wallet);
    const signatureBytes = await signFn(new TextEncoder().encode(message));

    return { message, signature: uint8ToBase64(signatureBytes) };
  };

  const connect = async (options: TerminalConnectOptions): Promise<void> => {
    closeConnection();

    const nodeAddress = typeof node === "string" ? node : node.value;

    let grant: { message: string; signature: string };
    try {
      status.value = "authorizing";
      options.onStatus("authorizing");
      grant = await signGrant(options.op);
    } catch (error) {
      status.value = "error";
      options.onStatus(
        "error",
        error instanceof Error ? error.message : "Failed to authorize terminal",
      );
      return;
    }

    status.value = "connecting";
    options.onStatus("connecting");

    const url = `wss://${nodeAddress}.${nodeDomain}/terminal`;
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    socket.value = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          path: "/terminal",
          body: {
            jobAddress,
            message: grant.message,
            signature: grant.signature,
            op: options.op,
            cols: options.cols,
            rows: options.rows,
          },
        }),
      );
      status.value = "connected";
      options.onStatus("connected");
    };

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === "string") {
        try {
          const parsed = JSON.parse(event.data) as {
            type?: string;
            code?: number | null;
            message?: string;
          };
          if (parsed.type === "exit") {
            options.onExit?.(parsed.code ?? null);
          } else if (parsed.type === "error") {
            options.onStatus("error", parsed.message);
          }
        } catch {
          // Non-JSON text frame: treat as terminal output.
          options.onData(new TextEncoder().encode(event.data));
        }
        return;
      }

      options.onData(new Uint8Array(event.data as ArrayBuffer));
    };

    ws.onclose = (event: CloseEvent) => {
      socket.value = undefined;
      if (status.value !== "error") {
        status.value = "closed";
        options.onStatus("closed", event.reason || undefined);
      }
    };

    ws.onerror = () => {
      if (status.value !== "error") {
        status.value = "error";
        options.onStatus("error", "Terminal connection error");
      }
    };
  };

  const sendInput = (data: string): void => {
    const ws = socket.value;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "stdin", data }));
  };

  const resize = (cols: number, rows: number): void => {
    const ws = socket.value;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "resize", cols, rows }));
  };

  const closeConnection = (): void => {
    const ws = socket.value;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      try {
        ws.close();
      } catch {
        // best effort
      }
      socket.value = undefined;
    }
  };

  return {
    status,
    connect,
    sendInput,
    resize,
    closeConnection,
  };
}
