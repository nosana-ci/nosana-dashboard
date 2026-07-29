import type { Vault } from "@nosana/kit";
import { useWallet } from "@nosana/solana-vue";

import { useKit } from "~/composables/useKit";
import { useSuperTokens } from "~/composables/useSuperTokens";
import { useVaultModal } from "~/composables/useVaultModal";
import {
  getVaultBalance,
  updateVaultBalance,
} from "~/composables/useDeploymentVault";

// Module-level singleton: the user's canonical shared vault. Every wallet-mode
// deployment funds this one vault, so there is exactly one per connected user.
// `resolvedFor` records which wallet address the vault belongs to, so a wallet
// switch never shows (or tops up) the previous user's vault.
const sharedVault = ref<Vault | null>(null);
const resolvedFor = ref<string | null>(null);
// Whether the user owns vaults besides the shared one (legacy / explicitly
// created). Drives the "advanced" vaults view: hidden when there are none.
const hasCustomVaults = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);
let inflight: Promise<Vault | null> | null = null;

export function useSharedVault() {
  const { nosana } = useKit();
  const { open } = useVaultModal();
  const { isAuthenticated: superTokensAuth } = useSuperTokens();
  const { account } = useWallet();

  const walletAddress = computed(() => account.value?.address ?? null);

  const invalidateIfStale = () => {
    if (resolvedFor.value && resolvedFor.value !== walletAddress.value) {
      sharedVault.value = null;
      resolvedFor.value = null;
      hasCustomVaults.value = false;
      error.value = null;
    }
  };

  // Resolve the shared vault the same way the backend's deployment-create
  // default does: the owner's OLDEST vault (created_at asc, address as
  // tiebreaker), creating one only when the user has none. `vaults.create()`
  // always mints a new vault, so it is only called on the empty case. Only
  // wallet mode has an on-chain vault; credit users fund via credits instead.
  const ensureSharedVault = async (): Promise<Vault | null> => {
    invalidateIfStale();
    if (sharedVault.value) return sharedVault.value;
    if (superTokensAuth.value || !walletAddress.value) return null;
    if (inflight) return inflight;

    const owner = walletAddress.value;

    inflight = (async () => {
      loading.value = true;
      error.value = null;
      try {
        // The wallet's signer attaches to the kit client asynchronously,
        // slightly after `account`/`connected` first become truthy — until
        // then `deployments.vaults` doesn't exist yet. Poll briefly instead
        // of giving up on the first miss (a few seconds, generous for a
        // slow wallet-standard handshake).
        let deployments = nosana.value?.api?.deployments;
        let attempts = 0;
        while (
          (!deployments || !("vaults" in deployments)) &&
          attempts < 20
        ) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          if (walletAddress.value !== owner) return null;
          deployments = nosana.value?.api?.deployments;
          attempts++;
        }

        if (!deployments || !("vaults" in deployments)) {
          console.warn(
            "[useSharedVault] deployments API never became signer-configured",
            { hasDeployments: Boolean(deployments) },
          );
          error.value = "Wallet not ready yet — try again in a moment.";
          return null;
        }

        const existing = (await deployments.vaults.list())
          // API-key vault docs have address === owner; never the shared vault.
          .filter((v) => v.address && v.address !== owner)
          .sort((a, b) => {
            const at = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
            if (at !== bt) return at - bt;
            return a.address < b.address ? -1 : 1;
          });

        const vault = existing[0] ?? (await deployments.vaults.create());

        // Discard if the wallet changed while the request was in flight.
        if (walletAddress.value !== owner) return null;

        sharedVault.value = vault;
        resolvedFor.value = owner;
        // Everything beyond the shared (oldest) vault is a custom vault.
        hasCustomVaults.value = existing.length > 1;
        await updateVaultBalance(vault);
        return vault;
      } catch (e: unknown) {
        console.error("[useSharedVault] failed to resolve shared vault:", e);
        error.value =
          e instanceof Error ? e.message : "Failed to load shared vault";
        return null;
      } finally {
        loading.value = false;
        inflight = null;
      }
    })();

    return inflight;
  };

  const sharedVaultAddress = computed(() =>
    resolvedFor.value === walletAddress.value
      ? (sharedVault.value?.address ?? null)
      : null,
  );

  // A vault is "custom" (per-deployment) unless we positively know it is the
  // shared vault. Unknown (not yet resolved) falls back to custom so existing
  // per-deployment controls keep working instead of disappearing.
  const isSharedVaultAddress = (address: string | null | undefined) =>
    sharedVaultAddress.value != null && address === sharedVaultAddress.value;

  const isCustomVaultAddress = (address: string | null | undefined) =>
    !isSharedVaultAddress(address);

  // Reactive balance read from the shared `vaultBalances` store (keyed by address).
  const balance = computed(() =>
    sharedVault.value && resolvedFor.value === walletAddress.value
      ? getVaultBalance(sharedVault.value)
      : { NOS: 0, SOL: 0 },
  );

  const updateBalance = async () => {
    if (sharedVault.value) await updateVaultBalance(sharedVault.value);
  };

  const topup = () => {
    invalidateIfStale();
    if (!sharedVault.value) return;
    open(sharedVault.value, "topup", updateBalance);
  };

  const withdraw = () => {
    invalidateIfStale();
    if (!sharedVault.value) return;
    open(sharedVault.value, "withdraw", updateBalance);
  };

  return {
    sharedVault,
    sharedVaultAddress,
    walletAddress,
    hasCustomVaults,
    balance,
    loading,
    error,
    ensureSharedVault,
    updateBalance,
    topup,
    withdraw,
    isSharedVaultAddress,
    isCustomVaultAddress,
  };
}
