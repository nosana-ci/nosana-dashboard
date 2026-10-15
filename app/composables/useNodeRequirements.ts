import type {
  NosanaAvailableNodes,
  NosanaGpuModel,
  NosanaGpuModels,
  NosanaRequirementOption,
  NosanaRequirementOptions,
  NosanaRequirements,
} from "@nosana/kit";
import {
  useDocumentVisibility,
  useIntervalFn,
  watchDebounced,
} from "@vueuse/core";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import { NETWORK_FEE_MULTIPLIER } from "./useMarketPricing";

countries.registerLocale(en);

/**
 * Node requirements for picking a market by hardware rather than by name.
 *
 * The lookups go through the kit's `api.reservations` group (host-manager's
 * `/reservations` read routes, which the dashboard reaches via its API base),
 * and the shapes are the kit's own types.
 */

export type RequirementValue = number | string | boolean;

/** Metric key → required value: a number is a minimum, anything else exact. */
export type Requirements = NosanaRequirements;

/**
 * One metric usable as a requirement. `values` are the distinct values hosts
 * report with how many hosts report each, sorted (numbers ascending, versions
 * in version order, text alphabetically). `min`/`max` only on numeric metrics.
 */
export type RequirementOption = NosanaRequirementOption;
export type RequirementOptions = NosanaRequirementOptions;

/** Queued nodes, across every market, that satisfy the requirements. */
export type AvailableNodes = NosanaAvailableNodes;

/**
 * One GPU model from the catalogue: name and VRAM come from the same card,
 * `available` hosts are queued now and `working` ones come back as they finish.
 */
export type GpuModel = NosanaGpuModel;
export type GpuModels = NosanaGpuModels;

/** A testgrid `/markets` row, as far as pricing a GPU needs it. */
export interface MarketRate {
  address: string;
  name: string;
  type: string;
  usd_reward_per_hour: number;
  /** A private market reserved for one client; public jobs cannot use it. */
  client?: boolean;
  /** Hardware notes on the market, e.g. `{ key: "vram", value: "24GB" }`. */
  metadata?: Array<{ key: string; value: string }>;
}

/**
 * A market as the GPU list shows it: its VRAM, the hosts free and busy on
 * it right now, and its hourly price.
 */
export interface MarketListing {
  market: MarketRate;
  /** From the market's metadata, else from the GPU model its hosts report. */
  vramGb: number | null;
  /** Hosts queued on the market now, which a new job starts on at once. */
  available: number;
  /** Hosts running a job on the market, back in its queue as they finish. */
  working: number;
  /** Hourly USD, network fee included; null when the market is unpriced. */
  usd: number | null;
}

/** "24GB" → 24, "24576 MB" → 24; null when the text names no size. */
export function parseVramGb(text: string | undefined): number | null {
  const match = text?.match(/(\d+(?:\.\d+)?)\s*(GB|MB)?/i);
  if (!match) return null;
  const size = Number(match[1]);
  return match[2]?.toUpperCase() === "MB" ? Math.round(size / 1024) : size;
}

/** The market types a deployment can be created on: every public type on devnet, premium on mainnet. */
export function deployableMarketTypes(): string[] {
  return useRuntimeConfig().public.network === "devnet"
    ? ["PREMIUM", "COMMUNITY"]
    : ["PREMIUM"];
}

/** How often a mounted GPU list refreshes its host counts. */
const HOST_COUNT_REFRESH_MS = 10_000;

/** Per market address: hosts queued now, and hosts running a job. */
interface MarketHosts {
  available: Record<string, number>;
  working: Record<string, number>;
}

/**
 * The markets a deployment can be created on, with live host counts: the
 * public markets of the deployable types. Hosts come from host-manager's
 * queue (`available`) and the running-job counts (`working`); VRAM from the
 * market's metadata, else from the GPU model whose hosts serve it.
 *
 * `live` keeps the counts fresh while the caller is mounted: they are fetched
 * again on mount and every few seconds after, while the tab is visible.
 * Callers that only read what a live list already keeps fresh (the deploy
 * summary) leave it off.
 */
