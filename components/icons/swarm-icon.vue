<!-- /components/content/icons/swarm-icon.vue -->
<template>
  <div
    class="flex h-full w-full cursor-pointer items-center justify-center transition-transform hover:scale-110"
    title="Kind Butterflies"
    @click="toggleAmiSwarm"
  >
    <Icon
      name="kind-icon:butterfly"
      class="h-full w-full transition-transform duration-300"
      :class="{ glow: hasActiveButterflies }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

const butterflyStore = useButterflyStore()

const hasActiveButterflies = computed(
  () =>
    butterflyStore.showSwarm &&
    butterflyStore.butterflies.filter((b) => !b.isExiting).length > 0,
)

function toggleAmiSwarm() {
  butterflyStore.toggleSwarm(20)
}
</script>

<style scoped>
.glow {
  transform: scale(1.1);
  filter: drop-shadow(0 0 6px rgba(255, 200, 0, 0.8));
}
</style>
