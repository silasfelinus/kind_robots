<!-- /components/content/icons/swarm-icon.vue -->
<template>
  <div
    class="w-full h-full flex items-center justify-center"
    @click="toggleAmiSwarm"
    title="Kind Butterflies"
  >
    <Icon
      name="kind-icon:butterfly"
      :class="['transition-transform duration-300', { glow: showSwarm }]"
      class="w-full h-full"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usesmartbarStore } from '@/stores/smartbarStore'

const smartbarStore = usesmartbarStore()
const showSwarm = computed(() => smartbarStore.showSwarm)

const toggleAmiSwarm = () => {
  smartbarStore.toggleSwarm()
}
</script>

<style scoped>
.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
}
</style>
