<template>
  <div class="loading-overlay z-50">
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
}
</style>
