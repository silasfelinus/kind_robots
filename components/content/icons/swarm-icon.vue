<!-- /components/content/story/swarm-icon.vue -->
<template>
  <div
    class="group relative flex items-center justify-center hover:scale-110"
    @click="toggleAmiSwarm"
  >
    <div class="flex items-center justify-center w-[3rem] h-[3rem]">
      <Icon
        name="kind-icon:butterfly"
        title="Kind Butterflies"
        :class="['transition-transform', 'duration-300', { glow: showSwarm }]"
        class="w-full h-full max-w-[3rem] max-h-[3rem]"
      />
    </div>

    <div
      v-if="showSwarm"
      class="fixed inset-0 overflow-hidden z-50 pointer-events-none full-page"
    >
      <butterfly-animation />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useIconStore } from '@/stores/iconStore'

const iconStore = useIconStore()

const showSwarm = computed(() => iconStore.showSwarm)

const toggleAmiSwarm = () => {
  setTimeout(() => {
    iconStore.toggleSwarm()
  }, 10)
}
</script>

<style scoped>
.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
  transition: box-shadow 0.3s ease-in-out;
}
.full-page {
  width: 100vw;
  height: 100vh;
}
</style>
