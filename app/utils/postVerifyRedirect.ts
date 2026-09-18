const STORAGE_KEY = "post_verify_redirect";

// The value is replayed into router.push, so only same-origin paths are stored;
// anything absolute would turn the verification link into an open redirect.
const isSafePath = (path: string) =>
  path.startsWith("/") && !path.startsWith("//");

// Email verification opens its own tab from the user's mail client, so the
// destination cannot ride along in the query string — localStorage is the only
// store both tabs share. Called with nothing to drop a destination that a
// previous, abandoned sign-up left behind.
export function rememberPostVerifyRedirect(path?: string | null): void {
  if (typeof localStorage === "undefined") return;
  if (path && isSafePath(path)) {
    localStorage.setItem(STORAGE_KEY, path);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Reads and clears together: a destination is good for one trip.
export function takePostVerifyRedirect(): string | null {
  if (typeof localStorage === "undefined") return null;
  const path = localStorage.getItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  return path && isSafePath(path) ? path : null;
}
