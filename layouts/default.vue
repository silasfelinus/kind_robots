<!-- /layouts/default.vue -->
<template>
  <component :is="layoutComponent">
    <slot />
  </component>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import MobileLayout from '@/layouts/mobile.vue'
import TabletLayout from '@/layouts/tablet.vue'
import DesktopLayout from '@/layouts/desktop.vue'

const displayStore = useDisplayStore()

const layoutComponent = computed(() => {
  if (displayStore.viewportSize === 'mobile') return MobileLayout
  if (displayStore.viewportSize === 'tablet') return TabletLayout
  return DesktopLayout
})
</script>
