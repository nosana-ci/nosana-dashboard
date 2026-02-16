<template>
  <div>
    <TopBar
      title="Deployments"
      subtitle="Find information about your deployments here"
    />

    <div class="level mb-4">
      <div class="level-left"></div>
      <div class="level-right">
        <div class="level-item">
          <button
            class="button is-dark"
            @click="$router.push('/deployments/create')"
          >
            <span class="icon">
              <FontAwesomeIcon :icon="faPlus" />
            </span>
            <span>Create Deployment</span>
          </button>
        </div>
      </div>
    </div>

    <DeploymentsTable :items-per-page="20" />
  </div>
</template>

<script setup lang="ts">
import { useWallet } from "@nosana/solana-vue";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import DeploymentsTable from "~/components/DeploymentsTable/Table.vue";

import { useSuperTokens } from "~/composables/useSuperTokens";
const { isAuthenticated: superTokensAuth, isLoading } = useSuperTokens();
const { connected } = useWallet();
const router = useRouter();

watch(
  [superTokensAuth, isLoading, connected],
  ([auth, loading, conn]) => {
    if (!loading && !auth && !conn) {
      router.push("/");
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}
</style>
