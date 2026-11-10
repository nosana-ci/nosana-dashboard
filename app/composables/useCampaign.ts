/**
 * Campaign registration against client-manager's `/campaigns` API, and connecting a
 * GitHub account to a user who signed in with Google or email.
 */

export interface Campaign {
  slug: string;
  name: string;
  /** Plain text; blank lines separate paragraphs. */
  description: string | null;
  imageUrl: string | null;
  startsAt: string;
  endsAt: string;
  grantAmountUsd: number;
  upstreamRepo: string;
  requiredStars: string[];
  minGithubAccountAgeDays: number;
}

/** One line of the live checklist. The backend decides which checks exist. */
export interface CampaignCheck {
  id: string;
  label: string;
  ok: boolean;
  /** Failing a blocking check refuses the registration; failing any other sends it to review. */
  blocking: boolean;
  detail?: string;
}

export type RegistrationStatus = "granted" | "pending" | "rejected";

export interface CampaignRegistration {
  status: RegistrationStatus;
  grantedAmountUsd: number | null;
  rejectReason: string | null;
}

export interface CampaignMe {
  /** Empty once registered. */
  checks: CampaignCheck[];
  /** The user's fork of the upstream repo, when one exists under their GitHub login. */
  forkSuggestion: string | null;
  registration: CampaignRegistration | null;
}

export interface CampaignRegisterBody {
  forkUrl: string;
  superteamEarnUsername: string;
  telegram?: string;
  discord?: string;
  x?: string;
  linkedin?: string;
}

export const GITHUB_CHECK_ID = "github";

export const apiErrorMessage = (error: any, fallback: string): string =>
  error?.data?.message || fallback;

export function useCampaignApi() {
  const { apiBase } = useRuntimeConfig().public;

  return {
    getCampaign: (slug: string) =>
      $fetch<Campaign>(`${apiBase}/campaigns/${encodeURIComponent(slug)}`),

    getMe: (slug: string, forkUrl?: string) =>
      $fetch<CampaignMe>(
        `${apiBase}/campaigns/${encodeURIComponent(slug)}/me`,
        {
          credentials: "include",
          query: forkUrl ? { forkUrl } : undefined,
        },
      ),

    register: (slug: string, body: CampaignRegisterBody) =>
      $fetch<CampaignRegistration>(
        `${apiBase}/campaigns/${encodeURIComponent(slug)}/register`,
        { method: "POST", credentials: "include", body },
      ),
  };
}

// The connect flow shares the sign-in callback page, so the callback tells the two
// apart by this entry: present, and holding the `state` GitHub sent back.
const GITHUB_CONNECT_KEY = "githubConnect";

interface PendingGithubConnect {
  state: string;
  returnTo: string;
}

const githubCallbackUri = () =>
  `${window.location.origin}/st-auth/callback/github`;

/**
 * Returns the pending connect when `state` belongs to it, and clears it either way.
 * A mismatch means this callback is an ordinary GitHub sign-in.
 */
export function takePendingGithubConnect(
  state: string | null,
): PendingGithubConnect | null {
  const raw = sessionStorage.getItem(GITHUB_CONNECT_KEY);
  sessionStorage.removeItem(GITHUB_CONNECT_KEY);
  if (!raw || !state) return null;
  try {
    const pending = JSON.parse(raw) as PendingGithubConnect;
    return pending.state === state ? pending : null;
  } catch {
    return null;
  }
}

export function connectGithub(code: string, state: string) {
  const { apiBase } = useRuntimeConfig().public;
  return $fetch<{ githubLogin: string }>(`${apiBase}/user/github/connect`, {
    method: "POST",
    credentials: "include",
    body: { code, state, redirectUri: githubCallbackUri() },
  });
}

// The backend's `state` is valid for 10 minutes; refetch before that runs out.
const CONNECT_URL_MAX_AGE_MS = 8 * 60 * 1000;

/**
 * Safari only follows a navigation made synchronously in the click handler, so the
 * authorize URL is fetched ahead of the click and `start` just assigns it.
 */
export function useGithubConnect() {
  const { apiBase } = useRuntimeConfig().public;
  let url: string | null = null;
  let fetchedAt = 0;

  const fetchUrl = async () => {
    const response = await $fetch<{ url: string }>(
      `${apiBase}/user/github/connect/start`,
      { credentials: "include", query: { redirectUri: githubCallbackUri() } },
    );
    url = response.url;
    fetchedAt = Date.now();
    return url;
  };

  const prefetch = () =>
    fetchUrl().catch((error) =>
      console.error("Error fetching GitHub connect URL:", error),
    );

  const start = async (returnTo: string) => {
    const target =
      url && Date.now() - fetchedAt < CONNECT_URL_MAX_AGE_MS
        ? url
        : await fetchUrl();
    const state = new URL(target).searchParams.get("state") || "";
    sessionStorage.setItem(
      GITHUB_CONNECT_KEY,
      JSON.stringify({ state, returnTo }),
    );
    window.location.href = target;
  };

  return { prefetch, start };
}
