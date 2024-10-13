<template>
  <div :class="togglePosition">
    <button
      class="flex items-center justify-center hover:bg-secondary rounded-lg w-[6vh] h-[6vh]"
      @click="toggleState"
    >
      <span class="text-2xl leading-none">{{ toggleCharacter }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Compute the character to display based on footer state
const toggleCharacter = computed(() => 
  displayStore.footerState === 'open' ? '▲' : '←'
)

// Inline Tailwind for position, fallback to minimal CSS for custom values
const togglePosition = computed(() => 
  displayStore.footerState === 'open'
    ? 'fixed bottom-[calc(var(--footer-height)+32px)] left-1/2 transform -translate-x-1/2 z-50'
    : 'fixed bottom-16 left-[calc(var(--sidebar-width)+32px)] z-50'
)
</script>

<style scoped>
/* Minimal custom CSS to handle calc() with variables */
.fixed.bottom-[calc(var(--footer-height)+32px)] {
  bottom: calc(var(--footer-height) + 32px);
}

.fixed.left-[calc(var(--sidebar-width)+32px)] {
  left: calc(var(--sidebar-width) + 32px);
}
</style>
