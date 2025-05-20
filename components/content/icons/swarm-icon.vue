<!-- /components/content/icons/swarm-icon.vue -->
<template>
  <div
    class="group relative flex items-center justify-center"
    @click="toggleAmiSwarm"
  >
    <div
      class="flex items-center justify-center w-[3rem] h-[3rem] hover:scale-110 transition-transform duration-300"
    >
      <Icon
        name="kind-icon:butterfly"
        title="Kind Butterflies"
        :class="['transition-transform duration-300', { glow: showSwarm }]"
        class="w-full h-full max-w-[3rem] max-h-[3rem]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useIconStore } from '@/stores/iconStore'

const iconStore = useIconStore()

const showSwarm = computed(() => iconStore.showSwarm)

const toggleAmiSwarm = () => {
  iconStore.toggleSwarm()
  console.log('swarm toggled')
}
</script>

<style scoped>
.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
  transition: box-shadow 0.3s ease-in-out;
}
</style>
