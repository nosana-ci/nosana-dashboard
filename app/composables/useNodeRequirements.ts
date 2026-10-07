import type {
  NosanaAvailableNodes,
  NosanaGpuModel,
  NosanaGpuModels,
  NosanaRequirementOption,
  NosanaRequirementOptions,
  NosanaRequirements,
} from "@nosana/kit";
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
    { default: () => null },
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

/**
 * The cheapest priced public market a GPU's hosts are assigned to; null when
 * none is. A client market is reserved for one customer, so it never counts.
 */
export function cheapestPublicMarket(
  gpu: GpuModel,
  markets: MarketRate[] | null,
): MarketRate | null {
  return (markets ?? [])
    .filter(
      (market) =>
        gpu.markets.includes(market.address) &&
        !market.client &&
        market.usd_reward_per_hour > 0,
    )
    .reduce<MarketRate | null>(
      (cheapest, market) =>
        !cheapest || market.usd_reward_per_hour < cheapest.usd_reward_per_hour
          ? market
          : cheapest,
      null,
    );
}

/**
 * The hourly USD price, network fee included, of a GPU's cheapest public
 * market; null when none of them is priced.
 */
export function gpuHourlyUsd(
  gpu: GpuModel,
  markets: MarketRate[] | null,
): number | null {
  const market = cheapestPublicMarket(gpu, markets);
  return market ? market.usd_reward_per_hour * NETWORK_FEE_MULTIPLIER : null;
}

/**
 * The GPU a deployment gets by default: the cheapest that fits the job's VRAM
 * with a host free now, else the cheapest that fits at all. Only GPUs with a
 * market price qualify, since that price is what the deployment will pay.
 */
export function recommendGpu(
  gpus: GpuModel[],
  markets: MarketRate[] | null,
  requiredGb: number | null,
): GpuModel | null {
  const priced = gpus
    .filter((gpu) => gpu.vramGb >= (requiredGb ?? 0))
    .flatMap((gpu) => {
      const price = gpuHourlyUsd(gpu, markets);
      return price === null ? [] : [{ gpu, price }];
    })
    .sort((a, b) => a.price - b.price);
  const pick = priced.find(({ gpu }) => gpu.available > 0) ?? priced[0];
  return pick ? pick.gpu : null;
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
