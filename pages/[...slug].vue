<template>
  <div>
    <layout-selector class="absolute hidden" />
    <NuxtLayout :name="currentLayout">
      <ContentDoc />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLayoutStore } from '@/stores/layoutStore'

const layoutStore = useLayoutStore()

// Define the possible layout keys
type LayoutKey = 'default' | 'alternative' // Adjust as needed

// Computed property to get the current layout from the store with type safety
const currentLayout = computed<LayoutKey | false>(() => {
  const layout = layoutStore.currentLayout
  // Return 'default' if currentLayout is not set or is invalid
  return (layout as LayoutKey) ?? 'default'
})
</script>
