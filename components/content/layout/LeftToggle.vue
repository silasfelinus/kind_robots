<template>
  <div class="fixed z-50 p-1" :style="leftFooterToggleStyle">
    <button
      class="w-6 h-6 rounded-2xl font-semibold text-transparent flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
      @click="toggleSidebarLeft"
    >
      <span
        class="toggle-character"
        style="
          background: linear-gradient(to bottom right, #f472b6, #fbbf24);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
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

const leftFooterToggleStyle = computed(() => {
  const consistentPadding = `${displayStore.sectionPadding}`
  if (displayStore.sidebarLeftState === 'hidden') {
    return {
      left: `${consistentPadding}`,
      top: `calc(${displayStore.headerHeight} + ${consistentPadding} * 2)`,
    }
  } else {
    return {
      left: `calc(${displayStore.sidebarLeftWidth} - (${consistentPadding}))`,
      top: `calc(${displayStore.headerHeight} + ${consistentPadding} * 2)`,
    }
  }
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
}
</script>
