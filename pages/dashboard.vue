<template>
  <div>
    <TopBar :title="'Dashboard'" :subtitle="'Your personal overview'">
    </TopBar>
    <div class="container">
      <div v-if="connected">
        <h3 class="title is-4 mb-4">Status</h3>
        <div class="columns is-multiline mb-4">
          <div class="column is-3">
            <div class="box has-text-centered">
              <p class="heading">Deployments</p>
              <p class="title is-flex is-align-items-center is-justify-content-center">
                <RocketIcon style="width: 16px; height: 16px; fill: #10E80C; margin-right: 0.5rem;" />
                560
              </p>
            </div>
          </div>
          <div class="column is-3">
            <div class="box has-text-centered">
              <p class="heading">NOS Balance</p>
              <p class="title" v-if="balance && nosPrice">
                {{ balance.uiAmount.toFixed(2) }} NOS
                <span class="has-text-grey is-size-6">(${{ (balance.uiAmount * nosPrice).toFixed(2) }})</span>
              </p>
              <p class="title" v-else>-</p>
            </div>
          </div>
          <div v-if="nosStaked && nosStaked.amount > 0" class="column is-3">
            <div class="box has-text-centered">
              <p class="heading">NOS Staked</p>
              <p class="title is-flex is-align-items-center is-justify-content-center">
                <span v-if="nosStaked && nosStaked.amount >= 0">
                  {{ (nosStaked.amount / 1e6).toFixed(2) }} NOS
                </span>
                <span v-else>-</span>
                <nuxt-link to="/stake" class="ml-2">
                  <span class="container-icon" style="background-color: white; border: 1px solid #dbdbdb; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                    <span style="font-size: 18px; color: black; line-height: 0;">+</span>
                  </span>
                </nuxt-link>
              </p>
            </div>
          </div>
          <div v-if="pendingRewards > 0" class="column is-3">
            <div class="box has-text-centered">
              <p class="heading">Pending Rewards</p>
              <p class="title">{{ pendingRewards.toFixed(2) }} NOS</p>
            </div>
          </div>
        </div>
        <h3 class="title is-4 mb-7">Deployments</h3>
        <DashboardDeploymentsList :items-per-page="10" class="mb-6" />
        
        <div class="columns">
          <div class="column is-4">
            <h3 class="title is-4 mb-4">Welcome to Nosana</h3>
            <div class="equal-height-boxes">
              <nuxt-link to="/jobs/create" class="box has-text-black p-2 mb-2 is-block">
                <div class="is-flex is-align-items-start" style="margin: 8px 8px 0 8px;">
                  <RocketIcon style="width: 16px; height: 16px; fill: #10E80C; margin-right: 0.5rem; margin-top: 4px;" />
                  <div>
                    <h4 class="title is-6 mb-0">Getting Started</h4>
                    <p class="is-size-6 mb-0" style="line-height: 1.2;">Start your journey by deploying your first AI model on Nosana.</p>
                  </div>
                </div>
              </nuxt-link>

              <a href="https://docs.nosana.com/about/intro.html" target="_blank" class="box has-text-black p-2 mb-2 is-block">
                <div class="is-flex is-align-items-start" style="margin: 8px 8px 0 8px;">
                  <ExplorerIcon class="nosana-icon" style="width: 16px; height: 16px; margin-right: 0.5rem; margin-top: 4px;" />
                  <div>
                    <h4 class="title is-6 mb-0">Documentation</h4>
                    <p class="is-size-6 mb-0" style="line-height: 1.2;">Explore our comprehensive guides and how the network works.</p>
                  </div>
                </div>
              </a>

              <nuxt-link to="/support" class="box has-text-black p-2 is-block">
                <div class="is-flex is-align-items-start" style="margin: 8px 8px 0 8px;">
                  <SupportIcon class="nosana-icon" style="width: 16px; height: 16px; margin-right: 0.5rem; margin-top: 4px;" />
                  <div>
                    <h4 class="title is-6 mb-0">Help and Support</h4>
                    <p class="is-size-6 mb-0" style="line-height: 1.2;">Connect with our community and support team for assistance.</p>
                  </div>
                </div>
              </nuxt-link>
            </div>
          </div>
          
          <div class="column is-4">
            <h3 class="title is-4 mb-4">Cost and Usage</h3>
            <div class="box" style="height: 100%;">
              <div class="content">
                <p>Track your resource consumption:</p>
                <ul>
                  <li>Total compute hours: 0h</li>
                  <li>Monthly spend: $0.00</li>
                  <li>Active deployments: 0</li>
                  <li>Available GPU types: 4</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="column is-4">
            <h3 class="title is-4 mb-4" style="visibility: hidden; height: 0; margin: 0; padding: 0;">Quick Actions</h3>
            <div class="box" style="margin-top: 2.7rem; height: 100%;">
              <div class="content">
                <p>Common tasks you can perform:</p>
                <ul>
                  <li>Deploy a new model</li>
                  <li>View active jobs</li>
                  <li>Check node status</li>
                  <li>Manage stake</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="notification is-warning">
        Please connect your wallet to view the dashboard
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardDeploymentsList from '~/components/Dashboard/DeploymentsList.vue';
import { useWallet } from 'solana-wallets-vue';
import { useStake } from '~/composables/useStake';
import RocketIcon from '@/assets/img/icons/rocket.svg?component';
import ExplorerIcon from '@/assets/img/icons/sidebar/explorer.svg?component';
import SupportIcon from '@/assets/img/icons/sidebar/support.svg?component';

