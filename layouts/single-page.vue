<template>
  <div
    class="h-screen w-screen m-2 border-2 border-accent bg-primary rounded-2xl overflow-hidden flex items-center justify-center p-4"
  >
    <div
      class="grid w-full h-full"
      :style="`grid-template-columns: repeat(${columns}, minmax(0, 1fr)); gap: 16px;`"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'

const { width } = useWindowSize()

// Example: Define number of columns based on the width
const columns = computed(() => {
  if (width.value > 1200) return 5 // Large screens
  if (width.value > 900) return 4 // Medium screens
  if (width.value > 600) return 3 // Small screens
  return 2 // Extra small screens
})
</script>
