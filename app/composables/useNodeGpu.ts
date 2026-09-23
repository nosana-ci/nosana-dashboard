import { NULL_ADDRESS } from "~/utils/solana";

/**
 * The GPU a job is actually running on, read from the node's public metrics.
 *
 * The market only names the hardware on mainnet, where markets are called
 * "NVIDIA 4090"; on devnet a market is called "Devnet Premium Market" and says
 * nothing about the card. The node's own report is the only source for that,
 * and it is not available until a node has been assigned — so this is
 * deliberately empty for a queued job and fills in when one picks the job up.
 */
export function useNodeGpu(node: MaybeRefOrGetter<string | undefined | null>) {
  // A job with no node yet carries the null placeholder address.
  const address = computed(() => {
    const value = toValue(node);
    return value && value !== NULL_ADDRESS ? value : "";
  });

  const url = computed(() =>
    address.value ? `/nodes/${address.value}/metrics` : "",
  );

  const { data: metrics } = useAPI(url, {
    default: () => null,
    watch: [url],
  });

  const device = computed(
    () => (metrics.value as any)?.metrics?.gpu?.devices?.[0] ?? null,
  );

  /** Just the card, e.g. "NVIDIA GeForce RTX 4090". */
  const gpuName = computed(() => device.value?.name || "");

  /** The card with its VRAM, e.g. "NVIDIA GeForce RTX 4090 · 24 GB". */
  const gpuLabel = computed(() => {
    const g = device.value;
    if (!g?.name) return "";
    const vram = g.vram_total_mb
      ? ` · ${Math.round(g.vram_total_mb / 1024)} GB`
      : "";
    return `${g.name}${vram}`;
  });

  return { metrics, gpuName, gpuLabel };
}
