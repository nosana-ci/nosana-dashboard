import type { Terminal } from "@xterm/xterm";
import type { FitAddon } from "@xterm/addon-fit";
import { onScopeDispose, type Ref } from "vue";

export interface XtermHandlers {
  onInput: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
}

/**
 * An xterm instance that is created on first use inside `element`, kept
 * fitted to it, and disposed with the owning scope. Colours and font come
 * from the element's computed style, so the component's SCSS decides them:
 * `--terminal-background`, `--terminal-foreground`, `--terminal-cursor`.
 */
export function useXterm(
  element: Ref<HTMLElement | null>,
  handlers: XtermHandlers,
) {
  let terminal: Terminal | null = null;
  let fitAddon: FitAddon | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let inputSubscription: { dispose(): void } | null = null;

  const fit = () => {
    if (!terminal || !fitAddon) return;
    try {
      fitAddon.fit();
      handlers.onResize(terminal.cols, terminal.rows);
    } catch {
      // fit() throws while the element has no size; the next resize retries.
    }
  };

  const dispose = () => {
    inputSubscription?.dispose();
    resizeObserver?.disconnect();
    terminal?.dispose();
    inputSubscription = null;
    resizeObserver = null;
    terminal = null;
    fitAddon = null;
  };

  /**
   * Load xterm and open it in the element. `isCurrent` is checked after the
   * lazy import so a caller that moved on does not get a terminal created.
   */
  const ensure = async (isCurrent: () => boolean): Promise<Terminal | null> => {
    if (terminal) return terminal;

    const [{ Terminal }, { FitAddon }] = await Promise.all([
      import("@xterm/xterm"),
      import("@xterm/addon-fit"),
    ]);
    const host = element.value;
    if (!isCurrent() || !host) return null;

    const style = getComputedStyle(host);
    const colour = (name: string) =>
      style.getPropertyValue(name).trim() || undefined;

    terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: style.fontFamily,
      fontSize: 13,
      theme: {
        background: colour("--terminal-background"),
        foreground: colour("--terminal-foreground"),
        cursor: colour("--terminal-cursor"),
      },
    });
    fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(host);
    fitAddon.fit();

    inputSubscription = terminal.onData(handlers.onInput);
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(fit);
      resizeObserver.observe(host);
    }
    return terminal;
  };

  onScopeDispose(dispose);

  return {
    ensure,
    fit,
    dispose,
    get terminal() {
      return terminal;
    },
  };
}
