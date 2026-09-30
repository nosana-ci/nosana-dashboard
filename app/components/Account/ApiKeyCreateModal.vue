<template>
  <div class="modal" :class="{ 'is-active': open }">
    <div class="modal-background" @click="open = false"></div>
    <div class="modal-card is-app-modal is-normal">
      <header class="modal-card-head">
        <div class="is-flex is-align-items-center is-gap-2 is-flex-grow-1">
          <span class="app-modal-icon">
            <KeyIcon />
          </span>
          <p class="modal-card-title title is-5 mb-0">Create API key</p>
        </div>
        <button class="delete" aria-label="Close" @click="open = false"></button>
      </header>
      <section class="modal-card-body">
        <div class="columns">
          <div class="column is-7 field mb-0">
            <label class="label">Name</label>
            <div class="control">
              <input
                v-model="newKeyName"
                class="input"
                type="text"
                placeholder="e.g. My app"
                maxlength="100"
              />
            </div>
          </div>

          <div class="column field mb-0">
            <label class="label">Expires</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="newKeyExpiration">
                  <option value="">Never</option>
                  <option :value="7 * 24 * 60 * 60">7 days</option>
                  <option :value="30 * 24 * 60 * 60">30 days</option>
                  <option :value="90 * 24 * 60 * 60">90 days</option>
                  <option :value="365 * 24 * 60 * 60">1 year</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- One choice first; the full list only when someone asks for it. -->
        <div v-if="scopeCatalogue.length" class="field">
          <label class="label">Access</label>
          <div class="seg-tabs is-fullwidth" role="group" aria-label="Access">
            <button
              v-for="option in ACCESS"
              :key="option.id"
              type="button"
              :class="{ 'is-active': access === option.id }"
              :aria-pressed="access === option.id"
              @click="setAccess(option.id)"
            >
              {{ option.label }}
            </button>
          </div>

          <p class="access-note mt-3">
            <strong>{{ currentAccess.lead }}</strong> {{ currentAccess.detail }}
          </p>

          <ScopePicker
            v-if="access === 'custom'"
            v-model="selectedScopes"
            class="mt-3"
            label=""
          />
          <div v-else class="is-flex is-flex-wrap-wrap is-gap-1 mt-3">
            <span
              v-for="entry in summary"
              :key="entry.resource"
              class="access-pill"
              :class="{ 'is-held': entry.verbs.length }"
            >
              <FontAwesomeIcon v-if="entry.verbs.length" :icon="faCheck" />
              {{ entry.label
              }}<template v-if="entry.verbs.length">: {{ entry.verbs.join(", ") }}</template>
            </span>
          </div>

          <p class="access-cost is-size-7 mt-3">
            <FontAwesomeIcon
              v-if="canSpendCredits"
              :icon="faCoins"
              class="has-text-warning mr-1"
            />
            {{
              canSpendCredits
                ? "This key can spend credits."
                : "This key can't spend credits."
            }}
          </p>
        </div>
        <ScopePicker
          v-else
          v-model="selectedScopes"
          unavailable-note="Couldn't load the permission list, so this key will be created with full access."
        />
      </section>
      <footer class="modal-card-foot">
        <p class="has-text-grey is-size-7 modal-foot-summary">
          Access can't be changed later. Create a new key instead.
        </p>
        <div class="buttons mb-0">
          <button @click="open = false" class="button">Cancel</button>
          <button
            @click="createKey"
            class="button is-success"
            :disabled="!newKeyName || !canSubmitScopes || creatingKey"
            :class="{ 'is-loading': creatingKey }"
          >
            Create key
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "vue-toastification";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faCheck, faCoins } from "@fortawesome/free-solid-svg-icons";
import ScopePicker from "~/components/Account/ScopePicker.vue";
import KeyIcon from "@/assets/img/icons/key.svg?component";
import type { ApiKey } from "~/composables/useApiKeys";
import { scopeResourceLabel } from "~/composables/useScopeCatalogue";

const open = defineModel<boolean>({ default: false });
const emit = defineEmits<{ created: [key: ApiKey] }>();

const config = useRuntimeConfig().public;
const { isAuthenticated } = useSuperTokens();
const toast = useToast();

const newKeyName = ref("");
const newKeyExpiration = ref("");
const creatingKey = ref(false);