export function useMarketListings(
  markets: MaybeRefOrGetter<MarketRate[] | null>,
  { live = false }: { live?: boolean } = {},
) {
  const types = deployableMarketTypes();
  const config = useRuntimeConfig();
  const { nosana } = useKit();
  const { gpus, error: gpuError, refresh: refreshGpus } = useGpuModels();
  // Both counts in one fetch, so a refresh changes the listings once. The
  // key is shared between the GPU list and the page around it: `defer` joins
  // a request already in flight instead of restarting it.
  const {
    data: hosts,
    pending,
    error: hostsError,
    refresh: refreshHosts,
  } = useAsyncData<MarketHosts | null>(
    "market-hosts",
    async () => {
      const [queued, running] = await Promise.all([
        nosana.value.api.reservations.findAvailable({ requirements: {} }),
        $fetch<Record<string, { running?: number }>>("/jobs/running", {
          baseURL: config.public.apiBase as string,
        }),
      ]);
      const available: Record<string, number> = {};
      for (const node of queued.nodes) {
        available[node.market] = (available[node.market] ?? 0) + 1;
      }
      const working = Object.fromEntries(
        Object.entries(running).map(([market, count]) => [
          market,
          count.running ?? 0,
        ]),
      );
      return { available, working };
    },
    { default: () => null, dedupe: "defer" },
  );
  if (live) {
    // Counts kept from an earlier visit are fetched again right away.
    if (hosts.value !== null) void refreshHosts();
    const visibility = useDocumentVisibility();
    useIntervalFn(() => {
      if (visibility.value === "visible") void refreshHosts();
    }, HOST_COUNT_REFRESH_MS);
  }

  const listings = computed<MarketListing[]>(() =>
    (toValue(markets) ?? [])
      .filter((market) => !market.client && types.includes(market.type))
      .map((market) => ({
        market,
        vramGb:
          parseVramGb(
            market.metadata?.find((entry) => entry.key === "vram")?.value,
          ) ??
          gpus.value.find((gpu) => gpu.markets.includes(market.address))
            ?.vramGb ??
          null,
        available: hosts.value?.available[market.address] ?? 0,
        working: hosts.value?.working[market.address] ?? 0,
        usd:
          market.usd_reward_per_hour > 0
            ? market.usd_reward_per_hour * NETWORK_FEE_MULTIPLIER
            : null,
      })),
  );

  /**
   * A market as listed; one not listed (a client's private market) gives a
   * listed market of the same GPU, if the catalogue knows one.
   */
  const listingFor = (address: string): MarketListing | undefined => {
    const listed = listings.value.find(
      (listing) => listing.market.address === address,
    );
    if (listed) return listed;
    const gpu = gpus.value.find((model) => model.markets.includes(address));
    return gpu
      ? listings.value.find((listing) =>
          gpu.markets.includes(listing.market.address),
        )
      : undefined;
  };

  return {
    listings,
    listingFor,
    pending,
    /** Until the first host counts arrive, every listing reads 0 and 0. */
    counting: computed(() => hosts.value === null && !hostsError.value),
    error: computed(() => hostsError.value || gpuError.value),
    refresh: () => Promise.all([refreshHosts(), refreshGpus()]),
  };
}

/** Whether a market is known to meet the job's VRAM; unknown VRAM never is. */
export function marketFitsVram(
  listing: MarketListing,
  requiredGb: number | null,
): boolean {
  return (
    !requiredGb || (listing.vramGb !== null && listing.vramGb >= requiredGb)
  );
}

/**
 * The market a deployment gets by default: the cheapest that fits the job's
 * VRAM with a host free now, else the cheapest that fits at all. Only priced
 * markets qualify, since that price is what the deployment will pay.
 */
export function recommendMarket(
  listings: MarketListing[],
  requiredGb: number | null,
): MarketListing | null {
  const priced = listings
    .filter(
      (listing) => listing.usd !== null && marketFitsVram(listing, requiredGb),
    )
    .sort((a, b) => (a.usd as number) - (b.usd as number));
  return priced.find((listing) => listing.available > 0) ?? priced[0] ?? null;
}

/** The line icons drawn by the deploy flow's CategoryIcon component. */
export type CategoryIconName =
  | "gpu"
  | "compute"
  | "network"
  | "storage"
  | "code"
  | "search"
  | "arrow";

export type RequirementCategoryId = "gpu" | "compute" | "network" | "storage";

/** One panel of the requirements card: the metric keys it edits, in order. */
export interface RequirementCategory {
  id: RequirementCategoryId;
  label: string;
  icon: CategoryIconName;
  /** The metric keys its panel edits, in panel order. */
  keys: string[];
}

