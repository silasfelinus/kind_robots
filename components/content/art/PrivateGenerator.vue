<template>
  <div class="app-container">
    <!-- Check if showMature is true and display the website, otherwise display the rebel-button -->
    <iframe
      v-if="showMature"
      :src="siteUrl"
      frameborder="0"
      class="website-iframe"
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
  border: 1px solid #ccc;
  border-radius: 1rem;
  background-color: #f9f9f9;
  width: 100%;
  min-height: 100%;
  padding: 1rem;
  box-sizing: border-box;
  display: flex; /* Ensures child elements are full height */
}

.website-iframe,
.full-size-btn {
  width: 100%;
  flex-grow: 1;
  border-radius: 1rem; /* Match parent border-radius */
}
</style>
