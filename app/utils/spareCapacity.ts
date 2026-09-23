export const SPARE_CAPACITY_TOPUP_DISABLED =
  "Topping up credits is not available for spare capacity accounts.";

export const isNoSpareCapacityError = (message?: string) =>
  !!message?.includes("Not enough spare capacity");
