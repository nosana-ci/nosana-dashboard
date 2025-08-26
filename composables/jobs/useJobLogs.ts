import { ref } from "vue";
import AnsiUp from "ansi_up";
import { useJobWebSocket } from "./useJobWebSocket";
import type { Endpoints } from "./useJob";
import { escapeHtml, sanitizeAnsiHtml } from "~/utils/htmlSanitization";

export interface ProgressBar {
  id: string;
  current: number;
  total: number;
  currentDisplay: number;
  totalDisplay: number;
  status: string;
  currentFormat: string;
  totalFormat: string;
  completed: boolean;
}

export interface LogEntry {
  id: number;
  type: "log" | "progress";
  content: string;
  timestamp: number;
  html?: boolean;
  isContainerLog?: boolean;
}

// Monotonic id to avoid duplicate keys when logs arrive within the same ms
let logSequence = 0;

export function useJobLogs(
  jobAddress: string,
  host: string | Ref<string>,
  endpoints: Endpoints,
  shouldConnect: ComputedRef<boolean>,
  getAuth: () => Promise<string | Headers>
) {
  const systemLogs = ref<LogEntry[]>([]);
  const containerLogs = ref<LogEntry[]>([]);
  const progressBars = ref<Map<string, ProgressBar>>(new Map());
  const resourceProgressBars = ref<Map<string, any>>(new Map());
  const hasShownServiceOnlineToast = ref(false);

  const ansi = new AnsiUp();

  const { isConnecting, connectionEstablished, initConnection, closeConnection } = useJobWebSocket(
    jobAddress,
    host,
    getAuth,
    addLog,
    handleWebSocketMessage,
    3, // maxRetries
    3000 // retryDelay
  );

  // Configure ansi_up
  ansi.use_classes = true;


  function convertFromBytes(
    bytes: number,
    toFormat?: "gb" | "mb" | "kb"
  ): { value: number; format: "gb" | "mb" | "kb" } {
    let value = bytes / 1024;

    if ((value < 1024 && !toFormat) || toFormat === "kb") {
      return { value: Number(value.toFixed(2)), format: "kb" };
    }

    value = value / 1024;

    if ((value < 1024 && !toFormat) || toFormat === "mb") {
      return { value: Number(value.toFixed(2)), format: "mb" };
    }

    return { value: Number((value / 1024).toFixed(2)), format: "gb" };
  }

  function addLog(content: string, isSystemLog: boolean) {
    // For container logs, strip the 8-byte Docker log header which contains stream type and size.
    // This cleans up noise like `u0001u0000u0000u0000u0000u0000u0000aINFO...` -> `INFO...`
    if (!isSystemLog && content.length > 8) {
      content = content.substring(8);
    }

    // Convert ANSI to HTML
    let processedContent = ansi.ansi_to_html(content);

    // Wrap known status lines for clearer styling
    if (
      content.startsWith("Download complete:") ||
      content.startsWith("Already exists:") ||
      content.startsWith("Pull complete:")
    ) {
      processedContent = `<span class="download-status">${escapeHtml(content)}</span>`;
    } else {
      // Sanitize ansi_up output
      processedContent = sanitizeAnsiHtml(processedContent);
    }

    const logEntry: LogEntry = {
      id: ++logSequence,
      type: "log",
      content: processedContent,
      timestamp: Date.now(),
      html: true,
      isContainerLog: !isSystemLog,
    };
    
    // Don't add duplicate consecutive logs
    const targetArray = isSystemLog ? systemLogs.value : containerLogs.value;
    const lastLog = targetArray[targetArray.length - 1];
    const stripHtml = (s: string) => s.replace(/<[^>]+>/g, "");
    if (
      lastLog?.type === "log" &&
      stripHtml(lastLog.content) === stripAnsi(content)
    ) {
      return;
    }

    if (isSystemLog) {
      systemLogs.value.push(logEntry);
    } else {
      containerLogs.value.push(logEntry);
    }
  }

  function handleProgressEvent(event: any) {
    const { id: layerId, status, progressDetail } = event;

    // Handle completion states
    if (
      ["Download complete", "Pull complete", "Already exists"].includes(status)
    ) {
      addLog(`${status}: ${layerId}`, true);
      const bar = progressBars.value.get(layerId);
      if (bar) {
        bar.completed = true;
        bar.current = bar.total;
        bar.status = status;
        setTimeout(() => {
          progressBars.value.delete(layerId);
        }, 1000); // Remove completed bars after 1 second
      }
      return;
    }

    // Handle active download states, resource progress, and pulling layers
    if (
      ["Downloading", "Extracting", "Resource", "Pulling fs layer"].includes(
        status
      )
    ) {
      const current = progressDetail?.current || 0;
      const total = progressDetail?.total || 1; // Use 1 as total for pulling layer to show indeterminate progress
      const { value: currentValue, format: currentFormat } =
        convertFromBytes(current);
      const { value: totalValue, format: totalFormat } =
        convertFromBytes(total);

      let bar = progressBars.value.get(layerId);
      if (!bar) {
        bar = {
          id: layerId,
          current: status === "Pulling fs layer" ? 0 : current,
          total: status === "Pulling fs layer" ? 1 : total,
          currentDisplay: currentValue,
          totalDisplay: totalValue,
          status,
          currentFormat: currentFormat.toUpperCase(),
          totalFormat: totalFormat.toUpperCase(),
          completed: false,
        };
        progressBars.value.set(layerId, bar);
      } else {
        bar.current = status === "Pulling fs layer" ? 0 : current;
        bar.total = status === "Pulling fs layer" ? 1 : total;
        bar.currentDisplay = currentValue;
        bar.totalDisplay = totalValue;
        bar.status = status;
        bar.currentFormat = currentFormat.toUpperCase();
        bar.totalFormat = totalFormat.toUpperCase();
      }
    }
  }

  function stripAnsi(str: string): string {
    if (!str) return '';
    return str.replace(
      /\u001b\[\d+m|\u001b\[\d+;\d+m|\u001b\[0m|\u001b\[1m|\u001b\[22m/g,
      ""
    );
  }

  function handleWebSocketMessage(event: MessageEvent) {
    try {
      const outerData = JSON.parse(event.data);
      const logData = outerData.data ? JSON.parse(outerData.data) : outerData;
      if (!logData) return;

      // Set connecting to false when we receive any message
      isConnecting.value = false;

      if (
        (logData.type === "multi-process-bar-update" ||
          logData.method === "MultiProgressBarReporter.update") &&
        logData.payload?.event
      ) {
        handleProgressEvent(logData.payload.event);
        return;
      }

      if (logData.log) {
        const isSystemLog = logData.method !== 'NodeRepository.displayLog';
        let logContent = logData.log;

        // Apply colors to system logs based on the 'type' field from the websocket message.
        if (isSystemLog && logData.type) {
          const colorMap: { [key: string]: string } = {
            success: '\u001b[32m', // Green
            process: '\u001b[36m', // Cyan
            info:    '\u001b[36m', // Cyan
            stop:    '\u001b[36m', // Cyan
          };
          const color = colorMap[logData.type];
          if (color) {
            logContent = `${color}${logContent}\u001b[0m`;
          }
        }
        addLog(logContent, isSystemLog);

        // Only check for service online toast on system logs, as that's where the frpc message appears.
        if (isSystemLog) {
          const cleanLog = stripAnsi(logData.log);

          const exposedMatch =
            cleanLog.match(/Job .* is now exposed \((https:\/\/[^)]+)\)/) ||
            cleanLog.match(/Service exposed at: (https:\/\/[^)\s]+)/);

          if (exposedMatch && !hasShownServiceOnlineToast.value) {
            const url = exposedMatch[1];
            const endpoint = endpoints.get(url);
            if (endpoint) {
              endpoint.setStatus("ONLINE");
              hasShownServiceOnlineToast.value = true;
            }
          }
        }
      }

      if (!logData.method?.startsWith("ProgressBarReporter")) return;

      switch (logData.method) {
        case "ProgressBarReporter.start": {
          if (logData.type !== "process-bar-start") return;

          resourceProgressBars.value.set("resource", {
            id: "resource",
            status: "Downloading Resource",
            current: 0,
            total: logData.payload?.total ?? 0,
            completed: false,
          });
          break;
        }
        case "ProgressBarReporter.update": {
          if (logData.type !== "process-bar-update") return;

          const bar = resourceProgressBars.value.get("resource");
          if (bar && !bar.completed) {
            bar.current = logData.payload?.current ?? bar.current;
            if (bar.total && bar.current >= bar.total) {
              bar.completed = true;
            }
          }
          break;
        }
        case "ProgressBarReporter.stop": {
          if (logData.type !== "process-bar-stop") return;
          resourceProgressBars.value.delete("resource");
          break;
        }
      }
    } catch (err) {
      console.error("Error parsing log data:", err);
    }
  }

  function closeLogs() {
    closeConnection();
  }

  function initLogs() {
    initConnection();
  }

  // Single watcher to manage connection lifecycle
  let closeDebounce: ReturnType<typeof setTimeout> | null = null;
  watch(shouldConnect, (next) => {
    if (next) {
      if (closeDebounce) {
        clearTimeout(closeDebounce);
        closeDebounce = null;
      }
      initConnection();
    } else {
      if (closeDebounce) clearTimeout(closeDebounce);
      closeDebounce = setTimeout(() => {
        if (!shouldConnect.value) closeConnection();
        closeDebounce = null;
      }, 500);
    }
  }, { immediate: true });

  return {
    systemLogs,
    containerLogs,
    progressBars,
    isConnecting,
    connectionEstablished,
    resourceProgressBars,
    initLogs,
    closeLogs,
  };
}