export const REQUIREMENT_CATEGORIES: RequirementCategory[] = [
  { id: "gpu", label: "GPU", icon: "gpu", keys: ["name"] },
  {
    id: "compute",
    label: "Compute",
    icon: "compute",
    keys: ["cuda_driver_version", "ram_gb", "logical_cores", "cpu_model"],
  },
  {
    id: "network",
    label: "Location & network",
    icon: "network",
    keys: ["country", "download_mbps", "upload_mbps", "ping_ms"],
  },
  { id: "storage", label: "Storage", icon: "storage", keys: ["disk_gb"] },
];

/** "NVIDIA GeForce RTX 4090" → "RTX 4090". */
export function shortGpuName(name: string): string {
  return name.replace(/\b(NVIDIA|GeForce)\b\s*/g, "");
}

/** The category a requirement is set under; null for a key no category edits. */
export function categoryOfKey(key: string): RequirementCategoryId | null {
  return (
    REQUIREMENT_CATEGORIES.find((category) => category.keys.includes(key))
      ?.id ?? null
  );
}

export function countryName(code: string): string {
  return countries.getName(code, "en") || code;
}

/**
 * The distinct values of each metric with host counts, for building controls,
 * scoped to the queued hosts that satisfy `scope` (the chosen GPU) so every
 * range and choice is one an available host meets. `keys` picks the metrics
 * (in that order); `null` asks for every usable metric. Refetches when the scope changes; the
 * previous options stay in place until the new ones arrive.
 */
export function useRequirementOptions(
  keys: string[] | null,
  scope: MaybeRefOrGetter<Requirements>,
) {
  const { nosana } = useKit();
  const { data, pending, error, refresh } =
    useAsyncData<RequirementOptions | null>(
      `requirement-options:${keys?.join(",") ?? "*"}`,
      () =>
        nosana.value.api.reservations.getRequirementOptions({
          ...(keys ? { metrics: keys } : {}),
          requirements: toValue(scope),
        }),
      { default: () => null, watch: [() => toValue(scope)] },
    );

  return { options: data, pending, error, refresh };
}

/** The GPU catalogue, most common model first. */
export function useGpuModels() {
  const { nosana } = useKit();
  const { data, pending, error, refresh } = useAsyncData<GpuModels | null>(
    "gpu-models",
    () => nosana.value.api.reservations.listGpus(),
    { default: () => null, dedupe: "defer" },
  );

  return {
    gpus: computed(() => data.value?.gpus ?? []),
    pending,
    error,
    refresh,
  };
}

/**
 * The two host lookups a requirement set needs, bound to the kit in setup so
 * they can run later from watchers and handlers.
 *
 * `countMatchingHosts`: how many queued or working hosts satisfy the full
 * `requirements` (the scoped options' `nodes`). A host busy now is back in the
 * queue later, so this is the pool a deployment can draw from. One cheap
 * metric is requested; only `nodes` is read.
 *
 * `findAvailableNodes`: which queued nodes match right now, what a
 * reservation would get; `{}` returns every queued node.
 */
export function useReservationLookups() {
  const { nosana } = useKit();
  return {
    countMatchingHosts: (requirements: Requirements) =>
      nosana.value.api.reservations
        .getRequirementOptions({
          metrics: ["cuda_driver_version"],
          requirements,
        })
        .then((options) => options.nodes),
    findAvailableNodes: (requirements: Requirements) =>
      nosana.value.api.reservations.findAvailable({ requirements }),
  };
}

// CUDA is picked by major.minor: "12.8" is a minimum, so it covers 12.8 and up.
export function cudaVersions(option: RequirementOption): string[] {
  const versions = option.values.flatMap(({ value }) => {
    const version = String(value).match(/^\d+\.\d+/);
    return version ? [version[0]] : [];
  });
  const part = (version: string, index: number) =>
    Number(version.split(".")[index]);
  return [...new Set(versions)].sort(
    (a, b) => part(a, 0) - part(b, 0) || part(a, 1) - part(b, 1),
  );
}

/**
 * The requirements the hosts in `options` can meet. A spec set for another
 * scope can sit outside this one (a minimum above every host, a country no
 * host is in, a metric no host reports): those are dropped, so a set never
 * carries a boundary no host meets. The GPU is the scope, so it always stays.
 */