const { connected, publicKey } = useWallet();
const { nosana } = useSDK();

// Get balances
const balance = ref<any | null>(null);
const nosStaked = ref<any | null>(null);
const loading = ref(false);

// Get NOS price
const { data: stats } = useAPI('/api/stats');
const nosPrice = computed(() => stats.value?.price || null);

// Get staking info
const { activeStake, rewardsInfo, poolInfo } = useStake(publicKey);
const timestamp = useTimestamp({ interval: 1000 });

// Calculate pending rewards
const pendingRewards = computed(() => {
  if (rewardsInfo.value?.account && poolInfo.value) {
    const currentReflection = rewardsInfo.value.account.reflection;
    const currentXnos = rewardsInfo.value.account.xnos;
    const totalReflection = rewardsInfo.value.global.totalReflection;
    const totalXnos = rewardsInfo.value.global.totalXnos;
    
    if (totalXnos === 0 || totalReflection === 0) return 0;
    
    const rate = totalReflection / totalXnos;
    if (rate === 0) return 0;
    
    const xnosBalance = currentReflection / rate;
    const pendingReward = Math.max(0, (xnosBalance - currentXnos) / 1e6);
    
    return pendingReward;
  }
  return 0;
});

// Fetch balances
const checkBalances = async () => {
  loading.value = true;
  try {
    if (publicKey.value) {
      balance.value = await nosana.value.solana.getNosBalance(publicKey.value.toString());
      try {
        nosStaked.value = await nosana.value.stake.get(publicKey.value.toString());
      } catch (error) {
        nosStaked.value = null;
      }
    }
  } catch (error) {
    console.error("Error fetching balances:", error);
  }
  loading.value = false;
};

watch(() => publicKey.value, () => {
  checkBalances();
});

onMounted(() => {
  checkBalances();
});
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.heading {
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 600;
  color: #7a7a7a;
  margin-bottom: 0.5rem;
}

.title {
  font-size: 1.5rem;
  margin-bottom: 1rem !important;
}

.box {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* In any global .scss or in a <style scoped> block with deep selectors */
.icon.is-small svg {
  width: 1em;
  height: 1em;
  /* optionally, if you want slightly larger than default */
  /* width: 1.25em; 
     height: 1.25em; */
}

.plus-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.plus-icon:hover {
  transform: scale(1.1);
}

.container-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nosana-icon {
  color: #10E80C;
}

.nosana-icon :deep(path) {
  fill: #10E80C;
}

.equal-height-boxes {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.equal-height-boxes .box {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.equal-height-boxes .box:not(:last-child) {
  margin-bottom: 0.5rem;
}

.equal-height-boxes .box > div {
  height: 100%;
}

.box {
  display: flex;
  flex-direction: column;
}

.box .content {
  flex: 1;
}

.container-icon:hover {
  border-color: #10E80C !important;
}

.container-icon:hover span {
  color: #10E80C !important;
}
</style> 