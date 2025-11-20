<template>
  <div>
    <TopBar title="Deployments" subtitle="Find information about your deployments here" />
    
    <div class="level mb-4">
      <div class="level-left">
        <div class="level-item">
          <div class="control has-icons-left">
            <input class="input" type="text" placeholder="Search deployments" v-model="searchQuery" />
            <span class="icon is-small is-left">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
              </svg>
            </span>
          </div>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <button class="button is-dark" @click="$router.push('/deployments/create')">
            <span class="icon">
              <FontAwesomeIcon :icon="faPlus" />
            </span>
            <span>Create Deployment</span>
          </button>
        </div>
      </div>
    </div>

    <DeploymentsList 
      :items-per-page="20" 
      :search-query="searchQuery"
    />
  </div>
</template>

<script setup lang="ts">
import DeploymentsList from '~/components/List/DeploymentsList.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const searchQuery = ref('')

const { status } = useAuth()
const router = useRouter()

watch(status, (authStatus) => {
  if (authStatus === 'unauthenticated') {
    router.push('/account/deployer')
  }
}, { immediate: true })
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}
</style>

