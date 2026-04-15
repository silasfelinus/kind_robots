<!-- /layouts/tablet.vue -->
<template>
  <div class="relative flex flex-col min-h-dvh w-full overflow-hidden bg-base-100">
    <div class="pointer-events-none absolute inset-0 bg-warning/5"></div>

    <div
      v-if="showHeaderFinal"
      class="relative z-10 w-full shrink-0 border-b border-base-300 bg-warning/10"
      :style="{ height: `calc(var(--vh) * ${headerHeight})` }"
    >
      <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-warning bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-warning shadow-lg">
        H1 Tablet Header
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
            class="flex h-full items-center justify-between gap-4 px-4"
          >
            <div class="flex items-center gap-3">
              <Icon name="kind-icon:butterfly." class="text-3xl text-warning" />
              <div>
                <div class="font-black">Kind Robots</div>
                <div class="text-xs opacity-70">Tablet Header Demo</div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button class="btn btn-xs rounded-2xl">Search</button>
              <button class="btn btn-xs rounded-2xl">Mode</button>
              <button class="btn btn-xs rounded-2xl">Theme</button>
            </div>
          </div>

          <main-header v-else />
        </slot>
      </header>
    </div>

    <div class="relative z-10 flex flex-1 min-h-0 w-full overflow-hidden">
      <aside
        v-if="showLeftSidebarFinal"
        class="relative shrink-0 h-full overflow-y-auto border-r border-base-300 bg-secondary/10"
        :style="{ width: `${sidebarLeftWidth}vw` }"
      >
        <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-secondary bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-secondary shadow-lg">
          L2 Tablet Left
        </div>

        <button
          class="btn btn-xs btn-outline absolute right-2 top-2 z-30 rounded-2xl"
          @click="debugStore.toggle('left')"
        >
          Toggle
        </button>

        <div class="h-full min-h-0 pt-8">
          <slot name="left">
            <div
              v-if="debugStore.enabled && debugStore.fillerLeft"
              class="flex h-full flex-col gap-3 p-3"
            >
              <button class="btn justify-start rounded-2xl">
                <Icon name="kind-icon:brainstorm." class="text-xl" />
                Brainstorm
              </button>
              <button class="btn justify-start rounded-2xl">
                <Icon name="kind-icon:wonderlab." class="text-xl" />
                Wonderlab
              </button>
              <button class="btn justify-start rounded-2xl">
                <Icon name="kind-icon:story." class="text-xl" />
                Story
              </button>
              <button class="btn justify-start rounded-2xl">
                <Icon name="kind-icon:gallery." class="text-xl" />
                Gallery
              </button>
            </div>

            <left-sidebar v-else />
          </slot>
        </div>
      </aside>

      <main class="relative flex-1 min-w-0 h-full overflow-y-auto overscroll-y-contain bg-accent/5">
        <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-accent bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-accent shadow-lg">
          M3 Tablet Main
        </div>

        <button
          class="btn btn-xs btn-outline absolute right-2 top-2 z-30 rounded-2xl"
          @click="debugStore.toggleFiller('main')"
        >
          Toggle Filler
        </button>

        <div class="container mx-auto h-full w-full min-h-0 px-3 py-10">
          <div
            v-if="debugStore.enabled && debugStore.fillerMain"
            class="grid gap-4"
          >
            <div class="rounded-2xl border border-accent/30 bg-base-100/80 p-5">
              <div class="flex items-center gap-3">
                <Icon name="kind-icon:story." class="text-4xl text-accent" />
                <div>
                  <div class="text-xl font-black">Tablet Main Content</div>
                  <div class="text-sm opacity-70">Comfortably roomy, not full desktop chaos.</div>
                </div>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-2xl border border-base-300 bg-base-100/80 p-4">
                <div class="font-bold">Example Card</div>
                <div class="mt-2 text-sm opacity-80">
                  Titles, filters, and quick actions can live here.
                </div>
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-100/80 p-4">
                <div class="font-bold">Toggle Row</div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button class="btn btn-xs rounded-2xl">View</button>
                  <button class="btn btn-xs rounded-2xl">Sort</button>
                  <button class="btn btn-xs rounded-2xl">Filter</button>
                </div>
              </div>
            </div>
          </div>

          <slot />
        </div>
      </main>

      <aside
        v-if="showRightSidebarFinal"
        class="relative shrink-0 h-full overflow-y-auto border-l border-base-300 bg-warning/10"
        :style="{ width: `${sidebarRightWidth}vw` }"
      >
        <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-warning bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-warning shadow-lg">
          R4 Tablet Right
        </div>

        <button
          class="btn btn-xs btn-outline absolute right-2 top-2 z-30 rounded-2xl"
          @click="debugStore.toggle('right')"
        >
          Toggle
        </button>

        <div class="h-full min-h-0 pt-8">
          <slot name="right">
            <div
              v-if="debugStore.enabled && debugStore.fillerRight"
              class="grid gap-3 p-3"
            >
              <div class="rounded-2xl border border-base-300 bg-base-100/80 p-3">
                <div class="font-bold">Inspector</div>
                <div class="mt-2 text-sm opacity-80">Utility panel content goes here.</div>
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-100/80 p-3">
                <div class="font-bold">Toggles</div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button class="btn btn-xs rounded-2xl">A</button>
                  <button class="btn btn-xs rounded-2xl">B</button>
                  <button class="btn btn-xs rounded-2xl">C</button>
                </div>
              </div>
            </div>

            <right-sidebar v-else />
          </slot>
        </div>
      </aside>
    </div>

    <div
      v-if="showFooterFinal"
      class="relative z-10 w-full shrink-0 border-t border-base-300 bg-success/10"
      :style="{ height: `calc(var(--vh) * ${footerHeight})` }"
    >
      <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-success bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-success shadow-lg">
        F5 Tablet Footer
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
            <div class="font-bold">Tablet Footer</div>
            <div class="flex items-center gap-3">
              <Icon name="kind-icon:brainstorm." class="text-xl" />
              <Icon name="kind-icon:wonderlab." class="text-xl" />
              <Icon name="kind-icon:story." class="text-xl" />
              <Icon name="kind-icon:gallery." class="text-xl" />
            </div>
          </div>

          <main-footer v-else />
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
import { useDebugStore } from '@/stores/debugStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()
const debugStore = useDebugStore()

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

const showHeaderFinal = computed(() => {
  if (debugStore.enabled) return debugStore.showHeader
  return showHeader.value
})

const showFooterFinal = computed(() => {
  if (debugStore.enabled) return debugStore.showFooter
  return showFooter.value
})

const showLeftSidebarFinal = computed(() => {
  if (debugStore.enabled) return debugStore.showLeft
  return showLeftSidebar.value
})

const showRightSidebarFinal = computed(() => {
  if (debugStore.enabled) return debugStore.showRight
  return showRightSidebar.value
})

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
</script>