import type {
  DeploymentRequirements,
  NosanaAvailableNodes,
  NosanaGpuModel,
  NosanaGpuModels,
  NosanaRequirementOption,
  NosanaRequirementOptions,
} from "@nosana/kit";
import {
  useDocumentVisibility,
  useIntervalFn,
  watchDebounced,
} from "@vueuse/core";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import { withNetworkFee } from "./useMarketPricing";
import { useLatestRequest } from "./useLatestRequest";
import { truncateMiddle } from "~/utils/solana";

countries.registerLocale(en);

/**
 * Node requirements: the GPUs a deployment may run on, and the host specs
 * beyond them. A deployment names no market: host-manager posts each job to
 * the cheapest PREMIUM market with a host that meets them.
 *
 * The lookups go through the kit's `api.reservations` group (host-manager's
 * `/reservations` read routes, which the dashboard reaches via its API base),
 * and the shapes are the kit's own types.
 */

export type RequirementValue = number | string | boolean;

/**
 * The specs beyond the GPUs, one value each: a number is a minimum, anything
 * else exact. The subset of a deployment's requirements the panels edit.
 */
export type Requirements = Record<string, RequirementValue>;

/**
 * Requirements as a deployment sends them (the kit's type): the GPUs as a
 * list under `GPU_KEY` (any of them), every other spec one value.
 */
export type { DeploymentRequirements };

/** The GPU model metric: a deployment lists the models it accepts under it. */
export const GPU_KEY = "name";

/**
 * Temporary: the compute step lists markets instead of GPU models, takes
 * one, and the deployment pins it, as before GPUs were requirements. Set to
 * false to bring the multi-GPU selection back.
 */
export const PIN_TO_MARKET = true;

/** The market a listing pins: a market row's own address, else the first the catalogue lists the GPU in. */
export function marketOf(listing: GpuListing | undefined): string | null {
  return listing?.markets[0] ?? null;
}

/** A market as the dashboard API lists it, with its hourly rate. */
interface MarketRate {
  address: string;
  name: string;
  type: string;
  usd_reward_per_hour: number;
  /** A private market reserved for one client; public jobs cannot use it. */
  client?: boolean;
  /** Hardware notes on the market, e.g. `{ key: "vram", value: "24GB" }`. */
  metadata?: Array<{ key: string; value: string }>;
}

/** "24GB" → 24, "24576 MB" → 24; null when the text names no size. */
function parseVramGb(text: string | undefined): number | null {
  const match = text?.match(/(\d+(?:\.\d+)?)\s*(GB|MB)?/i);
  if (!match) return null;
  const size = Number(match[1]);
  return match[2]?.toUpperCase() === "MB" ? Math.round(size / 1024) : size;
}

/** The market types a deployment can be created on: every public type on devnet, premium on mainnet. */
function deployableMarketTypes(): string[] {
  return useRuntimeConfig().public.network === "devnet"
    ? ["PREMIUM", "COMMUNITY"]
    : ["PREMIUM"];
}

/** The GPUs a deployment's requirements accept; one value reads as a list of one. */
export function gpusOf(
  requirements: DeploymentRequirements | null | undefined,
): string[] {
  const value = requirements?.[GPU_KEY];
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).map(String);
}

/** The full requirements: the specs, plus the GPUs when any are chosen. */
export function withGpus(
  requirements: Requirements,
  gpus: string[],
): DeploymentRequirements {
  return gpus.length ? { ...requirements, [GPU_KEY]: gpus } : requirements;
}

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

/** Hourly USD, network fee included: the cheapest and dearest of some markets. */
export interface PriceRange {
  min: number;
  max: number;
}

/**
 * A GPU model as the GPU list shows it, from host-manager's catalogue: the
 * hosts that have it, and what an hour on it costs. The catalogue already
 * speaks for a deployment without a market: its hosts, markets and price are
 * those of the open markets, so nothing here looks a market up.
 */
export interface GpuListing {
  /** The model as hosts report it, which is the `name` requirement's value. */
  name: string;
  /** In whole GB; the smallest when hosts report the model with several sizes. */
  vramGb: number;
  /** Hosts with it queued now, which a new job starts on at once. */
  available: number;
  /** Hosts with it running a job, back in the queue as they finish. */
  working: number;
  /** The open markets it is in: where a deployment on it posts. */
  markets: string[];
  /** Hourly USD across those markets, network fee included; null when none is priced. */
  usd: PriceRange | null;
}

