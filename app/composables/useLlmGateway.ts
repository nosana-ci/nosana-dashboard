/**
 * The LLM gateway: an OpenAI-compatible inference API that accepts the same Nosana API
 * keys used for GPU deployments, billed against the same credit balance.
 *
 * The catalog lives behind the caller's key (`GET /v1/models` authenticates), so the
 * models list is only available to a signed-in user who holds one. There is no public
 * catalog route yet; until there is, a signed-out visitor sees nothing here.
 */

export interface LlmModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  name: string;
  description: string;
  context_length: number;
  max_output_tokens: number;
  pricing: { prompt: string; completion: string };
  /** False while the model's deployment is unreachable; it stays listed either way. */
  available: boolean;
}

/**
 * The catalog carries no capability field. Embedding models are listed with a
 * one-token output limit, which the gateway enforces, so they cannot chat.
 */
/**
 * Catalog names are "<template> - <variant>", and gateway templates are all named
 * "Managed … inference", so the variant alone is the model's name.
 */
export const modelName = (model: Pick<LlmModel, "id" | "name">): string =>
  model.name?.replace(/^Managed .*? inference - /, "") || model.id;

export const isChatModel = (model: LlmModel): boolean => model.max_output_tokens > 1;

/** USD per token, as a decimal string, shown per million tokens like every other vendor. */
export const pricePerMillion = (perToken: string): number =>
  Number(perToken) * 1_000_000;

export const formatUsd = (usd: number): string => {
  if (usd === 0) return "$0";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
};

export const formatTokenCount = (tokens: number): string =>
  tokens >= 1000 ? `${Math.round(tokens / 1000)}K` : String(tokens);

/**
 * A credit is $0.001. Costs are quoted in credits because that is what the balance is
 * denominated in, and settlement rounds down to whole credits carrying the remainder.
 */
export const usdToCredits = (usd: number): number => usd / 0.001;

export const useLlmGateway = () => {
  const config = useRuntimeConfig().public;
  const { isAuthenticated } = useSuperTokens();

  const inferenceBase = (config.inferenceBase as string).replace(/\/$/, "");

  const {
    data: models,
    pending: loadingModels,
    error: modelsError,
    refresh: refreshModels,
  } = useMyAsyncData(
    "llm-models",
    async () => {
      if (!isAuthenticated.value) return [] as LlmModel[];
      const response = await $fetch<{ data: LlmModel[] }>(
        `${config.apiBase}/playground/v1/models`,
        { credentials: "include" },
      );
      return response.data ?? [];
    },
    { default: () => [] as LlmModel[], watch: [isAuthenticated] },
  );

  return {
    inferenceBase,
    models,
    loadingModels,
    modelsError,
    refreshModels,
  };
};
