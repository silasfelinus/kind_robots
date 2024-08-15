<template>
  <div class="page-container">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
// No additional logic needed unless you have specific page requirements
</script>

<style scoped>
.page-container {
  /* Ensure the container allows scrolling */
  min-height: 100vh; /* Full viewport height */
  display: flex;
  flex-direction: column; /* Stack children vertically */
  overflow: hidden; /* Ensure child elements handle scrolling */
}

.page-container > * {
  /* Allow scrolling for content */
  flex: 1; /* Allow content to grow and shrink */
  overflow-y: auto; /* Vertical scrolling if needed */
}
</style>
