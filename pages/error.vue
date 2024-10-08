<template>
  <div
    class="flex flex-col items-center justify-center h-screen w-full bg-cover bg-center"
    style="background-image: url('/path-to-your-image.jpg')"
  >
    <div
      class="bg-opacity-60 bg-base-100 p-8 rounded-2xl text-center shadow-lg"
    >
      <h1 class="text-4xl font-bold text-primary mb-4">Page Not Found</h1>
      <p class="text-secondary mb-8">
        It looks like this page doesn't exist. Please use the buttons below to
        navigate.
      </p>

      <div class="flex space-x-4">
        <button
          class="text-white bg-primary px-4 py-2 rounded-lg shadow-md hover:bg-secondary transition-colors"
          @click="goBack"
        >
          Go Back
        </button>
        <button
          class="text-white bg-primary px-4 py-2 rounded-lg shadow-md hover:bg-secondary transition-colors flex items-center space-x-2"
          @click="goHome"
        >
          <Icon name="home-icon" class="w-5 h-5" />
          <span>Go to Home</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// Go back to the previous page
const goBack = () => {
  router.back()
}

// Go to the home page
const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
/* You can add any additional styles for the page here */
</style>
