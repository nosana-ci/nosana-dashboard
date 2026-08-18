export interface Purchase {
  id: string;
  amountUsd: number;
  createdAt: string;
  referenceId: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
}

export const fetchPurchaseHistory = async (): Promise<Purchase[]> => {
  const config = useRuntimeConfig().public;
  const data = await $fetch<{ purchases: Purchase[] }>(
    `${config.apiBase}/payments/purchases`,
    { credentials: "include" },
  );
  return data.purchases;
};
