<template>
  <div class="container">
    <!-- Check if showMature is true and display the website, otherwise display the rebel-button -->
    <iframe v-if="showMature" :src="siteUrl" frameborder="0" class="full-size"></iframe>
    <rebel-button v-else class="full-size" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/stores/userStore';

// Get the store instance
const userStore = useUserStore();

// Computed property to reactively check the showMature flag
const showMature = computed(() => userStore.showMature);

// The URL of the website to display
const siteUrl = 'https://lola.acrocatranch.com';
</script>

<style scoped>
.container {
  width: 100%; /* Takes the full width of the parent */
  height: 100%; /* Takes the full height of the parent */
  overflow: hidden; /* Prevents scrollbars if the content is too large */
}

.full-size {
  width: 100%; /* Full width of the container */
  height: 100%; /* Full height of the container */
}
</style>