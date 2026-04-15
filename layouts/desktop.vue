<!-- /layouts/desktop.vue -->
<template>
  <div class="flex flex-col min-h-dvh w-full overflow-hidden bg-base-100">
    <div
      class="pointer-events-none fixed right-2 top-2 z-[120] rounded-2xl border border-info bg-info/20 px-3 py-1 text-xs font-bold text-info-content"
    >
      DESKTOP LAYOUT
    </div>

    <layout-region
      v-if="showHeaderFinal"
      title="H1 Desktop Header"
      tone="info"
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
        <div class="flex h-full items-center justify-between gap-4 px-5">
          <div class="flex items-center gap-3">
            <Icon name="kind-icon:butterfly." class="text-3xl text-info" />
            <div>
              <div class="font-black">Kind Robots Desktop</div>
              <div class="text-xs opacity-70">Header filler with title and controls</div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button class="btn btn-xs rounded-2xl">Search</button>
            <button class="btn btn-xs rounded-2xl">Create</button>
            <button class="btn btn-xs rounded-2xl">Theme</button>
            <button class="btn btn-xs rounded-2xl">Profile</button>
          </div>
        </div>
      </template>
    </layout-region>

    <div class="flex flex-1 min-h-0 w-full overflow-hidden">
      <layout-region
        v-if="showLeftSidebarFinal"
        title="L2 Desktop Left"
        tone="secondary"
        toggle-side="right"
        :show="showLeftSidebarFinal"
        :show-filler="debugStore.fillerLeft"
        :can-toggle-visibility="debugStore.enabled"
        :can-toggle-filler="debugStore.enabled"
        section-class="shrink-0 h-full overflow-y-auto"
        content-class="h-full min-h-0 pt-8"
        :width="`${sidebarLeftWidth}vw`"
        @toggle-visibility="debugStore.showLeft = $event"
        @toggle-filler="debugStore.fillerLeft = $event"
      >
        <template #default>
          <slot name="left">
            <left-sidebar />
          </slot>
        </template>

        <template #filler>
          <div class="flex h-full flex-col gap-3">
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
            <button class="btn justify-start rounded-2xl">
              <Icon name="kind-icon:botcafe." class="text-xl" />
              Bot Café
            </button>
          </div>
        </template>
      </layout-region>

      <layout-region
        title="M3 Desktop Main"
        tone="accent"
        toggle-side="right"
        :show="true"
        :show-filler="debugStore.fillerMain"
        :can-toggle-visibility="false"
        :can-toggle-filler="debugStore.enabled"
        section-class="flex-1 min-w-0 h-full overflow-y-auto overscroll-y-contain"
        content-class="container mx-auto h-full w-full min-h-0 px-4 py-10"
        @toggle-filler="debugStore.fillerMain = $event"
      >
        <template #default>
          <slot />
        </template>

        <template #filler>
          <div class="grid gap-5">
            <div class="rounded-2xl border border-accent/30 bg-base-100/80 p-6">
              <div class="flex items-center gap-4">
                <Icon name="kind-icon:story." class="text-5xl text-accent" />
                <div>
                  <div class="text-2xl font-black">Desktop Main Content</div>
                  <div class="text-sm opacity-70">
                    Room for cards, filters, tools, and whatever other gremlins you install later.
                  </div>
                </div>
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-3">
              <div class="rounded-2xl border border-base-300 bg-base-100/80 p-4">
                <div class="font-bold">Primary Card</div>
                <div class="mt-2 text-sm opacity-80">
                  Good spot for stats, feed items, or summaries.
                </div>
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-100/80 p-4">
                <div class="font-bold">Action Card</div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button class="btn btn-xs rounded-2xl">Run</button>
                  <button class="btn btn-xs rounded-2xl">Save</button>
                  <button class="btn btn-xs rounded-2xl">Share</button>
                </div>
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-100/80 p-4">
                <div class="font-bold">Preview Card</div>
                <div class="mt-2 h-24 rounded-2xl border border-dashed border-base-300 bg-base-200/60"></div>
              </div>
            </div>
          </div>
        </template>
      </layout-region>

      <layout-region
        v-if="showRightSidebarFinal"
        title="R4 Desktop Right"
        tone="warning"
        toggle-side="left"
        :show="showRightSidebarFinal"
        :show-filler="debugStore.fillerRight"
        :can-toggle-visibility="debugStore.enabled"
        :can-toggle-filler="debugStore.enabled"
        section-class="shrink-0 h-full overflow-y-auto"
        content-class="h-full min-h-0 pt-8"
        :width="`${sidebarRightWidth}vw`"
        @toggle-visibility="debugStore.showRight = $event"
        @toggle-filler="debugStore.fillerRight = $event"
      >
        <template #default>
          <slot name="right">
            <right-sidebar />
          </slot>
        </template>

        <template #filler>
          <div class="grid gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-100/80 p-3">
              <div class="font-bold">Inspector</div>
              <div class="mt-2 text-sm opacity-80">Selected item details.</div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100/80 p-3">
              <div class="font-bold">Filters</div>
              <div class="mt-2 flex flex-wrap gap-2">
                <button class="btn btn-xs rounded-2xl">Public</button>
                <button class="btn btn-xs rounded-2xl">Mine</button>
                <button class="btn btn-xs rounded-2xl">Newest</button>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100/80 p-3">
              <div class="font-bold">Stats</div>
              <div class="mt-2 text-sm opacity-80">18 Items</div>
            </div>
          </div>
        </template>
      </layout-region>
    </div>

    <layout-region
      v-if="showFooterFinal"
      title="F5 Desktop Footer"
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
        <div class="flex h-full items-center justify-between gap-2 px-5">
          <div class="font-bold">Desktop Footer</div>
          <div class="flex items-center gap-3">
            <Icon name="kind-icon:brainstorm." class="text-xl" />
            <Icon name="kind-icon:wonderlab." class="text-xl" />
            <Icon name="kind-icon:story." class="text-xl" />
            <Icon name="kind-icon:gallery." class="text-xl" />
            <Icon name="kind-icon:botcafe." class="text-xl" />
          </div>
        </div>
      </template>
    </layout-region>
  </div>
</template>

<script setup lang="ts">
// /layouts/desktop.vue
import { computed } from 'vue'
import LayoutRegion from '@/components/layout/layout-region.vue'
import { useDebugStore } from '@/stores/debugStore'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const debugStore = useDebugStore()
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