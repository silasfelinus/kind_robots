<!-- /components/content/screenfx/butterfly-animation.vue -->
<template>
  <div
    class="pointer-events-none fixed inset-0 z-50 h-dvh w-dvw overflow-hidden"
  >
    <ami-butterfly
      v-for="i in butterflyCount"
      :key="i"
      class="pointer-events-none"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const butterflyCount = ref(20)
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
