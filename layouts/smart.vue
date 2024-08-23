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

const columns = computed(() => {
  console.log('Width:', width.value) // Check the width
  if (width.value > 1200) return 6 // Adjusted for more columns on larger screens
  if (width.value > 900) return 4
  if (width.value > 600) return 3
  return 2
})

// Logging the computed columns to see the actual number
watch(columns, (newVal) => {
  console.log('Computed columns:', newVal)
})
</script>
