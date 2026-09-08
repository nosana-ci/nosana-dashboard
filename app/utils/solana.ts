// Default Solana public key (PublicKey.default) — used when no node is assigned to a job.
export const NULL_ADDRESS = '11111111111111111111111111111111';

// Middle-truncate an address for display, e.g. "AbCd…WxYz".
export const truncateMiddle = (value: string, head = 4, tail = 4): string =>
  value && value.length > head + tail + 4
    ? `${value.slice(0, head)}…${value.slice(-tail)}`
    : value;

// Resolve a market address to its Testgrid display name, falling back to a
// truncated address. Shared by the dialogs that show a deployment's GPU.
export const marketName = (
  address: string | undefined | null,
  testgridMarkets: Array<{ address?: string; name?: string }> | undefined,
): string => {
  if (!address) return "-";
  const match = testgridMarkets?.find((tgm) => tgm.address === address);
  return match?.name || truncateMiddle(address);
};
