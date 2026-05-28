const STORAGE_PREFIX = "free_credits_verify_dismissed:";

export function isFreeCreditsVerifyDismissed(userId?: string | null): boolean {
  if (!userId || typeof localStorage === "undefined") return false;
  return localStorage.getItem(`${STORAGE_PREFIX}${userId}`) === "1";
}

export function setFreeCreditsVerifyDismissed(userId?: string | null): void {
  if (!userId || typeof localStorage === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${userId}`, "1");
}

export function clearFreeCreditsVerifyDismissed(userId?: string | null): void {
  if (!userId || typeof localStorage === "undefined") return;
  localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
}
