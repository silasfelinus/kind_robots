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
import { useErrorStore } from '@/stores/errorStore' // Adjust path as necessary

const errorStore = useErrorStore()
const defaultImage = '/images/error.webp'
const fallbackImage = '/images/error-fallback.webp'

const errorMessage = computed(() => errorStore.message || 'An error occurred.')
const errorType = computed(() => errorStore.type || 'GENERAL_ERROR')

const errorTitleMap: Record<string, string> = {
  VALIDATION_ERROR: 'Validation Error',
  NETWORK_ERROR: 'Network Error',
  AUTH_ERROR: 'Authentication Error',
  REGISTRATION_ERROR: 'Registration Error',
  UNKNOWN_ERROR: 'An Unknown Error Occurred',
  GENERAL_ERROR: 'An Error Occurred',
}

const errorTitle = computed(
  () => errorTitleMap[errorType.value] || errorTitleMap.GENERAL_ERROR,
)

const errorImage = ref(defaultImage)

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
</style>
