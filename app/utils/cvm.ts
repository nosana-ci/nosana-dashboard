// Jobs on this market run inside a confidential VM (CVM). Their host node's
// log stream only carries the VM boot console; the workload's per-op logs are
// served by the CVM itself at wss://<jobAddress>.<nodeDomain>.
export const CVM_MARKET_ADDRESS =
  "EuYwNdSDduvFuTTS4fEgNL23rZRaTMbecM1J6fJJoQR1";

export function isCvmMarket(market: unknown): boolean {
  return !!market && market.toString() === CVM_MARKET_ADDRESS;
}
