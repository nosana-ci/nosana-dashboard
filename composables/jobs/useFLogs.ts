import { ref, computed, watch, type ComputedRef, type Ref } from "vue";
import AnsiUp from "ansi_up";
import { sanitizeAnsiHtml, escapeHtml } from "~/utils/htmlSanitization";
import type { ProgressBar } from "./logTypes";
import { useJobWebSocket } from "./useJobWebSocket";

export type FLogType = 'container' | 'info' | 'error';

export interface FLogMessage {
  opId: string;
  group: string;
  type: FLogType;
  timestamp?: number;
  message: string;
}

export interface FLogEntry {
  id: number;
  content: string; // already sanitized HTML with timestamp prefix
  timestamp: number;
  html: true;
}

export function useFLogs(
  jobAddress: string,
  host: string | Ref<string>,
  shouldConnect: ComputedRef<boolean>,
  getAuth: () => Promise<string | Headers>
) {
  const ansi = new AnsiUp();
  ansi.use_classes = true;

  // Tabs: 'system' first, followed by opIds in first-seen order
  const tabs = ref<string[]>(['system']);
  const activeTab = ref<string>('system');

  const systemLogs = ref<FLogEntry[]>([]);
  const logsByOp = ref<Map<string, FLogEntry[]>>(new Map());

  const isConnecting = ref<boolean>(false);
  const connectionEstablished = ref<boolean>(false);

  // Progress bars (multi-process/docker layer) similar to legacy implementation
  const progressBars = ref<Map<string, ProgressBar>>(new Map());
  const resourceProgressBars = ref<Map<string, any>>(new Map());

  // Deduplication structures to avoid duplicates after reconnects/tab switches
  const seenFingerprints = new Set<string>();
  const seenQueue: string[] = [];
  const MAX_SEEN = 50000;
  function remember(fp: string) {
    if (seenFingerprints.has(fp)) return;
    seenFingerprints.add(fp);
    seenQueue.push(fp);
    if (seenQueue.length > MAX_SEEN) {
      // Drop oldest 10k to amortize cost
      const drop = seenQueue.splice(0, 10000);
      for (const k of drop) seenFingerprints.delete(k);
    }
  }
  function normalizeText(s: string): string {
    return (s || '').replace(/\s+/g, ' ').trim();
  }
  function fingerprint(opId: string, type: string, ts: number | undefined, message: string): string {
    return `${opId}|${type}|${ts || ''}|${normalizeText(message)}`;
  }
  // Track completed layers to avoid repeating completion lines
  const seenCompletedLayers = new Set<string>();

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

  function handleProgressEvent(event: any) {
    const { id: layerId, status, progressDetail } = event || {};
    if (!status) return;

    // Completion states
    if (["Download complete", "Pull complete", "Already exists"].includes(status)) {
      // Emit a system log line like legacy (once per layer)
      if (layerId && !seenCompletedLayers.has(`${status}|${layerId}`)) {
        seenCompletedLayers.add(`${status}|${layerId}`);
        addMessage({ opId: 'system', group: 'main', type: 'info', message: `${status}: ${layerId}`, timestamp: Date.now() });
      }
      const bar = progressBars.value.get(layerId);
      if (bar) {
        bar.completed = true;
        bar.current = bar.total;
        bar.status = status;
        setTimeout(() => {
          progressBars.value.delete(layerId);
        }, 1000);
      }
      return;
    }

    if (["Downloading", "Extracting", "Resource", "Pulling fs layer"].includes(status)) {
      const current = progressDetail?.current || 0;
      const total = progressDetail?.total || (status === "Pulling fs layer" ? 1 : 0);
      const { value: currentValue, format: currentFormat } = convertFromBytes(current);
      const { value: totalValue, format: totalFormat } = convertFromBytes(total);

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
        } as ProgressBar;
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

  let seq = 0;

  function ensureOp(opId: string) {
    if (!logsByOp.value.has(opId)) {
      logsByOp.value.set(opId, []);
      // Register tab in first-seen order
      tabs.value = Array.from(new Set([...tabs.value, opId]));
      
      // Auto-switch to first operation tab when available (if still on system)
      if (activeTab.value === 'system' && opId !== 'system') {
        activeTab.value = opId;
      }
    }
  }

  function formatTimestamp(ts: number) {
    const d = new Date(ts);
    const pad = (n: number, w = 2) => n.toString().padStart(w, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
  }

  function toHtml(message: string): string {
    const colored = ansi.ansi_to_html(message);
    return sanitizeAnsiHtml(colored);
  }

  function colorizeByTypeIfNeeded(message: string, type: FLogType): string {
    if (type === 'container') return message;
    // Map system/info/error to ANSI colors used by legacy viewer
    const colorMap: Record<FLogType | 'success' | 'process', string> = {
      info: '\u001b[36m',      // cyan
      error: '\u001b[31m',     // red
      container: '',
      success: '\u001b[32m',   // green (not standard in flog but keep parity)
      process: '\u001b[36m',   // cyan
    } as any;
    const code = colorMap[type] || '';
    return code ? `${code}${message}\u001b[0m` : message;
  }

  function isDownloadStatusLine(text: string): boolean {
    return (
      text.startsWith("Download complete:") ||
      text.startsWith("Already exists:") ||
      text.startsWith("Pull complete:")
    );
  }

  function deriveSystemColorType(message: string, existing: FLogType): 'info' | 'error' | 'success' {
    if (existing === 'error') return 'error';
    const m = message.toLowerCase();
    if (
      m.includes('started successfully') ||
      m.startsWith('pulled image') ||
      m.startsWith('created network') ||
      m.startsWith('running container') ||
      m.startsWith('operation started') ||
      m.includes('service url exposed') ||
      isDownloadStatusLine(message)
    ) {
      return 'success';
    }
    if (m.includes('error') || m.includes('failed') || m.includes('unhealthy')) return 'error';
    return 'info';
  }

  function addMessage(msg: FLogMessage) {
    const ts = msg.timestamp || Date.now();
    const derived = msg.type === 'container' ? 'container' : deriveSystemColorType(msg.message, msg.type);
    let stampedContent = '';

    // Global dedup (avoids re-adding after reconnect history replay)
    const fp = fingerprint(msg.opId, derived, msg.timestamp, msg.message);
    if (seenFingerprints.has(fp)) {
      return;
    }

    if (isDownloadStatusLine(msg.message)) {
      stampedContent = `<span class=\"download-status\">${escapeHtml(msg.message)}</span>`;
    } else {
      const raw = colorizeByTypeIfNeeded(msg.message, derived as FLogType);
      stampedContent = toHtml(raw);
    }

    const stamped = `<span class=\"timestamp\">[${escapeHtml(formatTimestamp(ts))}]</span> ${stampedContent}`;
    const entry: FLogEntry = {
      id: ++seq,
      content: stamped,
      timestamp: ts,
      html: true,
    };

    if (msg.type === 'container') {
      ensureOp(msg.opId);
      const arr = logsByOp.value.get(msg.opId)!;
      arr.push(entry);
      capArray(arr, 20000);
    } else {
      const arr = systemLogs.value;
      if (arr.length === 0 || arr[arr.length - 1].timestamp <= entry.timestamp) {
        arr.push(entry);
      } else {
        // Insert in timestamp order (stable-ish by scanning backward; arrays are usually near-sorted)
        let i = arr.length - 1;
        while (i >= 0 && arr[i].timestamp > entry.timestamp) i--;
        arr.splice(i + 1, 0, entry);
      }
      capArray(arr, 20000);
    }

    // remember fingerprint after successful add
    remember(fp);
  }

  function capArray<T>(arr: T[], max: number) {
    if (arr.length > max) {
      arr.splice(0, arr.length - max);
    }
  }

  function isFlogShape(obj: any): obj is FLogMessage {
    if (!obj || typeof obj !== 'object') return false;
    const validType = obj.type === 'container' || obj.type === 'info' || obj.type === 'error';
    return (
      typeof obj.opId === 'string' &&
      typeof obj.group === 'string' &&
      validType &&
      typeof obj.message === 'string'
    );
  }

  // WebSocket wiring
  const {
    isConnecting: wsConnecting,
    connectionEstablished: wsEstablished,
    initConnection,
    closeConnection,
  } = useJobWebSocket(
    jobAddress,
    host,
    getAuth,
    // Suppress frontend connection/retry noise entirely for flogs
    (_log: string) => {},
    // onMessage
    (event: MessageEvent) => {
      try {
        const outer = JSON.parse(event.data);
        const inner = outer.data ? JSON.parse(outer.data) : outer;
        // Debug incoming shape
        console.debug('[useFLogs] ws message received', { path: (outer as any)?.path, innerKeys: inner && typeof inner === 'object' ? Object.keys(inner) : typeof inner });
        // First, handle embedded progress events regardless of shape
        let possibleMsg = (inner && typeof inner === 'object') ? (inner as any).message : undefined;
        // If message is a JSON string representing a progress event, parse it
        if (possibleMsg && typeof possibleMsg === 'string' && possibleMsg.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(possibleMsg);
            if (parsed && typeof parsed === 'object') {
              possibleMsg = parsed;
            }
          } catch {}
        }
        // Handle resource progress bar messages (process-bar-start, process-bar-update, process-bar-stop)
        if (possibleMsg && typeof possibleMsg === 'object' && possibleMsg.type === 'process-bar-start') {
          const payload = possibleMsg.payload;
          if (payload) {
            const total = payload.total || 100;
            const startValue = payload.startValue || 0;
            const bar = {
              id: 'resource-download',
              current: startValue,
              total: total,
              currentDisplay: startValue,
              totalDisplay: total,
              status: 'Resource',
              currentFormat: '',
              totalFormat: '',
              completed: false,
              metadata: payload.payload || {},
            };
            resourceProgressBars.value.set('resource-download', bar);
          }
          return;
        }
        if (possibleMsg && typeof possibleMsg === 'object' && possibleMsg.type === 'process-bar-update') {
          const payload = possibleMsg.payload;
          const bar = resourceProgressBars.value.get('resource-download');
          if (payload && bar) {
            bar.current = payload.current || 0;
            bar.currentDisplay = payload.current || 0;
            if (payload.payload) {
              bar.metadata = { ...bar.metadata, ...payload.payload };
            }
          }
          return;
        }
        if (possibleMsg && typeof possibleMsg === 'object' && possibleMsg.type === 'process-bar-stop') {
          const bar = resourceProgressBars.value.get('resource-download');
          if (bar) {
            bar.completed = true;
            bar.current = bar.total;
            setTimeout(() => {
              resourceProgressBars.value.delete('resource-download');
            }, 1000);
          }
          return;
        }
        
        if (possibleMsg && typeof possibleMsg === 'object' && possibleMsg.type === 'multi-process-bar-update' && possibleMsg.payload?.event) {
          handleProgressEvent(possibleMsg.payload.event);
          return;
        }
        if (possibleMsg && typeof possibleMsg === 'object' && possibleMsg.type === 'multi-process-bar-stop') {
          for (const [, bar] of progressBars.value) {
            bar.completed = true;
            bar.current = bar.total;
            bar.status = 'Download complete';
          }
          setTimeout(() => progressBars.value.clear(), 1000);
          return;
        }
        if (possibleMsg && typeof possibleMsg === 'object' && possibleMsg.type === 'multi-process-bar-start') {
          // Ignore start banner; bars will appear on first update
          return;
        }

        // Accept standard flog entries, but be lenient about missing type and non-string messages
        if (inner && typeof inner === 'object') {
          const opId = typeof (inner as any).opId === 'string' ? (inner as any).opId : 'system';
          const group = typeof (inner as any).group === 'string' ? (inner as any).group : 'main';
          const t = (inner as any).type;
          const validType = t === 'container' || t === 'info' || t === 'error';
          const msgVal = (inner as any).message;
          const timestamp = typeof (inner as any).timestamp === 'number' ? (inner as any).timestamp : Date.now();

          // If no usable content, ignore
          if (msgVal === undefined || msgVal === null) return;

          const asStringRaw = typeof msgVal === 'string' ? msgVal : (() => {
            try { return JSON.stringify(msgVal); } catch { return String(msgVal); }
          })();
          // Filter inline textual progress bar lines like "Downloading | <id> | 123MB/1.2GB"
          const inlineBarPattern = /^(Downloading|Extracting|Pulling fs layer|Resource)\s*\|\s*[^|]+\|\s*[0-9.]+\s*(KB|MB|GB)\/[0-9.]+\s*(KB|MB|GB)$/;
          if (inlineBarPattern.test(asStringRaw.trim())) {
            return;
          }
          // Filter raw JSON progress bar messages (process-bar-start, process-bar-update, process-bar-stop)
          if (typeof msgVal === 'object' && msgVal !== null) {
            const type = (msgVal as any).type;
            if (type === 'process-bar-start' || type === 'process-bar-update' || type === 'process-bar-stop') {
              return;
            }
          }

          const entry: FLogMessage = {
            opId,
            group,
            type: validType ? t : 'info',
            timestamp,
            message: asStringRaw,
          };
          console.debug('[useFLogs] adding flog entry', { opId, type: entry.type, preview: asStringRaw.slice(0, 120) });
          addMessage(entry);
          return;
        }
      } catch {}
    },
    3,
    3000,
    { path: '/flog', disableFallback: true }
  );

  // proxy flags
  watch(wsConnecting, (v) => { isConnecting.value = v; });
  watch(wsEstablished, (v) => { connectionEstablished.value = v; });

  // lifecycle control
  watch(shouldConnect, (next) => {
    if (next) initConnection();
    else closeConnection();
  }, { immediate: true });

  const activeLogs = computed<FLogEntry[]>(() => {
    if (activeTab.value === 'system') return systemLogs.value;
    return logsByOp.value.get(activeTab.value) || [];
  });

  function setActiveTab(tab: string) {
    activeTab.value = tab;
  }

  return {
    tabs,
    activeTab,
    setActiveTab,
    activeLogs,
    isConnecting,
    connectionEstablished,
    progressBars,
    resourceProgressBars,
    logsByOp,
    systemLogs,
  };
}

