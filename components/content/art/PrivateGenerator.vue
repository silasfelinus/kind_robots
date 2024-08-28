<template>
  <div
    class="flex flex-col items-stretch w-full max-h-full overflow-y-auto border-2 rounded-2xl p-2 bg-base-200 mx-2 my-2"
  >
    <!-- Check if showMature is true and display the website, otherwise display the rebel-button -->
    <iframe
      v-if="showMature"
      :src="siteUrl"
      frameborder="0"
      class="w-full h-auto min-h-full"
    ></iframe>
    <rebel-button v-else class="w-full h-auto min-h-full" />
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
