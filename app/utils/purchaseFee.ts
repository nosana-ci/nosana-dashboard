// Card and USDC purchases pay a fee on top of the credits bought; the rate
// comes from the backend in basis points (200 = 2%).
const BPS = 10_000;

/** Fee in USD on `amountUsd` of credits, rounded to cents like the backend. */
export const purchaseFeeUsd = (amountUsd: number, feeBps: number): number =>
  Math.round((amountUsd * 100 * feeBps) / BPS) / 100;

/** What the user pays for `amountUsd` of credits. */
export const purchaseTotalUsd = (amountUsd: number, feeBps: number): number =>
  (Math.round(amountUsd * 100) + Math.round((amountUsd * 100 * feeBps) / BPS)) /
  100;

/**
 * USDC to send so `creditsUsd` of credits remain after the fee. Rounded up to
 * USDC's 6 decimals so the backend's floor never lands below the request.
 */
export const usdcToSend = (creditsUsd: number, feeBps: number): number =>
  Math.ceil((creditsUsd * 1e6 * (BPS + feeBps)) / BPS) / 1e6;