/** How often a mounted GPU list refreshes its host counts. */
const HOST_COUNT_REFRESH_MS = 10_000;

/** Pure: the price range over some prices; null without any. */
function rangeOf(prices: number[]): PriceRange | null {
  return prices.length
    ? { min: Math.min(...prices), max: Math.max(...prices) }
    : null;
}

/**
 * The GPUs a deployment can run on: the catalogue's models, one per model
 * across the VRAM sizes hosts report, with the price range over its open
 * markets (the network fee added).
 *
 * `live` keeps the counts fresh while the caller is mounted: they are fetched
 * again on mount and every few seconds after, while the tab is visible.
 * Callers that only read what a live list already keeps fresh (the deploy
 * summary) leave it off.
 */
export function useGpuListings({ live = false }: { live?: boolean } = {}) {
  if (PIN_TO_MARKET) return useMarketListings({ live });
  const { gpus, pending, error, refresh } = useGpuModels();
  if (live) {
    // Counts kept from an earlier visit are fetched again right away.
    if (gpus.value.length) void refresh();
    const visibility = useDocumentVisibility();
    useIntervalFn(() => {
      if (visibility.value === "visible") void refresh();
    }, HOST_COUNT_REFRESH_MS);
  }

  const listings = computed<GpuListing[]>(() => {
    const byName = new Map<string, GpuModel[]>();
    for (const gpu of gpus.value) {
      byName.set(gpu.name, [...(byName.get(gpu.name) ?? []), gpu]);
    }
    return [...byName].map(([name, models]) => ({
      name,
      vramGb: Math.min(...models.map((model) => model.vramGb)),
      ...hostsOf(models),
      markets: [...new Set(models.flatMap((model) => model.markets))],
      usd: rangeOf(
        models.flatMap((model) =>
          model.price
            ? [withNetworkFee(model.price.minUsdPerHour), withNetworkFee(model.price.maxUsdPerHour)]
            : [],
        ),
      ),
    }));
  });

  return {
    listings,
    pending,
    error,
    refresh,
  };
}

/**
 * The markets a deployment can be created on, as GPU listings: one row per
 * public market of the deployable types, named as the market is, with the
 * market's own address, its hourly rate, VRAM from its metadata (0 when it
 * has none) and live host counts from host-manager's queue and the
 * running-job counts. `live` as on `useGpuListings`.
 */
function useMarketListings({ live = false }: { live?: boolean } = {}) {
  const config = useRuntimeConfig();
  const { nosana } = useKit();
  const types = deployableMarketTypes();
  const { data, pending, error, refresh } = useAsyncData<GpuListing[]>(
    "market-listings",
    async () => {
      const baseURL = config.public.apiBase as string;
      const [markets, queued, running] = await Promise.all([
        $fetch<MarketRate[]>("/markets", { baseURL }),
        nosana.value.api.reservations.findAvailable({ requirements: {} }),
        $fetch<Record<string, { running?: number }>>("/jobs/running", {
          baseURL,
        }),
      ]);
      const available: Record<string, number> = {};
      for (const node of queued.nodes) {
        available[node.market] = (available[node.market] ?? 0) + 1;
      }
      return markets
        .filter((market) => !market.client && types.includes(market.type))
        .map((market) => {
          const usd = market.usd_reward_per_hour;
          return {
            name: market.name,
            vramGb:
              parseVramGb(
                market.metadata?.find((entry) => entry.key === "vram")?.value,
              ) ?? 0,
            available: available[market.address] ?? 0,
            working: running[market.address]?.running ?? 0,
            markets: [market.address],
            usd: usd > 0 ? { min: withNetworkFee(usd), max: withNetworkFee(usd) } : null,
          };
        });
    },
    { default: () => [], dedupe: "defer" },
  );
  if (live) {
    if (data.value?.length) void refresh();
    const visibility = useDocumentVisibility();
    useIntervalFn(() => {
      if (visibility.value === "visible") void refresh();
    }, HOST_COUNT_REFRESH_MS);
  }

  return { listings: computed(() => data.value ?? []), pending, error, refresh };
}

/** Whether a GPU meets the job's VRAM; a listing with no VRAM known (0) always does. */
export function gpuFitsVram(
  listing: GpuListing,
  requiredGb: number | null,
): boolean {
  return !requiredGb || !listing.vramGb || listing.vramGb >= requiredGb;
}

