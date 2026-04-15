<!-- /layouts/mobile.vue -->
<template>
  <div class="relative flex flex-col min-h-dvh w-full overflow-hidden bg-base-100">
    <div class="pointer-events-none absolute inset-0 bg-success/5"></div>

    <div
      v-if="showHeader"
      class="relative z-10 w-full shrink-0 border-b border-base-300 bg-success/10"
      :style="{ height: `calc(var(--vh) * ${headerHeight})` }"
    >
      <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-success bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-success shadow-lg">
        Mobile Header
      </div>

      <header class="h-full w-full pt-8">
        <slot name="header">
          <main-header />
        </slot>
      </header>
    </div>

    <div class="relative z-10 flex-1 min-h-0 w-full overflow-hidden">
      <main class="relative h-full w-full overflow-y-auto overscroll-y-contain bg-accent/5">
        <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-accent bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-accent shadow-lg">
          Mobile Main
        </div>

        <div class="container mx-auto h-full w-full px-2 py-10">
          <slot />
        </div>
      </main>
    </div>

    <div
      v-if="showFooter"
      class="relative z-10 w-full shrink-0 border-t border-base-300 bg-success/10"
      :style="{ height: `calc(var(--vh) * ${footerHeight})` }"
    >
      <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-success bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-success shadow-lg">
        Mobile Footer
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
// /layouts/mobile.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const showHeader = computed(() => displayStore.headerState !== 'hidden')
const showFooter = computed(() => {
  return pageStore.page?.showFooter && displayStore.footerState !== 'hidden'
})

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
</script>