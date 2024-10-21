<template>
  <div class="z-50 p-1">
    <button
      class="w-8 h-8 rounded-2xl font-semibold text-secondary flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
      @click="toggleSidebarLeft"
    >
      <span
        class="toggle-character text-secondary"
        style="
          background: linear-gradient(to bottom right, #f472b6, #fbbf24);
          background-clip: text;
          -webkit-background-clip: text;
          
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        "
      >
        {{ iconText }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const iconText = computed(() => {
  if (displayStore.sidebarLeftState === 'hidden') return '>'
  if (displayStore.sidebarLeftState === 'compact') return '<'
  return '<'
})

const toggleSidebarLeft = () => {
  if (displayStore.sidebarLeftState === 'open') {
    displayStore.sidebarLeftState = 'compact'
  } else if (displayStore.sidebarLeftState === 'compact') {
    displayStore.sidebarLeftState = 'hidden'
  } else {
    displayStore.sidebarLeftState = 'open'
    displayStore.footerState = 'hidden'
  }
  displayStore.saveState()
}
</script>
