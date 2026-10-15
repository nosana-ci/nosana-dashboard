import type { NosanaGpuModels } from "@nosana/kit";
import {
  gpusOf,
  GPU_KEY,
  type DeploymentRequirements,
  type MarketRate,
} from "~/composables/useNodeRequirements";

/**
 * A fake GPU catalogue and the markets it is priced from, for working on the
 * GPU picker without a network that has many GPUs. Dev only: on in `nuxt dev`
 * with the `mockGpus=1` cookie, so it is dropped from production builds.
 *
 *   document.cookie = "mockGpus=1; path=/"   // then reload
 *   document.cookie = "mockGpus=; path=/; max-age=0"   // off again
 */
export function isGpuMockOn(): boolean {
  return import.meta.dev && String(useCookie("mockGpus").value) === "1";
}

// Mock markets: `type` decides whether a deployment without a market may use
// them (PREMIUM only), `usd_reward_per_hour` is before the network fee.
function market(
  slug: string,
  name: string,
  usd: number,
  type = "PREMIUM",
): MarketRate {
  return {
    address: `Mock${slug}`.padEnd(44, "1"),
    name,
    type,
    usd_reward_per_hour: usd,
  };
}

const M = {
  rtx3060: market("Rtx3060", "RTX 3060", 0.04),
  rtx3070: market("Rtx3070", "RTX 3070", 0.05),
  rtx3080: market("Rtx3080", "RTX 3080", 0.07),
  rtx3090: market("Rtx3090", "RTX 3090", 0.13),
  rtx4060: market("Rtx4060", "RTX 4060", 0.05),
  rtx4070: market("Rtx4070", "RTX 4070", 0.08),
  rtx4080: market("Rtx4080", "RTX 4080", 0.16),
  rtx4090: market("Rtx4090", "RTX 4090", 0.29),
  rtx4090Pro: market("Rtx4090Pro", "RTX 4090 Pro", 0.36),
  rtx5070: market("Rtx5070", "RTX 5070", 0.1),
  rtx5080: market("Rtx5080", "RTX 5080", 0.2),
  rtx5090: market("Rtx5090", "RTX 5090", 0.42),
  workstation: market("Workstation", "Workstation GPUs", 0.24),
  ada: market("Ada", "RTX 6000 Ada", 0.62),
  l40s: market("L40s", "L40S", 0.71),
  a100: market("A100", "A100", 1.05),
  a100Sxm: market("A100Sxm", "A100 SXM", 1.25),
  h100: market("H100", "H100", 1.89),
  h100Spot: market("H100Spot", "H100 (unpriced)", 0),
  h200: market("H200", "H200", 2.65),
  b200: market("B200", "B200", 3.9),
  community: market("Community", "Community 3090", 0.11, "COMMUNITY"),
};

export const MOCK_GPU_MARKETS: MarketRate[] = Object.values(M);

// [name, VRAM GB, hosts, queued now, running a job, markets]
type Row = [string, number, number, number, number, MarketRate[]];

const ROWS: Row[] = [
  ["NVIDIA GeForce RTX 3060", 12, 41, 9, 22, [M.rtx3060]],
  ["NVIDIA GeForce RTX 3070", 8, 36, 4, 25, [M.rtx3070]],
  ["NVIDIA GeForce RTX 3080", 10, 28, 0, 19, [M.rtx3080]],
  // In a premium and a community market: listed, priced from the premium one.
  ["NVIDIA GeForce RTX 3090", 24, 52, 11, 30, [M.rtx3090, M.community]],
  ["NVIDIA GeForce RTX 4060", 8, 19, 6, 8, [M.rtx4060]],
  ["NVIDIA GeForce RTX 4070", 12, 23, 3, 14, [M.rtx4070]],
  ["NVIDIA GeForce RTX 4080", 16, 17, 2, 11, [M.rtx4080]],
  // Two premium markets at different prices: a price range.
  ["NVIDIA GeForce RTX 4090", 24, 88, 14, 61, [M.rtx4090, M.rtx4090Pro]],
  ["NVIDIA GeForce RTX 5070", 12, 9, 1, 5, [M.rtx5070]],
  ["NVIDIA GeForce RTX 5080", 16, 12, 0, 9, [M.rtx5080]],
  ["NVIDIA GeForce RTX 5090", 32, 31, 5, 22, [M.rtx5090]],
  // One model reported with two VRAM sizes: one row, the smaller size.
  ["NVIDIA RTX A2000", 6, 5, 1, 2, [M.workstation]],
  ["NVIDIA RTX A2000", 12, 4, 0, 3, [M.workstation]],
  ["NVIDIA RTX A4000", 16, 14, 3, 8, [M.workstation]],
  ["NVIDIA RTX A5000", 24, 10, 2, 6, [M.workstation]],
  ["NVIDIA RTX A6000", 48, 8, 1, 6, [M.workstation]],
  ["NVIDIA RTX 6000 Ada Generation", 48, 7, 0, 7, [M.ada]],
  ["NVIDIA L40S", 48, 11, 2, 8, [M.l40s]],
  ["NVIDIA A100-PCIE-40GB", 40, 9, 1, 7, [M.a100]],
  ["NVIDIA A100-SXM4-80GB", 80, 13, 2, 10, [M.a100Sxm]],
  // Priced in one market, unpriced in the other.
  ["NVIDIA H100 80GB HBM3", 80, 16, 3, 12, [M.h100, M.h100Spot]],
  ["NVIDIA H200", 141, 6, 1, 5, [M.h200]],
  ["NVIDIA B200", 180, 2, 0, 2, [M.b200]],
  // Only in a community market: not listed (deployments without a market are PREMIUM only).
  ["NVIDIA GeForce GTX 1080 Ti", 11, 15, 7, 6, [M.community]],
];

export const MOCK_GPU_MODELS: NosanaGpuModels = {
  gpus: ROWS.map(([name, vramGb, nodes, available, working, markets]) => ({
    name,
    vramGb,
    nodes,
    available,
    working,
    markets: markets.map((entry) => entry.address),
  })),
};

/**
 * What a mocked availability lookup answers: the queued hosts of the GPUs the
 * requirements name, halved for every other requirement, as a stand-in for
 * the specs narrowing them.
 */
export function mockQualifyingHosts(
  requirements: DeploymentRequirements,
): number {
  const names = new Set(gpusOf(requirements));
  const queued = ROWS.filter(([name]) => names.has(name)).reduce(
    (sum, [, , , available]) => sum + available,
    0,
  );
  const others = Object.keys(requirements).filter((key) => key !== GPU_KEY);
  return Math.floor(queued / 2 ** others.length);
}