const {
  scopes: scopeCatalogue,
  scopeNames,
  spendsCredits,
} = useScopeCatalogue();

type Access = "full" | "read" | "custom";

const ACCESS: { id: Access; label: string; lead: string; detail: string }[] = [
  {
    id: "full",
    label: "Full access",
    lead: "Everything your account can do.",
    detail: "Run jobs and deployments, call inference, and manage keys and apps.",
  },
  {
    id: "read",
    label: "Read only",
    lead: "Look, don't touch.",
    detail: "It can read your account's data but can't start or change anything.",
  },
  {
    id: "custom",
    label: "Custom",
    lead: "Pick exactly what this key may do.",
    detail: "",
  },
];

// Full access by default, so creating a key without thinking about permissions
// yields the same key it did before there was a choice. Narrowing is a deliberate act.
const access = ref<Access>("full");
const currentAccess = computed(
  () => ACCESS.find((option) => option.id === access.value)!,
);

const selectedScopes = ref<string[]>([]);

const scopesFor = (level: Access) =>
  level === "read"
    ? scopeNames.value.filter((scope) => scope.endsWith(":read"))
    : [...scopeNames.value];

// Custom starts from whatever the previous choice held, so it can be trimmed.
const setAccess = (level: Access) => {
  access.value = level;
  if (level !== "custom") selectedScopes.value = scopesFor(level);
};

watch(
  scopeNames,
  (names) => {
    if (names.length && !selectedScopes.value.length) {
      selectedScopes.value = scopesFor(access.value);
    }
  },
  { immediate: true },
);

/** What the chosen level holds, one entry per resource, for the summary pills. */
const summary = computed(() => {
  const held = new Set(selectedScopes.value);
  const byResource = new Map<
    string,
    { resource: string; label: string; verbs: string[] }
  >();
  for (const scope of scopeNames.value) {
    const [resource = "", verb = ""] = scope.split(":");
    if (!byResource.has(resource)) {
      byResource.set(resource, {
        resource,
        label: scopeResourceLabel(resource),
        verbs: [],
      });
    }
    if (held.has(scope)) byResource.get(resource)!.verbs.push(verb);
  }
  return [...byResource.values()];
});

const canSpendCredits = computed(() =>
  scopeCatalogue.value.some(
    (entry) =>
      selectedScopes.value.includes(entry.scope) &&
      spendsCredits(entry.description),
  ),
);

// A key must hold at least one permission — but if the catalogue never loaded there is
// nothing to tick, and blocking creation over that would be worse than the old behaviour.
const canSubmitScopes = computed(
  () => !scopeCatalogue.value.length || selectedScopes.value.length > 0,
);

const createKey = async () => {
  if (!newKeyName.value || !isAuthenticated.value) return;

  try {
    creatingKey.value = true;
    const payload: any = { name: newKeyName.value };
    // Omitted when there is no catalogue: the backend then falls back to the caller's own
    // scopes, which is exactly how creation behaved before this picker.
    if (selectedScopes.value.length) {
      payload.scopes = [...selectedScopes.value];
    }
    if (newKeyExpiration.value) {
      payload.expiresIn = parseInt(newKeyExpiration.value);
    }

    const response = await $fetch<ApiKey>(`${config.apiBase}/api-keys`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    });

    toast.success("API key created successfully!");

    open.value = false;
    newKeyName.value = "";
    newKeyExpiration.value = "";
    setAccess("full");
    emit("created", response);
  } catch (error: any) {
    console.error("Error creating key:", error);
    toast.error(error.data?.message || "Failed to create API key");
  } finally {
    creatingKey.value = false;
  }
};
</script>

<style scoped lang="scss">
.access-note,
.access-cost,
.access-pill {
  color: $grey-dark;
}

.access-note strong {
  color: $text;
}

.access-pill {
  border: 1px solid $border-soft;
  border-radius: 999px;
  padding: 2px 11px;
  font-size: 0.85rem;

  &.is-held {
    color: $text;
  }

  svg {
    margin-right: 3px;
    color: $secondary;
  }
}

html.dark-mode {
  .access-note,
  .access-cost,
  .access-pill {
    color: $text-muted;
  }

  .access-note strong,
  .access-pill.is-held {
    color: $white;
  }

  .access-pill {
    border-color: rgba($white, 0.12);
  }
}
</style>
