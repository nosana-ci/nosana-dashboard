<template>
  <div class="columns is-centered">
    <div class="column is-8-desktop is-three-fifths-widescreen">
      <Loader v-if="loading" />

      <div v-else-if="loadError" class="notification is-danger is-light">
        {{ loadError }}
      </div>

      <template v-else-if="campaign && me">
        <div class="card mb-5">
          <div v-if="campaign.imageUrl" class="card-image">
            <figure class="image">
              <img :src="campaign.imageUrl" :alt="campaign.name" />
            </figure>
          </div>
          <div class="card-content">
            <h1 class="title is-3 mb-3">{{ campaign.name }}</h1>
            <div class="tags mb-4">
              <span class="tag is-medium has-text-weight-semibold">
                ${{ campaign.grantAmountUsd }} in credits
              </span>
              <span class="tag is-medium">{{ periodLabel }}</span>
            </div>
            <div v-if="paragraphs.length" class="content">
              <p v-for="(paragraph, i) in paragraphs" :key="i">
                {{ paragraph }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="me.registration"
          class="notification is-light"
          :class="registrationTone"
        >
          <template v-if="me.registration.status === 'granted'">
            <p class="title is-5">You're in</p>
            <p>
              <strong>${{ me.registration.grantedAmountUsd }}</strong> in
              credits has been added to your account.
              <NuxtLink to="/deployments/create">Start deploying</NuxtLink>
            </p>
          </template>
          <template v-else-if="me.registration.status === 'pending'">
            <p class="title is-5">Registration received</p>
            <p>We'll review your registration.</p>
          </template>
          <template v-else>
            <p class="title is-5">Registration not accepted</p>
            <p>{{ me.registration.rejectReason }}</p>
          </template>
        </div>

        <div v-else-if="!isOpen" class="notification is-light">
          <template v-if="notStarted">
            Registration opens on
            {{ new Date(campaign.startsAt).toLocaleString() }}.
          </template>
          <template v-else>Registration for this campaign is closed.</template>
        </div>

        <div v-else class="box">
          <div
            class="is-flex is-justify-content-space-between is-align-items-center mb-3"
          >
            <h2 class="title is-5 mb-0">1. Meet the requirements</h2>
            <span class="tag is-rounded"
              >{{ checksDone }} of {{ me.checks.length }}</span
            >
          </div>

          <div
            v-for="check in me.checks"
            :key="check.id"
            class="is-flex is-align-items-center py-3 requirement"
          >
            <StatusMark
              :tone="check.ok ? 'ok' : check.blocking ? 'danger' : 'warn'"
              :size="16"
              class="mr-3"
            />
            <div class="is-flex-grow-1">
              <p>{{ check.label }}</p>
              <p v-if="requirementNote(check)" class="is-size-7 has-text-grey">
                {{ requirementNote(check) }}
              </p>
            </div>
            <button
              v-if="check.id === GITHUB_CHECK_ID && !check.ok"
              type="button"
              class="button is-dark is-small ml-3"
              :class="{ 'is-loading': connecting }"
              @click="connect"
            >
              Connect GitHub
            </button>
            <a
              v-else-if="githubAction(check)"
              :href="githubAction(check)!.href"
              target="_blank"
              rel="noopener"
              class="button is-small ml-3"
            >
              {{ githubAction(check)!.label }}
            </a>
          </div>
          <p v-if="checkError" class="help is-danger">{{ checkError }}</p>
          <p v-if="connectError" class="help is-danger">{{ connectError }}</p>

          <form class="mt-6" @submit.prevent="submit">
            <h2 class="title is-5">2. Your details</h2>

            <div class="field">
              <label class="label" for="fork-url">Fork URL</label>
              <div class="control">
                <input
                  id="fork-url"
                  v-model.trim="form.forkUrl"
                  class="input"
                  type="url"
                  :placeholder="`https://github.com/you/${upstreamName}`"
                />
              </div>
            </div>

            <div class="field">
              <label class="label" for="superteam"
                >Superteam Earn username</label
              >
              <div class="control">
                <input
                  id="superteam"
                  v-model.trim="form.superteamEarnUsername"
                  class="input"
                  type="text"
                  required
                />
              </div>
            </div>

            <div v-if="campaign.requireWalletVerification" class="field">
              <label class="label">Solana wallet</label>
              <div
                v-if="verifiedWallet"
                class="is-flex is-align-items-center"
              >
                <StatusMark tone="ok" :size="16" class="mr-2" />
                <span>{{ shortAddress(verifiedWallet.address) }}</span>
                <a
                  class="ml-3 is-size-7"
                  href="#"
                  @click.prevent="verifiedWallet = null"
                  >Change</a
                >
              </div>
              <template v-else>
                <p class="help mt-0 mb-2">
                  Connect a wallet and sign a message to prove you own it. This
                  does not sign you in with it.
                </p>
                <div class="buttons">
                  <button
                    v-if="connected"
                    type="button"
                    class="button is-small"
                    :class="{ 'is-loading': verifyingWallet }"
                    @click="verifyWallet()"
                  >
                    Sign with {{ activeWallet?.name ?? "connected wallet" }}
                  </button>
                  <template v-else>
                    <button
                      v-for="option in wallets"
                      :key="option.name"
                      type="button"
                      class="button is-small"
                      :disabled="verifyingWallet"
                      @click="verifyWallet(option)"
                    >
                      <img
                        :src="option.icon"
                        :alt="option.name"
                        class="wallet-icon mr-2"
                      />
                      {{ option.name }}
                    </button>
                  </template>
                </div>
                <p v-if="!connected && !wallets.length" class="help">
                  No Solana wallet found in this browser.
                </p>
                <p v-if="walletError" class="help is-danger">
                  {{ walletError }}
                </p>
              </template>
            </div>

            <label class="label mt-5">
              Socials
              <span class="has-text-grey has-text-weight-normal"
                >(optional)</span
              >
            </label>
            <div class="columns is-multiline is-variable is-2 mb-4">
              <div
                v-for="social in socials"
                :key="social.key"
                class="column is-6"
              >
                <input
                  :id="social.key"
                  v-model.trim="form[social.key]"
                  class="input"
                  type="text"
                  :placeholder="social.label"
                  :aria-label="social.label"
                />
              </div>
            </div>

            <p v-if="submitError" class="help is-danger mb-3">
              {{ submitError }}
            </p>

            <button
              type="submit"
              class="button is-primary is-fullwidth"
              :class="{ 'is-loading': submitting }"
              :disabled="!canRegister"
            >
              Register
            </button>
            <p
              v-if="!requirementsMet"
              class="help has-text-centered has-text-grey"
            >
              Meet the requirements above to register.
            </p>
          </form>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { until, useDebounceFn, useEventListener } from "@vueuse/core";
import { createNosanaAuthorization } from "@nosana/kit";
import {
  useSignMessage,
  useSolanaWallets,
  useWallet,
} from "@nosana/solana-vue";
import Loader from "~/components/Loader.vue";
import StatusMark from "~/components/Common/StatusMark.vue";
import {
  GITHUB_CHECK_ID,
  apiErrorMessage,
  campaignWalletMessage,
  useCampaignApi,
  useGithubConnect,
  type Campaign,
  type CampaignCheck,
  type CampaignMe,
  type CampaignRegisterBody,
  type CampaignWallet,
} from "~/composables/useCampaign";

type SocialKey = "telegram" | "discord" | "x" | "linkedin";

const socials: { key: SocialKey; label: string }[] = [
  { key: "telegram", label: "Telegram" },
  { key: "discord", label: "Discord" },
  { key: "x", label: "X" },
  { key: "linkedin", label: "LinkedIn" },
];

const route = useRoute();
const slug = route.params.slug as string;
const api = useCampaignApi();
const github = useGithubConnect();
const meRequests = useLatestRequest();

const campaign = ref<Campaign | null>(null);
const me = ref<CampaignMe | null>(null);
const loading = ref(true);
const loadError = ref<string | null>(null);
const connecting = ref(false);
const connectError = ref<string | null>(null);
const submitting = ref(false);
const submitError = ref<string | null>(null);
// A failed re-check keeps the last checklist on screen, so say it is out of date.
const checkError = ref<string | null>(null);

const { wallets } = useSolanaWallets();
const {
  connected,
  account,
  wallet: activeWallet,
  connect: connectWallet,
  disconnect: disconnectWallet,
} = useWallet();
const signMessage = useSignMessage(account);
const verifiedWallet = ref<CampaignWallet | null>(null);
const verifyingWallet = ref(false);
const walletError = ref<string | null>(null);

const form = reactive<Required<Omit<CampaignRegisterBody, "wallet">>>({
  forkUrl: "",
  superteamEarnUsername: "",
  telegram: "",
  discord: "",
  x: "",
  linkedin: "",
});

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const paragraphs = computed(
  () =>
    campaign.value?.description?.split(/\n\s*\n/).filter((p) => p.trim()) ?? [],
);

// A failing non-blocking check needs saying that it only sends the registration to review.
const requirementNote = (check: CampaignCheck) =>
  !check.ok && !check.blocking
    ? `${check.detail ? check.detail + ". " : ""}You can still register; we'll review it first.`
    : check.detail;

// Forking and starring happen on GitHub; the focus re-check picks them up on return.
const githubAction = (check: CampaignCheck) => {
  if (check.ok || !campaign.value) return null;
  if (check.id === "fork") {
    return {
      label: "Fork on GitHub",
      href: `https://github.com/${campaign.value.upstreamRepo}/fork`,
    };
  }
  if (check.id.startsWith("star:")) {
    return {
      label: "Star on GitHub",
      href: `https://github.com/${check.id.slice(5)}`,
    };
  }
  return null;
};

const checksDone = computed(
  () => me.value?.checks.filter((check) => check.ok).length ?? 0,
);
const requirementsMet = computed(
  () => !!me.value?.checks.every((check) => check.ok || !check.blocking),
);
const canRegister = computed(
  () =>
    requirementsMet.value &&
    !!form.superteamEarnUsername &&
    (!campaign.value?.requireWalletVerification || !!verifiedWallet.value),
);
const registrationTone = computed(
  () =>
    ({ granted: "is-success", pending: "is-warning", rejected: "is-danger" })[
      me.value?.registration?.status ?? "pending"
    ],
);
const periodLabel = computed(() => {
  if (!campaign.value) return "";
  if (notStarted.value) return `Opens ${formatDate(campaign.value.startsAt)}`;
  if (isOpen.value) return `Open until ${formatDate(campaign.value.endsAt)}`;
  return `Closed ${formatDate(campaign.value.endsAt)}`;
});

const notStarted = computed(
  () =>
    !!campaign.value &&
    Date.now() < new Date(campaign.value.startsAt).getTime(),
);
const isOpen = computed(
  () =>
    !!campaign.value &&
    !notStarted.value &&
    Date.now() <= new Date(campaign.value.endsAt).getTime(),
);
const upstreamName = computed(
  () => campaign.value?.upstreamRepo.split("/")[1] || "repo",
);
const githubConnected = computed(
  () =>
    me.value?.checks.find((check) => check.id === GITHUB_CHECK_ID)?.ok ?? false,
);

const refreshMe = async () => {
  const request = meRequests.begin();
  try {
    const result = await api.getMe(slug, form.forkUrl || undefined);
    if (!meRequests.isCurrent(request)) return;
    me.value = result;
    checkError.value = null;
    if (!form.forkUrl && result.forkSuggestion)
      form.forkUrl = result.forkSuggestion;
  } catch (error) {
    if (!meRequests.isCurrent(request)) return;
    checkError.value = apiErrorMessage(
      error,
      "Could not re-check the requirements.",
    );
  }
};

const refreshMeSoon = useDebounceFn(refreshMe, 500);
watch(() => form.forkUrl, refreshMeSoon);
// Starring and forking happen on GitHub, so re-check when the user comes back while
// something is still missing.
useEventListener(window, "focus", () => {
  if (me.value?.checks.some((check) => !check.ok)) refreshMe();
});

onMounted(async () => {
  try {
    const [campaignResult, meResult] = await Promise.all([
      api.getCampaign(slug),
      api.getMe(slug),
    ]);
    campaign.value = campaignResult;
    me.value = meResult;
    if (meResult.forkSuggestion) form.forkUrl = meResult.forkSuggestion;
    if (!githubConnected.value) github.prefetch();
  } catch (error: any) {
    // Wallet sign-ins have no SuperTokens session, which the campaign API requires.
    loadError.value =
      error?.status === 404
        ? "This campaign does not exist."
        : error?.status === 401
          ? "Campaigns need an email, Google or GitHub account. Sign out of your wallet and sign in with one of those to register."
          : apiErrorMessage(error, "Could not load this campaign.");
  } finally {
    loading.value = false;
  }
});

const connect = async () => {
  connecting.value = true;
  try {
    await github.start(route.fullPath);
  } catch (error) {
    connecting.value = false;
    connectError.value = apiErrorMessage(
      error,
      "Could not start connecting GitHub.",
    );
  }
};

const shortAddress = (address: string) =>
  `${address.slice(0, 4)}...${address.slice(-4)}`;

// Connecting here is only for signing: nothing writes the wallet session cookie, and a
// wallet this page connected is disconnected again, since the rest of the app treats a
// connected wallet as wallet mode (and `WalletProvider` would auto-connect it next visit).
const verifyWallet = async (choice?: (typeof wallets.value)[number]) => {
  verifyingWallet.value = true;
  walletError.value = null;
  const connectedHere = !connected.value;
  try {
    if (connectedHere) {
      if (!choice) return;
      await connectWallet(choice);
      await until(signMessage).toBeTruthy({ timeout: 10_000, throwOnTimeout: true });
    }
    if (!account.value || !signMessage.value) {
      throw new Error("Wallet cannot sign messages");
    }
    const sign = signMessage.value;
    // A store-less instance: `nosana.authorization` caches into the wallet login cookie.
    const authorization = createNosanaAuthorization(
      async (bytes) => (await sign({ message: bytes })).signature,
    );
    const message = campaignWalletMessage(slug, new Date().toISOString());
    const signed = await authorization.generate(message);
    verifiedWallet.value = {
      address: account.value.address,
      message,
      // `generate` returns `<message>:<base58 signature>`.
      signature: signed.slice(message.length + 1),
    };
  } catch (error) {
    console.error("Wallet verification failed:", error);
    walletError.value = "Could not verify your wallet. Please try again.";
  } finally {
    if (connectedHere && connected.value) {
      await disconnectWallet().catch((error) =>
        console.error("Error disconnecting wallet:", error),
      );
    }
    verifyingWallet.value = false;
  }
};

const submit = async () => {
  submitting.value = true;
  submitError.value = null;
  try {
    const body: CampaignRegisterBody = {
      forkUrl: form.forkUrl,
      superteamEarnUsername: form.superteamEarnUsername,
    };
    for (const { key } of socials) {
      if (form[key]) body[key] = form[key];
    }
    if (campaign.value?.requireWalletVerification && verifiedWallet.value) {
      body.wallet = verifiedWallet.value;
    }
    const registration = await api.register(slug, body);
    me.value = { ...me.value!, registration };
  } catch (error) {
    submitError.value = apiErrorMessage(
      error,
      "Registration failed. Please try again.",
    );
    // An expired, invalid or already-used signature can only be fixed by signing again.
    if (/wallet/i.test(submitError.value)) verifiedWallet.value = null;
    refreshMe();
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.requirement + .requirement {
  border-top: 1px solid var(--bulma-border-weak);
}

.wallet-icon {
  width: 16px;
  height: 16px;
}
</style>
