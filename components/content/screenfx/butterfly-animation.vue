<template>
  <div class="loading-overlay">
    <!-- Multiple Butterflies with Animation Delay -->
    <ami-butterfly v-for="i in butterflyCount" :key="i" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const butterflyCount = ref(20) // Number of butterflies to display
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #111;
  z-index: 9999;
  transition: opacity 1s;
  pointer-events: auto;
}
</style>
