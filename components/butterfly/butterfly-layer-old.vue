<!-- /components/content/butterfly/butterfly-layer.vue -->
<template>
  <div class="butterfly-layer pointer-events-none fixed inset-0 z-50">
    <ami-butterfly
      v-for="butterfly in butterflies"
      :key="butterfly.id"
      :butterfly="butterfly"
    />
  </div>
</template>

<script setup lang="ts">
// /components/content/butterfly/butterfly-layer.vue
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useButterflyStore } from '@/stores/butterflyStore'

const butterflyStore = useButterflyStore()
const { butterflies } = storeToRefs(butterflyStore)

onMounted(async () => {
  if (!butterflyStore.initialized) {
    await butterflyStore.initialize()
  }
})
</script>

<style scoped>
.butterfly-layer {
  width: 100vw;
  height: 100vh;
}
</style>