/** Hosts free now and hosts busy, summed over some GPUs. */
export function hostsOf(
  gpus: Array<{ available: number; working: number }>,
): { available: number; working: number } {
  return {
    available: gpus.reduce((sum, gpu) => sum + gpu.available, 0),
    working: gpus.reduce((sum, gpu) => sum + gpu.working, 0),
  };
}

/** The listings of the named GPUs, in list order. */
export function listingsOf(listings: GpuListing[], names: string[]): GpuListing[] {
  return listings.filter((listing) => names.includes(listing.name));
}

/** The GPUs a market serves: a deployment made when the GPU was a market gets these. */
export function gpusInMarket(listings: GpuListing[], market: string): string[] {
  return listings
    .filter((listing) => listing.markets.includes(market))
    .map((listing) => listing.name);
}

/** "RTX 4090" for "NVIDIA GeForce RTX 4090": the model without the vendor. */
export function shortGpuName(name: string): string {
  return name.replace(/^NVIDIA (GeForce )?/, "");
}

/** "24 GB", or "8–80 GB" across sizes. */
export function formatVramRange(low: number, high: number): string {
  return low === high ? `${low} GB` : `${low}–${high} GB`;
}

/** The price range a set of GPUs spans: jobs go to the cheapest host free, up to the dearest. */
export function priceOfGpus(listings: GpuListing[]): PriceRange | null {
  return rangeOf(
    listings.flatMap((listing) =>
      listing.usd ? [listing.usd.min, listing.usd.max] : [],
    ),
  );
}

/** "$0.35" or "$0.35–$0.90", each bound times `count` (replicas). */
export function formatPriceRange(range: PriceRange | null, count = 1): string {
  if (!range) return "—";
  const [min, max] = [range.min * count, range.max * count];
  return min === max
    ? `$${min.toFixed(2)}`
    : `$${min.toFixed(2)}–$${max.toFixed(2)}`;
}

/**
 * The GPU a deployment gets by default: the cheapest that fits the job's
 * VRAM with a host free now, else the cheapest that fits at all. Only priced
 * GPUs qualify, since that price is what the deployment will pay.
 */
