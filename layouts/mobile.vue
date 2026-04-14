<!-- /layouts/mobile.vue -->
<template>
  <div class="flex flex-col min-h-dvh w-full overflow-hidden bg-base-100">
    <div
      v-if="showHeader"
      class="w-full shrink-0"
      :style="{ height: `calc(var(--vh) * ${headerHeight})` }"
    >
      <header class="h-full w-full">
        <slot name="header">
          <main-header />
        </slot>
      </header>
    </div>

    <div class="flex-1 min-h-0 w-full overflow-hidden">
      <main class="h-full w-full overflow-y-auto overscroll-y-contain">
        <div class="container mx-auto h-full w-full px-2 py-2">
          <slot />
        </div>
      </main>
    </div>

    <div
      v-if="showFooter"
      class="w-full shrink-0"
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
