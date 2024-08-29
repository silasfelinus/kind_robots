<template>
  <div class="border rounded-2xl bg-base-200 w-full min-h-screen m-1 p-1">
    <!-- Check if showMature is true and display the website, otherwise display the rebel-button -->
    <iframe
      v-if="showMature"
      :src="siteUrl"
      frameborder="0"
      class="w-full h-full min-h-screen"
    ></iframe>
    <rebel-button v-else class="w-full h-full" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from './../../../stores/userStore'

const userStore = useUserStore()
const showMature = computed(() => userStore.showMature)
const siteUrl = 'https://lola.acrocatranch.com'
</script>

<style>
/* Ensure html and body tags also take up full height */
html,
body {
  height: 100%;
}
</style>