export function recommendGpu(
  listings: GpuListing[],
  requiredGb: number | null,
): GpuListing | null {
  const priced = listings
    .filter((listing) => listing.usd !== null && gpuFitsVram(listing, requiredGb))
    .sort((a, b) => (a.usd?.min ?? 0) - (b.usd?.min ?? 0));
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

export type RequirementCategoryId = "compute" | "network" | "storage";

/**
 * One panel of the requirements card: the metric keys it edits, in order.
 * The GPU is not among them: it has its own list.
 */
export interface RequirementCategory {
  id: RequirementCategoryId;
  label: string;
  icon: CategoryIconName;
  /** The metric keys its panel edits, in panel order. */
  keys: string[];
}

export const REQUIREMENT_CATEGORIES: RequirementCategory[] = [
  {
    id: "compute",
    label: "Compute",
    icon: "compute",
    keys: ["cuda_driver_version", "ram_gb", "logical_cores"],
  },
  {
    id: "network",
    label: "Location & network",
    icon: "network",
    keys: ["country", "download_mbps", "upload_mbps"],
  },
  { id: "storage", label: "Storage", icon: "storage", keys: ["disk_gb"] },
];

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
 * over every host on the network: host-manager scopes these by requirement,
 * not by market, and a market's hosts span several GPU models. `keys` picks
 * the metrics (in that order); `null` asks for every usable metric.
 */
export function useRequirementOptions(keys: string[] | null) {
  const { nosana } = useKit();
  const { data, pending, error, refresh } =
    useAsyncData<RequirementOptions | null>(
      `requirement-options:${keys?.join(",") ?? "*"}`,
      () =>
        nosana.value.api.reservations.getRequirementOptions(
          keys ? { metrics: keys } : {},
        ),
      { default: () => null, dedupe: "defer" },
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
 * The requirements the hosts in `options` can meet. A spec from a draft can
 * sit outside them (a minimum above every host, a country no host is in, a
 * metric no host reports): those are dropped, so a set never carries a
 * boundary no host meets.
 */
export function keepSupportedRequirements(
  requirements: Requirements,
  options: RequirementOptions,
): Requirements {
  return Object.fromEntries(
    Object.entries(requirements).filter(([key, value]) => {
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

/** The chosen GPUs' hosts: every one, those free now, and those busy now. */
export interface MatchingHosts {
  hosts: number;
  available: number;
  working: number;
  /**
   * Hosts free now that a deployment with these requirements (the GPUs and
   * the specs) could get; null while unknown or after a failed lookup.
   */
  qualifying: number | null;
}

/**
 * How many hosts free now a deployment with `requirements` could get: host-
 * manager's dry run, which keeps to the markets a deployment without a market
 * posts to, so no market is named here. Looked up again when the requirements
 * change (not on every catalogue refresh): debounced, latest response wins.
 * Null without requirements and while a lookup has failed.
 */
export function useQualifyingHosts(
  requirements: MaybeRefOrGetter<DeploymentRequirements>,
  /** When given, only hosts queued on these markets count. */
  markets: MaybeRefOrGetter<string[] | null> = null,
) {
  const { nosana } = useKit();
  const qualifying = ref<number | null>(null);
  const failed = ref(false);
  const searches = useLatestRequest();

  async function search() {
    const id = searches.begin();
    const current = toValue(requirements);
    if (!Object.keys(current).length) {
      qualifying.value = null;
      failed.value = false;
      return;
    }
    try {
      const result = await nosana.value.api.reservations.findAvailable({
        requirements: current,
      });
      if (!searches.isCurrent(id)) return;
      const within = toValue(markets);
      qualifying.value = within
        ? result.nodes.filter((node) => within.includes(node.market)).length
        : result.total;
      failed.value = false;
    } catch (e) {
      console.error("Error finding available nodes:", e);
      if (!searches.isCurrent(id)) return;
      failed.value = true;
      qualifying.value = null;
    }
  }

  // A string key: the catalogue refresh rebuilds equal inputs as new objects,
  // which must not trigger a lookup.
  const inputs = computed(() =>
    JSON.stringify([toValue(requirements), toValue(markets)]),
  );
  watchDebounced(inputs, search, { debounce: 300, immediate: true });

  return { qualifying, failed, refresh: search };
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
    case "cuda_driver_version":
      return { label: "CUDA", value: `≥ ${value}` };
    // Measured in MB, required in whole GB.
    case "vram_total_mb":
      return { label: "VRAM", value: `≥ ${Math.round(Number(value) / 1024)} GB` };
    case "country":
      return { label: "Country", value: countryName(String(value)) };
    default:
      return { label: key.replace(/_/g, " "), value: String(value) };
  }
}

/** "CUDA ≥ 12.8", "Netherlands", "RAM ≥ 64 GB". */
function requirementChipText(key: string, value: RequirementValue): string {
  const described = describeRequirement(key, value);
  if (key === "country") return described.value;
  return `${described.label} ${described.value}`;
}

/** The set requirements as chips, in category then panel order. */
export function listRequirementChips(
  requirements: Requirements,
): Array<{ key: string; text: string }> {
  return REQUIREMENT_CATEGORIES.flatMap((category) => category.keys).flatMap(
    (key) => {
      const value = requirements[key];
      return value === undefined
        ? []
        : [{ key, text: requirementChipText(key, value) }];
    },
  );
}

/**
 * The specs a category edits, one value each; anything else is dropped: a key
 * from an old draft, or the GPU list, which `gpusOf` reads.
 */
export function keepCategorizedRequirements(
  requirements: DeploymentRequirements,
): Requirements {
  return Object.fromEntries(
    Object.entries(requirements).flatMap(([key, value]) =>
      categoryOfKey(key) !== null && !Array.isArray(value) ? [[key, value]] : [],
    ),
  );
}

// --- What a deployment runs on, for the deployment lists ---

/** A deployment's targeting: a pinned market, or requirements, or neither. */
type Targeting = {
  market?: string | null;
  requirements?: DeploymentRequirements | null;
};

/**
 * A deployment's "Runs on" cell: `main` names the pinned market, the GPUs, or
 * "Any GPU"; `sub` lists its other requirements, or "No requirements".
 */
export interface RunsOn {
  main: string;
  /** "Market" on a pinned market. */
  tag?: string;
  /** Every GPU's full name, when `main` shortens them to "first +N". */
  title?: string;
  sub: string;
}

/** The requirements besides the GPUs: "RAM ≥ 64 GB · CUDA ≥ 12.8"; a list reads "NL / DE". */
function otherRequirementsText(requirements: DeploymentRequirements | null | undefined): string {
  return Object.entries(requirements ?? {})
    .filter(([key]) => key !== GPU_KEY)
    .map(([key, value]) =>
      (Array.isArray(value) ? value : [value])
        .map((entry) => requirementChipText(key, entry))
        .join(" / "),
    )
    .join(" · ");
}

/**
 * Pure: what a deployment runs on. A pinned market by name; else its GPUs
 * (short names, three or more as "first +N"); else "Any GPU". A deployment
 * need not name a GPU, so none of the cases assume one.
 */
export function describeRunsOn(
  deployment: Targeting,
  marketName: (address: string) => string,
): RunsOn {
  const sub = otherRequirementsText(deployment.requirements) || "No requirements";
  if (deployment.market) {
    return { main: marketName(deployment.market), tag: "Market", sub };
  }
  const gpus = gpusOf(deployment.requirements);
  if (!gpus.length) return { main: "Any GPU", sub };
  const names = gpus.map(shortGpuName);
  return {
    main: names.length <= 2 ? names.join(", ") : `${names[0]} +${names.length - 1}`,
    title: names.length > 2 ? gpus.join("\n") : undefined,
    sub,
  };
}

/**
 * Pure: a deployment's "Runs on" filter keys, as the list endpoint filters:
 * `gpu:<name>` for each GPU its requirements name, `market:<address>` for a
 * pinned market, and `any` when it has neither.
 */
export function runsOnKeys(deployment: Targeting): string[] {
  const keys = gpusOf(deployment.requirements).map((gpu) => `gpu:${gpu}`);
  if (deployment.market) keys.unshift(`market:${deployment.market}`);
  return keys.length ? keys : ["any"];
}

/**
 * Pure: a "Runs on" filter key as the list endpoint's `gpu` and `market`
 * parameters (`none` selects deployments without one); empty for no filter.
 */
export function runsOnListParams(key: string): { gpu?: string; market?: string } {
  if (key === "any") return { market: "none", gpu: "none" };
  if (key.startsWith("gpu:")) return { gpu: key.slice("gpu:".length) };
  if (key.startsWith("market:")) return { market: key.slice("market:".length) };
  return {};
}

/** The "Runs on" filter's groups of options, from the keys the deployments have. */
export function runsOnOptions(
  keys: string[],
  marketName: (address: string) => string,
): Array<{ label: string; options: Array<{ value: string; label: string }> }> {
  const unique = [...new Set(keys)];
  const of = (prefix: string, label: (rest: string) => string) =>
    unique
      .filter((key) => key.startsWith(prefix))
      .map((key) => ({ value: key, label: label(key.slice(prefix.length)) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  return [
    { label: "GPUs", options: of("gpu:", shortGpuName) },
    { label: "Pinned markets", options: of("market:", marketName) },
    {
      label: "Other",
      options: unique.includes("any") ? [{ value: "any", label: "Any GPU (no GPU set)" }] : [],
    },
  ].filter((group) => group.options.length);
}

/**
 * A market's label without a markets list: the GPU model(s) host-manager's
 * catalogue lists it under ("RTX 4090"), else its truncated address. Markets
 * only come up as a legacy pin on a deployment or as where a job landed, and
 * the GPU is what a reader wants to know about either.
 */
export function useMarketLabel() {
  const { gpus } = useGpuModels();
  const marketLabel = (address: string | null | undefined): string => {
    if (!address) return "-";
    const names = [
      ...new Set(
        gpus.value
          .filter((model) => model.markets.includes(address))
          .map((model) => shortGpuName(model.name)),
      ),
    ];
    return names.length ? names.join(", ") : truncateMiddle(address, 6, 6);
  };
  return { marketLabel };
}

/** `describeRunsOn`, `runsOnKeys` and `runsOnOptions` wired to the catalogue's market labels. */
export function useRunsOn() {
  const { marketLabel } = useMarketLabel();
  return {
    describe: (deployment: Targeting) => describeRunsOn(deployment, marketLabel),
    keysOf: runsOnKeys,
    options: (keys: string[]) => runsOnOptions(keys, marketLabel),
  };
}

