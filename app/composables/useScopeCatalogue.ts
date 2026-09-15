import { computed } from "vue";

// The scope vocabulary, with the wording shown to users.
//
// Served by the identity manager at /auth/scopes so the descriptions stay in step with
// what the backend enforces — hard-coding them here would let the list drift from the
// scopes that actually exist. Public and cacheable, so no session is needed.
//
// `scopes` is the full list, which is what an API-key picker wants. A picker for OAuth
// apps wants `oauthGrantable`: an app cannot hold a scope whose routes only accept an
// API key, and the backend is the one that decides which those are.

export interface ScopeDescriptor {
  scope: string;
  description: string;
  oauthGrantable: boolean;
}

export const useScopeCatalogue = () => {
  const config = useRuntimeConfig().public;

  const { data, pending, error } = useMyAsyncData(
    "auth-scopes",
    async () => {
      return await $fetch<{ scopes: ScopeDescriptor[] }>(
        `${config.apiBase}/auth/scopes`,
      );
    },
    { default: () => ({ scopes: [] as ScopeDescriptor[] }) },
  );

  const scopes = computed<ScopeDescriptor[]>(() => data.value?.scopes ?? []);
  const scopeNames = computed(() => scopes.value.map((entry) => entry.scope));

  /** The subset an OAuth app may be given — for a connected-apps scope picker. */
  const oauthGrantableScopes = computed(() =>
    scopes.value.filter((entry) => entry.oauthGrantable),
  );

  /** The descriptions say so themselves; this is only used to flag them in the UI. */
  const spendsCredits = (description: string) => /credits/i.test(description);

  return {
    scopes,
    scopeNames,
    oauthGrantableScopes,
    loading: pending,
    error,
    spendsCredits,
  };
};
