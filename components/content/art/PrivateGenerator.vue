<template>
  <div class="app-container flex">
    <!-- Check if showMature is true and display the website, otherwise display the rebel-button -->
    <iframe
      v-if="showMature"
      :src="siteUrl"
      class="website-iframe bg-base-300 rounded-2xl"
    ></iframe>
    <rebel-button v-else class="full-size-btn" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from './../../../stores/userStore'

const userStore = useUserStore()
const showMature = computed(() => userStore.showMature)
const siteUrl = 'https://lola.acrocatranch.com'
</script>

<style scoped>
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
}

.website-iframe,
.full-size-btn {
  width: 100%;
  height: 83vh;
  flex-grow: 1;
}
</style>
