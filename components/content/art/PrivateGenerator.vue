<template>
  <div class="border rounded-2xl bg-base-200 m-1 p-1">
    <!-- Check if showMature is true and display the website, otherwise display the rebel-button -->
    <iframe
      v-if="showMature"
      :src="siteUrl"
      frameborder="0"
      class="w-full h-full"
    ></iframe>
    <rebel-button v-else class="w-full h-full" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from './../../../stores/userStore'

// Get the store instance
const userStore = useUserStore()

// Computed property to reactively check the showMature flag
const showMature = computed(() => userStore.showMature)

// The URL of the website to display
const siteUrl = 'https://lola.acrocatranch.com'
</script>

<style scoped></style>
