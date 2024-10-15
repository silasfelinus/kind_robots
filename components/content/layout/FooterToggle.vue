<template>
  <div class="relative z-50">
    <button
      class="rounded-tl-full rounded-br-2xl border-t-2 border-l-2 border-double border-accent shadow-lg bg-gradient-to-tr from-accent to-accent-dark hover:bg-secondary text-2xl text-white flex items-center justify-center"
      @click="toggleFooter"
    >
      <!-- Footer toggle character (▼ or ▲) -->
      <span
        class="toggle-character"
        style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3)"
      >
        {{ footerCharacter }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Determine the footer character based on footer state (▼ for open, ▲ for closed)
const footerCharacter = computed(() => {
  return displayStore.footerState === 'open' ? '▼' : '▲'
})

// Toggle the footer's open/closed state
const toggleFooter = () => {
  displayStore.toggleFooter()
}
</script>
