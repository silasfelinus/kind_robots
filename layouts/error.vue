<template>
  <div class="error-page">
    <img
      :src="errorImage"
      alt="Error Image"
      class="error-image"
      @error="handleImageError"
    />
    <h1>{{ errorTitle }}</h1>
    <p v-if="errorMessage">{{ errorMessage }}</p>
    <nuxt-link to="/">Go back to the homepage</nuxt-link>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useErrorStore, ErrorType } from '@/stores/errorStore' // Adjust path as necessary

const errorStore = useErrorStore()
const defaultImage = '/images/error.webp'
const fallbackImage = '/images/error-fallback.webp'

// Computed property for getting the error message from the store
const errorMessage = computed(
  () => errorStore.message || 'Something went wrong, please try again later.',
)

// Computed property for getting the error type from the store
const errorType = computed(() => errorStore.type || ErrorType.GENERAL_ERROR)

// Mapping error types to appropriate titles
const errorTitleMap: Record<ErrorType, string> = {
  [ErrorType.VALIDATION_ERROR]: 'Validation Error',
  [ErrorType.NETWORK_ERROR]: 'Network Error',
  [ErrorType.AUTH_ERROR]: 'Authentication Error',
  [ErrorType.REGISTRATION_ERROR]: 'Registration Error',
  [ErrorType.UNKNOWN_ERROR]: 'An Unknown Error Occurred',
  [ErrorType.GENERAL_ERROR]: 'An Error Occurred',
  [ErrorType.INTERACTION_ERROR]: 'Interaction Error',
  [ErrorType.STORE_ERROR]: 'Store Error',
}

// Computed property to get the error title based on the error type
const errorTitle = computed(
  () =>
    errorTitleMap[errorType.value] || errorTitleMap[ErrorType.GENERAL_ERROR],
)

// Ref to hold the error image, defaulting to a specific image
const errorImage = ref(defaultImage)

// Fallback logic to load another image if the original fails to load
function handleImageError() {
  errorImage.value = fallbackImage
}
</script>

<style scoped>
.error-page {
  text-align: center;
  padding: 20px;
}

.error-image {
  max-width: 90%;
  height: auto;
  margin-bottom: 20px;
}

h1 {
  font-size: 2rem;
  color: #ff6b6b; /* Custom error title color */
}

p {
  font-size: 1.25rem;
  margin-bottom: 20px;
  color: #ffffff; /* Text color */
}

.nuxt-link {
  font-size: 1rem;
  color: #42b883;
  text-decoration: underline;
}
</style>
