<template>
  <div>
    <TopBar
      :title="campaign?.name || 'Campaign'"
      :subtitle="
        campaign ? `Register to receive $${campaign.grantAmountUsd} in credits` : ''
      "
    />

    <Loader v-if="loading" />

    <div v-else-if="loadError" class="notification is-danger is-light">
      {{ loadError }}
    </div>

    <template v-else-if="campaign && me">
      <div v-if="me.registration" class="box">
        <template v-if="me.registration.status === 'granted'">
          <h2 class="title is-5">You're in</h2>
          <p>
            <strong>${{ me.registration.grantedAmountUsd }}</strong> in credits has been added
            to your account.
          </p>
        </template>
        <template v-else-if="me.registration.status === 'pending'">
          <h2 class="title is-5">Registration received</h2>
          <p>We'll review your registration.</p>
        </template>
        <template v-else>
          <h2 class="title is-5">Registration rejected</h2>
          <p>{{ me.registration.rejectReason }}</p>
        </template>
      </div>

      <div v-else-if="!isOpen" class="notification is-light">
        Registration for this campaign is closed.
      </div>

      <div v-else class="columns">
        <div class="column is-7">
          <div v-if="!githubConnected" class="box">
            <h2 class="title is-5">Connect GitHub</h2>
            <p class="mb-4">
              We use your GitHub account to check your fork and starred repositories.
            </p>
            <button
              class="button is-dark"
              :class="{ 'is-loading': connecting }"
              @click="connect"
            >
              Connect GitHub
            </button>
          </div>

          <form class="box" @submit.prevent="submit">
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
              <label class="label" for="superteam">Superteam Earn username</label>
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

            <div class="columns is-multiline">
              <div v-for="social in socials" :key="social.key" class="column is-6">
                <div class="field">
                  <label class="label" :for="social.key">
                    {{ social.label }}
                    <span class="has-text-grey has-text-weight-normal">(optional)</span>
                  </label>
                  <div class="control">
                    <input
                      :id="social.key"
                      v-model.trim="form[social.key]"
                      class="input"
                      type="text"
                    />
                  </div>
                </div>
              </div>
            </div>

            <p v-if="submitError" class="help is-danger mb-3">{{ submitError }}</p>

            <button
              type="submit"
              class="button is-primary"
              :class="{ 'is-loading': submitting }"
              :disabled="!githubConnected || !form.superteamEarnUsername"
            >
              Register
            </button>
          </form>
        </div>

        <div class="column is-5">
          <div class="box">
            <h2 class="title is-6">Requirements</h2>
            <ul>
              <li
                v-for="check in me.checks"
                :key="check.id"
                class="is-flex is-align-items-flex-start mb-3"
              >
                <StatusMark :tone="check.ok ? 'ok' : 'danger'" :size="16" class="mr-2 mt-1" />
                <div>
                  <div>{{ check.label }}</div>
                  <div v-if="check.detail" class="is-size-7 has-text-grey">
                    {{ check.detail }}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn, useEventListener } from "@vueuse/core";
import Loader from "~/components/Loader.vue";
import StatusMark from "~/components/Common/StatusMark.vue";
import {
  GITHUB_CHECK_ID,
  apiErrorMessage,
  useCampaignApi,
  useGithubConnect,
  type Campaign,
  type CampaignMe,
  type CampaignRegisterBody,
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
const submitting = ref(false);
const submitError = ref<string | null>(null);

const form = reactive<Required<CampaignRegisterBody>>({
  forkUrl: "",
  superteamEarnUsername: "",
  telegram: "",
  discord: "",
  x: "",
  linkedin: "",
});

const isOpen = computed(() => {
  if (!campaign.value) return false;
  const now = Date.now();
  return (
    now >= new Date(campaign.value.startsAt).getTime() &&
    now <= new Date(campaign.value.endsAt).getTime()
  );
});
const upstreamName = computed(() => campaign.value?.upstreamRepo.split("/")[1] || "repo");
const githubConnected = computed(
  () => me.value?.checks.find((check) => check.id === GITHUB_CHECK_ID)?.ok ?? false,
);

const refreshMe = async () => {
  const request = meRequests.begin();
  try {
    const result = await api.getMe(slug, form.forkUrl || undefined);
    if (!meRequests.isCurrent(request)) return;
    me.value = result;
    if (!form.forkUrl && result.forkSuggestion) form.forkUrl = result.forkSuggestion;
  } catch (error) {
    if (meRequests.isCurrent(request)) console.error("Error refreshing campaign checks:", error);
  }
};

const refreshMeSoon = useDebounceFn(refreshMe, 500);
watch(() => form.forkUrl, refreshMeSoon);
// Starring and forking happen on GitHub, so re-check whenever the user comes back.
useEventListener(window, "focus", refreshMe);

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
    loadError.value =
      error?.status === 404
        ? "This campaign does not exist."
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
    submitError.value = apiErrorMessage(error, "Could not start connecting GitHub.");
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
    const registration = await api.register(slug, body);
    me.value = { ...me.value!, registration };
  } catch (error) {
    submitError.value = apiErrorMessage(error, "Registration failed. Please try again.");
    refreshMe();
  } finally {
    submitting.value = false;
  }
};
</script>
