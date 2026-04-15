<!-- /layouts/default.vue -->
<template>
  <div class="relative min-h-dvh w-full">
    <div class="pointer-events-none fixed left-3 top-3 z-10000">
      <div
        class="rounded-2xl border border-secondary bg-base-100/90 px-4 py-2 shadow-xl backdrop-blur"
      >
        <div
          class="text-[10px] font-black uppercase tracking-[0.3em] text-secondary"
        >
          Default → {{ resolvedLayoutKey }}
        </div>
      </div>
    </div>

    <component :is="resolvedLayout">
      <slot />
    </component>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useLayoutStore, type ResolvedLayoutKey } from '@/stores/layoutStore'
import MobileLayout from '@/layouts/mobile.vue'
import TabletLayout from '@/layouts/tablet.vue'
import DesktopLayout from '@/layouts/desktop.vue'

const displayStore = useDisplayStore()
const layoutStore = useLayoutStore()

const resolvedLayoutKey = computed<ResolvedLayoutKey>(() => {
  if (layoutStore.currentLayout === 'mobile') return 'mobile'
  if (layoutStore.currentLayout === 'tablet') return 'tablet'
  if (layoutStore.currentLayout === 'desktop') return 'desktop'

  if (displayStore.viewportSize === 'mobile') return 'mobile'
  if (displayStore.viewportSize === 'tablet') return 'tablet'
  return 'desktop'
})

const resolvedLayout = computed(() => {
  if (resolvedLayoutKey.value === 'mobile') return MobileLayout
  if (resolvedLayoutKey.value === 'tablet') return TabletLayout
  return DesktopLayout
})
</script>
