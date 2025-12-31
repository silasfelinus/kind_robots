<!-- /components/content/utils/footer-debug.vue -->
<template>
  <div
    class="fixed bottom-4 left-4 z-[1000] bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg shadow-lg pointer-events-none font-mono space-y-1"
  >
    <div><span class="font-bold">🦶 footerState:</span> {{ footerState }}</div>
    <div class="font-bold">🧮 footerStyle:</div>
    <div v-for="(val, key) in footerStyle" :key="key">
      {{ key }}: <span class="text-green-300">{{ val }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'
import { computed } from 'vue'

const displayStore = useDisplayStore()

const footerState = computed(() => displayStore.footerState)
const footerStyle = computed(() => displayStore.footerStyle)
</script>