export function keepSupportedRequirements(
  requirements: Requirements,
  options: RequirementOptions,
): Requirements {
  return Object.fromEntries(
    Object.entries(requirements).filter(([key, value]) => {
      if (key === "name") return true;
      const option = options.metrics.find((metric) => metric.key === key);
      if (!option) return false;
      if (option.key === "cuda_driver_version") {
        return cudaVersions(option).includes(String(value));
      }
      if (option.match === "minimum" && typeof value === "number") {
        return option.max !== undefined && value <= option.max;
      }
      return option.values.some((entry) => entry.value === value);
    }),
  );
}

/** The hosts a requirement set matches: every one, those free now, and those busy now. */
export interface MatchingHosts {
  hosts: number;
  available: number;
  working: number;
}

/**
 * The hosts `requirements` matches, looked up again on every change:
 * debounced, latest response wins. Null without a GPU (`name`), which scopes
 * the count, and while a lookup has failed.
 */
export function useMatchingHosts(requirements: MaybeRefOrGetter<Requirements>) {
  const { countMatchingHosts, findAvailableNodes } = useReservationLookups();
  const matching = ref<MatchingHosts | null>(null);
  const failed = ref(false);
  const searches = useLatestRequest();

  async function search() {
    const id = searches.begin();
    const current = toValue(requirements);
    if (typeof current.name !== "string") {
      matching.value = null;
      return;
    }
    try {
      const [result, hosts] = await Promise.all([
        findAvailableNodes(current),
        countMatchingHosts(current),
      ]);
      if (!searches.isCurrent(id)) return;
      matching.value = {
        hosts,
        available: result.total,
        working: Math.max(hosts - result.total, 0),
      };
      failed.value = false;
    } catch (e) {
      console.error("Error finding available nodes:", e);
      if (!searches.isCurrent(id)) return;
      failed.value = true;
      matching.value = null;
    }
  }

  watchDebounced(() => toValue(requirements), search, {
    debounce: 300,
    deep: true,
    immediate: true,
  });

  return { matching, failed, refresh: search };
}

// --- Formatting a requirement for the summary ---
const NUMERIC_FIELDS: Record<
  string,
  { label: string; unit: string; bound: "≥" | "≤" }
> = {
  ram_gb: { label: "RAM", unit: "GB", bound: "≥" },
  disk_gb: { label: "Disk", unit: "GB", bound: "≥" },
  upload_mbps: { label: "Upload", unit: "Mbps", bound: "≥" },
  download_mbps: { label: "Download", unit: "Mbps", bound: "≥" },
  logical_cores: { label: "CPU cores", unit: "", bound: "≥" },
  // Shown as a maximum; host-manager still matches the number as a minimum.
  ping_ms: { label: "Ping", unit: "ms", bound: "≤" },
};

function describeRequirement(
  key: string,
  value: RequirementValue,
): { label: string; value: string } {
  const numeric = NUMERIC_FIELDS[key];
  if (numeric) {
    return {
      label: numeric.label,
      value: `${numeric.bound} ${value} ${numeric.unit}`.trim(),
    };
  }
  switch (key) {
    case "name":
      return {
        label: "GPU",
        value: shortGpuName(String(value)),
      };
    case "cuda_driver_version":
      return { label: "CUDA", value: `≥ ${value}` };
    case "country":
      return { label: "Country", value: countryName(String(value)) };
    case "cpu_model":
      return { label: "CPU", value: String(value) };
    default:
      return { label: key.replace(/_/g, " "), value: String(value) };
  }
}

/** "RTX 4090", "CUDA ≥ 12.8", "Netherlands", "RAM ≥ 64 GB". */
function requirementChipText(key: string, value: RequirementValue): string {
  const described = describeRequirement(key, value);
  if (key === "name" || key === "country" || key === "cpu_model") {
    return described.value;
  }
  return `${described.label} ${described.value}`;
}

/**
 * The set requirements as chips, in category then panel order, without the
 * GPU, which the deploy card shows on its own line.
 */
export function listRequirementChips(
  requirements: Requirements,
): Array<{ key: string; text: string }> {
  return REQUIREMENT_CATEGORIES.flatMap((category) =>
    category.id === "gpu" ? [] : category.keys,
  ).flatMap((key) => {
    const value = requirements[key];
    return value === undefined
      ? []
      : [{ key, text: requirementChipText(key, value) }];
  });
}

/** The requirements a category edits; anything else, e.g. from an old draft, is dropped. */
export function keepCategorizedRequirements(
  requirements: Requirements,
): Requirements {
  return Object.fromEntries(
    Object.entries(requirements).filter(([key]) => categoryOfKey(key) !== null),
  );
}
