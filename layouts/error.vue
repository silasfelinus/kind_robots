<template>
  <div class="error-page">
    <img src="/images/error.webp" alt="Error Image" class="error-image" />
    <h1 v-if="errorType === 'VALIDATION_ERROR'">Validation Error</h1>
    <h1 v-else-if="errorType === 'NETWORK_ERROR'">Network Error</h1>
    <h1 v-else-if="errorType === 'AUTH_ERROR'">Authentication Error</h1>
    <h1 v-else-if="errorType === 'REGISTRATION_ERROR'">Registration Error</h1>
    <h1 v-else-if="errorType === 'UNKNOWN_ERROR'">An Unknown Error Occurred</h1>
    <h1 v-else-if="errorType === 'GENERAL_ERROR'">An Error Occurred</h1>
    <p v-if="errorMessage">{{ errorMessage }}</p>
    <nuxt-link to="/">Go back to the homepage</nuxt-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useErrorStore } from './../stores/errorStore' // Adjust path as necessary

const errorStore = useErrorStore()

const errorMessage = computed(() => errorStore.message)
const errorType = computed(() => errorStore.type)
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
