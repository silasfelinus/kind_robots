<!-- /layouts/desktop.vue -->
<template>
  <div class="flex flex-col min-h-dvh w-full overflow-hidden bg-base-100">
    <div
      class="pointer-events-none fixed right-2 top-2 z-120 rounded-2xl border border-info bg-info/20 px-3 py-1 text-xs font-bold text-info-content"
    >
      DESKTOP LAYOUT
    </div>

    <div
      v-if="showHeader"
      class="w-full shrink-0 border-b border-info/40"
      :style="{ height: `calc(var(--vh) * ${headerHeight})` }"
    >
      <header class="h-full w-full">
        <slot name="header">
          <main-header />
        </slot>
      </header>
    </div>

    <div class="flex flex-1 min-h-0 w-full overflow-hidden">
      <aside
        v-if="showLeftSidebar"
        class="shrink-0 h-full overflow-y-auto border-r border-info/40 bg-info/5"
        :style="{ width: `${sidebarLeftWidth}vw` }"
      >
        <div class="px-2 py-1 text-xs font-semibold">left sidebar</div>
        <slot name="left">
          <left-sidebar />
        </slot>
      </aside>

      <main
        class="flex-1 min-w-0 h-full overflow-y-auto overscroll-y-contain border border-info/40"
      >
        <div class="container mx-auto h-full w-full px-4 py-4">
          <div
            class="mb-2 rounded-2xl border border-info/40 bg-info/10 px-3 py-1 text-xs font-semibold"
          >
            page area
          </div>
          <slot />
        </div>
      </main>

      <aside
        v-if="showRightSidebar"
        class="shrink-0 h-full overflow-y-auto border-l border-info/40 bg-info/5"
        :style="{ width: `${sidebarRightWidth}vw` }"
      >
        <div class="px-2 py-1 text-xs font-semibold">right sidebar</div>
        <slot name="right">
          <right-sidebar />
        </slot>
      </aside>
    </div>

    <div
      v-if="showFooter"
      class="w-full shrink-0 border-t border-info/40"
      :style="{ height: `calc(var(--vh) * ${footerHeight})` }"
    >
      <footer class="h-full w-full">
        <slot name="footer">
          <main-footer />
        </slot>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
// /layouts/desktop.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const showHeader = computed(() => displayStore.headerState !== 'hidden')
const showFooter = computed(() => {
  return pageStore.page?.showFooter && displayStore.footerState !== 'hidden'
})

const showLeftSidebar = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarLeftState),
)

const showRightSidebar = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarRightState),
)

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
</script>
