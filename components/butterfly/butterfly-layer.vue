<!-- /components/content/butterfly/butterfly-layer.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

const butterflyStore = useButterflyStore()

onMounted(async () => {
  if (!butterflyStore.butterflies.length) {
    await butterflyStore.generateInitialButterflies(20)
  }
})
</script>

<template>
  <div class="butterfly-layer pointer-events-none fixed inset-0 z-50">
    <ami-butterfly
      v-for="butterfly in butterflyStore.butterflies"
      :key="butterfly.id"
    />
  </div>
</template>

<style scoped>
.butterfly-layer {
  width: 100vw;
  height: 100vh;
}
</style>
