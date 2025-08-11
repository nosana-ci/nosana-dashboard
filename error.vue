<template>
  <div class="error-container">
    <logo width="300px" :animated="false" class="mb-6" />
    <template v-if="error.statusCode === 404">
      <h1 class="error-title">404</h1>
      <p class="error-message">Oops! Page not found</p>
      <p class="error-description">The page you are looking for might have been removed or is temporarily unavailable.</p>
    </template>
    
    <template v-else>
      <h1 class="error-title">Under Construction</h1>
      <p class="error-message">We'll be back soon!</p>
      <p class="error-description">We're currently working on improving this section of our platform. Please try again later.</p>
    </template>

    <button class="button is-primary" @click="handleError">
      {{ error.statusCode === 404 ? 'Go Back Home' : 'Try Again' }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  error: {
    type: Object,
    required: true
  }
})

function handleError() {
  if (props.error.statusCode === 404) {
    navigateTo('/')
  } else {
    clearError({ redirect: '/' })
  }
}
</script>

<style lang="scss" scoped>
.error-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  background-color: var(--color-background);
  color: var(--color-text);
}

.error-title {
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 1rem;
  font-family: 'Space Grotesk', sans-serif;
}

.error-message {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.error-description {
  font-size: 1rem;
  max-width: 500px;
  margin-bottom: 2rem;
  color: var(--color-text-light);
}
</style>
