<!-- /layouts/default.vue -->
<template>
  <component :is="resolvedLayout">
    <slot />
  </component>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useLayoutStore } from '@/stores/layoutStore'
import MobileLayout from '@/layouts/mobile.vue'
import TabletLayout from '@/layouts/tablet.vue'
import DesktopLayout from '@/layouts/desktop.vue'

const displayStore = useDisplayStore()
const layoutStore = useLayoutStore()

const resolvedLayoutKey = computed(() => {
  if (layoutStore.currentLayout !== 'default') {
    return layoutStore.currentLayout
  }

  return displayStore.viewportSize
})

const resolvedLayout = computed(() => {
  if (resolvedLayoutKey.value === 'mobile') return MobileLayout
  if (resolvedLayoutKey.value === 'tablet') return TabletLayout
  return DesktopLayout
})
</script>
