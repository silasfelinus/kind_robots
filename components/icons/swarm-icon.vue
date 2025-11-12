<!-- /components/content/icons/swarm-icon.vue -->
<template>
  <div
    class="w-full h-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
    @click="toggleAmiSwarm"
    title="Kind Butterflies"
  >
    <Icon
      name="kind-icon:butterfly"
      class="w-full h-full transition-transform duration-300"
      :class="{ glow: showSwarm }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSmartbarStore } from '@/stores/smartbarStore'

const smartbarStore = useSmartbarStore()
const showSwarm = computed(() => smartbarStore.showSwarm)

function toggleAmiSwarm() {
  smartbarStore.toggleSwarm()
}
</script>

<style scoped>
.glow {
  transform: scale(1.1);
  filter: drop-shadow(0 0 6px rgba(255, 200, 0, 0.8));
}
</style>
