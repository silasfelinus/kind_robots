<!-- /components/debug/layout-debug-panel.vue -->
<template>
  <div class="fixed bottom-4 left-4 z-[10001]">
    <div class="rounded-2xl border border-base-300 bg-base-100/95 shadow-2xl backdrop-blur">
      <div class="flex flex-col gap-3 p-3 min-w-[18rem]">
        <div class="text-xs font-black uppercase tracking-[0.3em] text-primary">
          Layout Toggles
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            class="btn btn-sm rounded-2xl"
            :class="showHeader ? 'btn-success' : 'btn-outline'"
            @click="toggleHeader"
          >
            Header {{ showHeader ? 'On' : 'Off' }}
          </button>

          <button
            class="btn btn-sm rounded-2xl"
            :class="showFooter ? 'btn-success' : 'btn-outline'"
            @click="toggleFooter"
          >
            Footer {{ showFooter ? 'On' : 'Off' }}
          </button>

          <button
            class="btn btn-sm rounded-2xl"
            :class="showLeft ? 'btn-success' : 'btn-outline'"
            @click="toggleLeft"
          >
            Left {{ showLeft ? 'On' : 'Off' }}
          </button>

          <button
            class="btn btn-sm rounded-2xl"
            :class="showRight ? 'btn-success' : 'btn-outline'"
            @click="toggleRight"
          >
            Right {{ showRight ? 'On' : 'Off' }}
          </button>
        </div>

        <div class="border-t border-base-300 pt-2">
          <div class="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-secondary">
            Footer Permission
          </div>

          <button
            class="btn btn-sm rounded-2xl w-full"
            :class="pageFooterEnabled ? 'btn-secondary' : 'btn-outline'"
            @click="togglePageFooter"
          >
            Page showFooter {{ pageFooterEnabled ? 'True' : 'False' }}
          </button>
        </div>

        <div class="border-t border-base-300 pt-2">
          <div class="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-accent">
            Quick Presets
          </div>

          <div class="grid grid-cols-1 gap-2">
            <button class="btn btn-sm btn-outline rounded-2xl" @click="setMobilePreset">
              Mobile Preset
            </button>
            <button class="btn btn-sm btn-outline rounded-2xl" @click="setTabletPreset">
              Tablet Preset
            </button>
            <button class="btn btn-sm btn-outline rounded-2xl" @click="setDesktopPreset">
              Desktop Preset
            </button>
            <button class="btn btn-sm btn-primary rounded-2xl" @click="showEverything">
              Show Everything
            </button>
          </div>
        </div>

        <div class="border-t border-base-300 pt-2 text-xs opacity-80">
          <div>Header: {{ displayStore.headerState }}</div>
          <div>Left: {{ displayStore.sidebarLeftState }}</div>
          <div>Right: {{ displayStore.sidebarRightState }}</div>
          <div>Footer: {{ displayStore.footerState }}</div>
          <div>Page Footer: {{ pageFooterEnabled }}</div>
          <div>Viewport: {{ displayStore.viewportSize }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/debug/layout-debug-panel.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const showHeader = computed(() => displayStore.headerState !== 'hidden')
const showLeft = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarLeftState),
)
const showRight = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarRightState),
)
const showFooter = computed(() => displayStore.footerState !== 'hidden')
const pageFooterEnabled = computed(() => Boolean(pageStore.page?.showFooter))

function toggleHeader() {
  displayStore.changeState(
    'headerState',
    displayStore.headerState === 'hidden' ? 'open' : 'hidden',
  )
}

function toggleLeft() {
  displayStore.changeState(
    'sidebarLeftState',
    ['open', 'compact'].includes(displayStore.sidebarLeftState) ? 'hidden' : 'open',
  )
}

function toggleRight() {
  displayStore.changeState(
    'sidebarRightState',
    ['open', 'compact'].includes(displayStore.sidebarRightState) ? 'hidden' : 'open',
  )
}

function toggleFooter() {
  displayStore.changeState(
    'footerState',
    displayStore.footerState === 'hidden' ? 'compact' : 'hidden',
  )
}

function togglePageFooter() {
  if (!pageStore.page) return
  pageStore.page.showFooter = !pageStore.page.showFooter
}

function setMobilePreset() {
  displayStore.changeState('headerState', 'open')
  displayStore.changeState('sidebarLeftState', 'hidden')
  displayStore.changeState('sidebarRightState', 'hidden')
  displayStore.changeState('footerState', 'compact')

  if (pageStore.page) {
    pageStore.page.showFooter = true
  }
}

function setTabletPreset() {
  displayStore.changeState('headerState', 'open')
  displayStore.changeState('sidebarLeftState', 'open')
  displayStore.changeState('sidebarRightState', 'hidden')
  displayStore.changeState('footerState', 'compact')

  if (pageStore.page) {
    pageStore.page.showFooter = true
  }
}

function setDesktopPreset() {
  displayStore.changeState('headerState', 'open')
  displayStore.changeState('sidebarLeftState', 'open')
  displayStore.changeState('sidebarRightState', 'open')
  displayStore.changeState('footerState', 'compact')

  if (pageStore.page) {
    pageStore.page.showFooter = true
  }
}

function showEverything() {
  displayStore.changeState('headerState', 'open')
  displayStore.changeState('sidebarLeftState', 'open')
  displayStore.changeState('sidebarRightState', 'open')
  displayStore.changeState('footerState', 'open')

  if (pageStore.page) {
    pageStore.page.showFooter = true
  }
}
</script>