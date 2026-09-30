/**
 * The signed-in user's API keys, shared by the developers page and the playground's
 * code panel so both read one list.
 */

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: "active" | "disabled" | "expired";
  scopes?: string[];
  createdAt: string;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
}

export const maskKey = (key: string) => {
  if (!key) return "";
  if (key.length <= 8) return key;

  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  const masked = "•".repeat(Math.min(key.length - 8, 20));

  return `${start}${masked}${end}`;
};

export const useApiKeys = () => {
  const config = useRuntimeConfig().public;
  const { isAuthenticated } = useSuperTokens();

  const {
    data: apiKeys,
    pending: loadingKeys,
    refresh: refreshKeys,
  } = useMyAsyncData(
    "api-keys",
    async () => {
      if (!isAuthenticated.value) {
        return { keys: [] as ApiKey[], total: 0 };
      }

      return await $fetch<{ keys: ApiKey[]; total: number }>(
        `${config.apiBase}/api-keys`,
        { credentials: "include" },
      );
    },
    {
      default: () => ({ keys: [] as ApiKey[], total: 0 }),
      watch: [isAuthenticated],
    },
  );

  return { apiKeys, loadingKeys, refreshKeys };
};
