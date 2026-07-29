/**
 * Presentation logic for a job's on-chain transaction events, as recorded by the
 * blockchain indexer (one event per decoded Nosana Jobs instruction).
 *
 * Kept free of Vue/Nuxt so it can be unit tested; see tests/jobEvents.test.mjs.
 */

export interface JobEvent {
  jobAddress: string | null;
  nodeAddress: string | null;
  marketAddress: string | null;
  runAddress: string | null;
  type: string;
  signature: string;
  instructionIndex: number;
  slot: number | null;
  blockTime: number | null;
  data: Record<string, unknown> | null;
}

export type JobEventTone = "success" | "info" | "warning" | "danger" | "grey";

export interface JobEventDetail {
  label: string;
  /** Shortened text to display. */
  text: string;
  /** Full value, used as the title attribute. */
  value: string;
  href?: string;
}

export interface JobTimelineItem {
  key: string;
  event: JobEvent;
  title: string;
  tone: JobEventTone;
  detail: JobEventDetail | null;
}

export interface MarketRef {
  address: string;
  name?: string;
}

/**
 * Copy for every Nosana Jobs instruction the indexer can record against a job.
 * Node-queue and market instructions (Stop, Open, Close, Update) never carry a
 * job address, so they never show up on a job timeline.
 */
export const JOB_EVENT_COPY: Record<
  string,
  { title: string; tone: JobEventTone }
> = {
  List: { title: "Posted to market", tone: "info" },
  Assign: { title: "Assigned to node", tone: "info" },
  Delist: { title: "Delisted from queue", tone: "grey" },
  Work: { title: "Picked up by node", tone: "success" },
  Claim: { title: "Claimed by node", tone: "success" },
  Extend: { title: "Timeout extended", tone: "warning" },
  End: { title: "Stopped by deployer", tone: "warning" },
  Finish: { title: "Finished by node", tone: "success" },
  Complete: { title: "Completed", tone: "success" },
  Quit: { title: "Quit by node", tone: "danger" },
  QuitAdmin: { title: "Quit by admin", tone: "danger" },
  Recover: { title: "Funds recovered", tone: "grey" },
  Clean: { title: "Job account closed", tone: "grey" },
  CleanAdmin: { title: "Job account closed by admin", tone: "grey" },
};

export const shortAddress = (address: string): string =>
  address.length > 16
    ? `${address.slice(0, 6)}...${address.slice(-6)}`
    : address;

/** Human duration for a job timeout, e.g. `1d 2h 30m`. */
export const formatEventDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [days ? `${days}d` : null, `${hours}h`, `${minutes}m`]
    .filter(Boolean)
    .join(" ");
};

export const solscanTxUrl = (signature: string, isDevnet: boolean): string =>
  `https://solscan.io/tx/${signature}${isDevnet ? "?cluster=devnet" : ""}`;

/** UTC timestamp, matching how the rest of the job page renders chain times. */
export const formatEventTimestamp = (blockTime: number): string =>
  new Date(blockTime * 1000).toISOString().replace("T", " ").substring(0, 19);

export const formatEventTimeAgo = (
  blockTime: number,
  now: number = Date.now(),
): string => {
  const diffSec = Math.max(0, Math.floor((now - blockTime * 1000) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

const marketDetail = (
  event: JobEvent,
  markets?: MarketRef[] | null,
): JobEventDetail | null => {
  if (!event.marketAddress) return null;
  const name = markets?.find(
    (m) => String(m.address).trim() === event.marketAddress,
  )?.name;
  return {
    label: "Market",
    text: name || shortAddress(event.marketAddress),
    value: event.marketAddress,
    href: `https://explore.nosana.com/markets/${event.marketAddress}`,
  };
};

const nodeDetail = (event: JobEvent): JobEventDetail | null =>
  event.nodeAddress
    ? {
        label: "Node",
        text: shortAddress(event.nodeAddress),
        value: event.nodeAddress,
        href: `https://explore.nosana.com/hosts/${event.nodeAddress}`,
      }
    : null;

const detailFor = (
  event: JobEvent,
  markets?: MarketRef[] | null,
): JobEventDetail | null => {
  switch (event.type) {
    case "List":
    case "Delist":
      return marketDetail(event, markets);
    case "Assign":
    case "Work":
    case "Claim":
    case "Finish":
    case "Quit":
      return nodeDetail(event) ?? marketDetail(event, markets);
    case "Extend": {
      // `timeout` is the job's new absolute timeout after extending.
      const timeout = Number(event.data?.timeout);
      if (!Number.isFinite(timeout)) return null;
      return {
        label: "New timeout:",
        text: formatEventDuration(timeout),
        value: String(timeout),
      };
    }
    default:
      return null;
  }
};

/** Maps indexer events (oldest first) onto renderable timeline entries. */
export const buildJobTimeline = (
  events: JobEvent[],
  markets?: MarketRef[] | null,
): JobTimelineItem[] =>
  events.map((event) => {
    // Unknown instruction: show the raw type rather than dropping the event.
    const copy = JOB_EVENT_COPY[event.type] ?? {
      title: event.type,
      tone: "grey" as JobEventTone,
    };
    return {
      key: `${event.signature}-${event.instructionIndex}`,
      event,
      title: copy.title,
      tone: copy.tone,
      detail: detailFor(event, markets),
    };
  });
