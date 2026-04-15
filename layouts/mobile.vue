<!-- /layouts/mobile.vue -->
<template>
  <div class="relative flex flex-col min-h-dvh w-full overflow-hidden bg-base-100">
    <div class="pointer-events-none absolute inset-0 bg-success/5"></div>

    <div
      v-if="showHeaderFinal"
      class="relative z-10 w-full shrink-0 border-b border-base-300 bg-success/10"
      :style="{ height: `calc(var(--vh) * ${headerHeight})` }"
    >
      <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-success bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-success shadow-lg">
        H1 Mobile Header
      </div>

      <button
        class="btn btn-xs btn-outline absolute right-2 top-2 z-30 rounded-2xl"
        @click="debugStore.toggle('header')"
      >
        Toggle
      </button>

      <header class="h-full w-full min-h-0 pt-8">
        <slot name="header">
          <div
            v-if="debugStore.enabled && debugStore.fillerHeader"
            class="flex h-full items-center justify-between gap-2 px-4"
          >
            <div class="flex items-center gap-2">
              <Icon name="kind-icon:butterfly." class="text-2xl text-success" />
              <div>
                <div class="font-black">Kind Robots</div>
                <div class="text-xs opacity-70">Mobile Header</div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button class="btn btn-xs rounded-2xl">Menu</button>
              <button class="btn btn-xs rounded-2xl">Theme</button>
            </div>
          </div>

          <main-header v-else />
        </slot>
      </header>
    </div>

    <div class="relative z-10 flex-1 min-h-0 w-full overflow-hidden">
      <main class="relative h-full w-full overflow-y-auto overscroll-y-contain bg-accent/5">
        <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-accent bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-accent shadow-lg">
          M2 Mobile Main
        </div>

        <button
          class="btn btn-xs btn-outline absolute right-2 top-2 z-30 rounded-2xl"
          @click="debugStore.toggleFiller('main')"
        >
          Toggle Filler
        </button>

        <div class="container mx-auto h-full w-full min-h-0 px-2 py-10">
          <div
            v-if="debugStore.enabled && debugStore.fillerMain"
            class="grid gap-4"
          >
            <div class="rounded-2xl border border-accent/30 bg-base-100/80 p-4">
              <div class="flex items-center gap-3">
                <Icon name="kind-icon:story." class="text-3xl text-accent" />
                <div>
                  <div class="text-lg font-black">Mobile Page Title</div>
                  <div class="text-sm opacity-70">This is filler content for the main region.</div>
                </div>
              </div>
            </div>

            <div class="grid gap-3">
              <div class="rounded-2xl border border-base-300 bg-base-100/80 p-4">
                <div class="font-bold">Card One</div>
                <div class="mt-2 text-sm opacity-80">
                  A compact mobile-friendly card with just enough visual proof to stop the void from gaslighting you.
                </div>
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-100/80 p-4">
                <div class="font-bold">Card Two</div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button class="btn btn-xs rounded-2xl">Action</button>
                  <button class="btn btn-xs rounded-2xl">Filter</button>
                  <button class="btn btn-xs rounded-2xl">View</button>
                </div>
              </div>
            </div>
          </div>

          <slot />
        </div>
      </main>
    </div>

    <div
      v-if="showFooterFinal"
      class="relative z-10 w-full shrink-0 border-t border-base-300 bg-success/10"
      :style="{ height: `calc(var(--vh) * ${footerHeight})` }"
    >
      <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-success bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-success shadow-lg">
        F4 Mobile Footer
      </div>

      <button
        class="btn btn-xs btn-outline absolute right-2 top-2 z-30 rounded-2xl"
        @click="debugStore.toggle('footer')"
      >
        Toggle
      </button>

      <footer class="h-full w-full min-h-0 pt-8">
        <slot name="footer">
          <div
            v-if="debugStore.enabled && debugStore.fillerFooter"
            class="flex h-full items-center justify-between gap-2 px-4"
          >
            <div class="text-sm font-bold">Footer Zone</div>
            <div class="flex items-center gap-2">
              <Icon name="kind-icon:brainstorm." class="text-xl" />
              <Icon name="kind-icon:wonderlab." class="text-xl" />
              <Icon name="kind-icon:story." class="text-xl" />
            </div>
          </div>

          <main-footer v-else />
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
import { useDebugStore } from '@/stores/debugStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()
const debugStore = useDebugStore()

const showHeader = computed(() => displayStore.headerState !== 'hidden')
const showFooter = computed(() => {
  return pageStore.page?.showFooter && displayStore.footerState !== 'hidden'
})

const showHeaderFinal = computed(() => {
  if (debugStore.enabled) return debugStore.showHeader
  return showHeader.value
})

const showFooterFinal = computed(() => {
  if (debugStore.enabled) return debugStore.showFooter
  return showFooter.value
})

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
</script>