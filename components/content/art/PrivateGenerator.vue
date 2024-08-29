<template>
  <div class="app-container bg-primary flex p-1">
    <!-- Check if showMature is true and display the website, otherwise display the rebel-button -->
    <iframe
      v-if="showMature"
      :src="siteUrl"
      frameborder="0"
      class="website-iframe bg-base-200 rounded-2xl border"
    ></iframe>
    <rebel-button v-else class="full-size-btn" />
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
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; /* Prevent scrollbars from interfering */
}

.app-container {
  width: 100%;
  min-height: 83vh;
  padding: 1rem;
  box-sizing: border-box;
}

.website-iframe,
.full-size-btn {
  width: 100%;
  height: 83vh;
  flex-grow: 1;
  border-radius: 1rem; /* Match parent border-radius */
}
</style>
