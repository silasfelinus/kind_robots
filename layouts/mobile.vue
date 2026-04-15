<!-- /layouts/mobile.vue -->
<template>
  <div class="relative flex flex-col min-h-dvh w-full overflow-hidden bg-base-100">
    <div class="pointer-events-none absolute inset-0 bg-success/5"></div>

    <div
      class="pointer-events-none fixed right-2 top-2 z-[120] rounded-2xl border border-success bg-success/20 px-3 py-1 text-xs font-bold text-success-content"
    >
      MOBILE LAYOUT
    </div>

    <layout-region
      v-if="showHeaderFinal"
      title="H1 Mobile Header"
      tone="success"
      toggle-side="right"
      :show="showHeaderFinal"
      :show-filler="debugStore.fillerHeader"
      :can-toggle-visibility="debugStore.enabled"
      :can-toggle-filler="debugStore.enabled"
      content-class="h-full min-h-0 pt-8"
      :height="`calc(var(--vh) * ${headerHeight})`"
      @toggle-visibility="debugStore.showHeader = $event"
      @toggle-filler="debugStore.fillerHeader = $event"
    >
      <template #default>
        <header class="h-full w-full min-h-0">
          <slot name="header">
            <main-header />
          </slot>
        </header>
      </template>

      <template #filler>
        <div class="flex h-full items-center justify-between gap-2 px-4">
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
      </template>
    </layout-region>

    <div class="relative z-10 flex-1 min-h-0 w-full overflow-hidden">
      <layout-region
        title="M2 Mobile Main"
        tone="accent"
        toggle-side="right"
        :show="true"
        :show-filler="debugStore.fillerMain"
        :can-toggle-visibility="false"
        :can-toggle-filler="debugStore.enabled"
        section-class="h-full w-full overflow-y-auto overscroll-y-contain"
        content-class="container mx-auto h-full w-full min-h-0 px-2 py-10"
        @toggle-filler="debugStore.fillerMain = $event"
      >
        <template #default>
          <slot />
        </template>

        <template #filler>
          <div class="grid gap-4">
            <div class="rounded-2xl border border-accent/30 bg-base-100/80 p-4">
              <div class="flex items-center gap-3">
                <Icon name="kind-icon:story." class="text-3xl text-accent" />
                <div>
                  <div class="text-lg font-black">Mobile Page Title</div>
                  <div class="text-sm opacity-70">
                    This is filler content for the main region.
                  </div>
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
        </template>
      </layout-region>
    </div>

    <layout-region
      v-if="showFooterFinal"
      title="F4 Mobile Footer"
      tone="success"
      toggle-side="right"
      :show="showFooterFinal"
      :show-filler="debugStore.fillerFooter"
      :can-toggle-visibility="debugStore.enabled"
      :can-toggle-filler="debugStore.enabled"
      content-class="h-full min-h-0 pt-8"
      :height="`calc(var(--vh) * ${footerHeight})`"
      @toggle-visibility="debugStore.showFooter = $event"
      @toggle-filler="debugStore.fillerFooter = $event"
    >
      <template #default>
        <footer class="h-full w-full min-h-0">
          <slot name="footer">
            <main-footer />
          </slot>
        </footer>
      </template>

      <template #filler>
        <div class="flex h-full items-center justify-between gap-2 px-4">
          <div class="text-sm font-bold">Footer Zone</div>
          <div class="flex items-center gap-2">
            <Icon name="kind-icon:brainstorm." class="text-xl" />
            <Icon name="kind-icon:wonderlab." class="text-xl" />
            <Icon name="kind-icon:story." class="text-xl" />
          </div>
        </div>
      </template>
    </layout-region>
  </div>
</template>

<script setup lang="ts">
// /layouts/mobile.vue
import { computed } from 'vue'
import LayoutRegion from '@/components/layout/layout-region.vue'
import { useDebugStore } from '@/stores/debugStore'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

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