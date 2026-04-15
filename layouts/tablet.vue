<!-- /layouts/tablet.vue -->
<template>
  <div class="relative flex flex-col min-h-dvh w-full overflow-hidden bg-base-100">
    <div class="pointer-events-none absolute inset-0 bg-warning/5"></div>

    <div
      v-if="showHeader"
      class="relative z-10 w-full shrink-0 border-b border-base-300 bg-warning/10"
      :style="{ height: `calc(var(--vh) * ${headerHeight})` }"
    >
      <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-warning bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-warning shadow-lg">
        Tablet Header
      </div>

      <header class="h-full w-full pt-8">
        <slot name="header">
          <main-header />
        </slot>
      </header>
    </div>

    <div class="relative z-10 flex flex-1 min-h-0 w-full overflow-hidden">
      <aside
        v-if="showLeftSidebar"
        class="relative shrink-0 h-full overflow-y-auto border-r border-base-300 bg-secondary/10"
        :style="{ width: `${sidebarLeftWidth}vw` }"
      >
        <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-secondary bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-secondary shadow-lg">
          Tablet Left Sidebar
        </div>

        <div class="h-full pt-8">
          <slot name="left">
            <left-sidebar />
          </slot>
        </div>
      </aside>

      <main class="relative flex-1 min-w-0 h-full overflow-y-auto overscroll-y-contain bg-accent/5">
        <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-accent bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-accent shadow-lg">
          Tablet Main
        </div>

        <div class="container mx-auto h-full w-full px-3 py-10">
          <slot />
        </div>
      </main>

      <aside
        v-if="showRightSidebar"
        class="relative shrink-0 h-full overflow-y-auto border-l border-base-300 bg-warning/10"
        :style="{ width: `${sidebarRightWidth}vw` }"
      >
        <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-warning bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-warning shadow-lg">
          Tablet Right Sidebar
        </div>

        <div class="h-full pt-8">
          <slot name="right">
            <right-sidebar />
          </slot>
        </div>
      </aside>
    </div>

    <div
      v-if="showFooter"
      class="relative z-10 w-full shrink-0 border-t border-base-300 bg-success/10"
      :style="{ height: `calc(var(--vh) * ${footerHeight})` }"
    >
      <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-success bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-success shadow-lg">
        Tablet Footer
      </div>

      <footer class="h-full w-full pt-8">
        <slot name="footer">
          <main-footer />
        </slot>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
// /layouts/tablet.vue
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