import { ref } from 'vue';
import type { Ref } from 'vue';
import AnsiUp from 'ansi_up';

interface ProgressBar {
  id: string;
  current: number;
  total: number;
  status: string;
  format: string;
  completed: boolean;
}

interface LogEntry {
  id: number;
  type: 'log' | 'progress';
  content: string;
  timestamp: number;
  html?: boolean;
  isContainerLog?: boolean;
}

export function useJobLogs() {
  const logs = ref<LogEntry[]>([]);
  const progressBars = ref<Map<string, ProgressBar>>(new Map());
  const isConnecting = ref(true);
  const ansi = new AnsiUp();

  // Configure ansi_up
  ansi.use_classes = true;

  function formatSize(bytes: number): { value: number; format: string } {
    if (!bytes || isNaN(bytes)) return { value: 0, format: 'B' };
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const result = {
      value: Number((bytes / Math.pow(1024, i)).toFixed(2)),
      format: sizes[i]
    };
    return result;
  }

  function addLogEntry(content: string, isHtml: boolean = false) {
    // Don't add duplicate consecutive logs
    const lastLog = logs.value[logs.value.length - 1];
    if (lastLog?.type === 'log' && lastLog.content === content) {
      return;
    }

    // Consider all logs as container logs except for specific system messages
    const isContainerLog = !(
      content.startsWith('Download complete:') ||
      content.startsWith('Already exists:') ||
      content.startsWith('Pull complete:') ||
      content.startsWith('Pulled image') ||
      content.startsWith('Creating network') ||
      content.startsWith('Created network') ||
      content.startsWith('Starting container') ||
      content.startsWith('Running container')
    );

    // Convert ANSI to HTML if it's not already HTML
    const processedContent = isHtml ? content : ansi.ansi_to_html(content);

    logs.value.push({
      id: Date.now(),
      type: 'log',
      content: processedContent,
      timestamp: Date.now(),
      html: true,
      isContainerLog
    });
  }

  function handleProgressEvent(event: any) {
    const { id: layerId, status, progressDetail } = event;

    // Handle completion states
    if (['Download complete', 'Pull complete', 'Already exists'].includes(status)) {
      const bar = progressBars.value.get(layerId);
      if (bar) {
        bar.completed = true;
        bar.current = bar.total;
        bar.status = status;
        setTimeout(() => {
          progressBars.value.delete(layerId);
        }, 1000); // Remove completed bars after 1 second
      }
      addLogEntry(`${status}: ${layerId}`);
      return;
    }

    // Handle active download states
    if (['Downloading', 'Extracting'].includes(status)) {
      const current = progressDetail?.current || 0;
      const total = progressDetail?.total || 0;
      const { value: currentValue } = formatSize(current);
      const { value: totalValue, format } = formatSize(total);

      let bar = progressBars.value.get(layerId);
      if (!bar) {
        bar = {
          id: layerId,
          current: currentValue,
          total: totalValue,
          status,
          format,
          completed: false
        };
        progressBars.value.set(layerId, bar);
      } else {
        bar.current = currentValue;
        bar.total = totalValue;
        bar.status = status;
        bar.format = format;
      }
    }
  }

  function handleWebSocketMessage(event: MessageEvent) {
    try {
      const outerData = JSON.parse(event.data);
      const logData = outerData.data ? JSON.parse(outerData.data) : outerData;
      if (!logData) return;

      // Set connecting to false when we receive any message
      isConnecting.value = false;

      if ((logData.type === 'multi-process-bar-update' || logData.method === 'MultiProgressBarReporter.update') && logData.payload?.event) {
        handleProgressEvent(logData.payload.event);
        return;
      }

      if (logData.log) {
        addLogEntry(logData.log);
      }
    } catch (err) {
      console.error('Error parsing log data:', err);
    }
  }

  function clearLogs() {
    logs.value = [];
    progressBars.value.clear();
    isConnecting.value = true; // Reset to true when clearing logs
  }

  return {
    logs,
    progressBars,
    isConnecting,
    handleWebSocketMessage,
    clearLogs,
    addLogEntry
  };
} 