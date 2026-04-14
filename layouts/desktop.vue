<!-- /layouts/desktop.vue -->
<template>
  <div class="flex flex-col min-h-dvh w-full overflow-hidden bg-base-100">
    <div
      v-if="showHeader"
      class="w-full shrink-0 border-b border-base-300"
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
        class="shrink-0 h-full overflow-y-auto border-r border-base-300"
        :style="{ width: `${sidebarLeftWidth}vw` }"
      >
        <slot name="left">
          <left-sidebar />
        </slot>
      </aside>

      <main class="flex-1 min-w-0 h-full overflow-y-auto overscroll-y-contain">
        <div class="container mx-auto h-full w-full px-4 py-4">
          <slot />
        </div>
      </main>

      <aside
        v-if="showRightSidebar"
        class="shrink-0 h-full overflow-y-auto border-l border-base-300"
        :style="{ width: `${sidebarRightWidth}vw` }"
      >
        <slot name="right">
          <right-sidebar />
        </slot>
      </aside>
    </div>

    <div
      v-if="showFooter"
      class="w-full shrink-0 border-t border-base-300"
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
