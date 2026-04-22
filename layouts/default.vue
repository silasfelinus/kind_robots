<!-- /layouts/default.vue -->
<template>
  <div class="flex min-h-dvh w-full flex-col overflow-hidden bg-base-200">
    <header
      class="fixed overflow-hidden border-b-2 border-primary-focus text-primary-content transition-[height,width,left,top] duration-200"
      :style="displayStore.headerStyle"
    >
      <slot name="header">
        <full-header />
      </slot>
    </header>

    <div
      v-if="displayStore.headerState === 'hidden'"
      class="pointer-events-none fixed left-3 top-3 z-30"
    >
      <div class="pointer-events-auto flex items-start">
        <button
          ref="headerToggleRef"
          class="icon-btn icon-btn--pill icon-btn--base opacity-80 hover:opacity-100"
          title="Open header"
          @click="displayStore.toggleHeader('open')"
        >
          <Icon name="kind-icon:chevron-down" class="icon-btn__icon" />
        </button>
        <butterfly-toggle
          toggle-key="header"
          :target-ref="headerToggleRef"
          :perch-offset-x="0"
        />
      </div>
    </div>

    <corner-panel
      v-if="displayStore.showCornerPanel"
      class="pointer-events-auto fixed"
      :style="displayStore.cornerPanelStyle"
    />

    <ClientOnly>
      <aside
        class="fixed overflow-visible text-secondary-content transition-[top,height,width,left] duration-200"
        :style="displayStore.leftSidebarStyle"
      >
        <div class="sidebar-region sidebar-region--secondary">
          <div class="sidebar-shell">
            <div
              v-if="leftSidebarBackground"
              class="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
            >
              <NuxtImg
                :src="leftSidebarBackground"
                alt="Sidebar background"
                :sizes="sidebarImageSizes"
                class="absolute inset-0 h-full w-full object-cover border border-black"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-base-200/80 mix-blend-multiply" />
              <div class="absolute inset-0 bg-base-100/60" />
            </div>

            <div
              ref="leftScrollRef"
              class="smart-scroll-container sidebar-scroll"
              @scroll="updateScrollState('left')"
            >
              <div
                :key="`left-${localPageKey}`"
                class="sidebar-scroll__content"
              >
                <slot name="left">
                  <splash-tutorial />
                </slot>
              </div>
            </div>

            <button
              v-if="leftCanScrollUp"
              type="button"
              class="scroll-button scroll-button--top"
              title="Scroll up"
              @click.stop="scrollSidebar('left', 'up')"
            >
              <Icon name="kind-icon:chevron-up" class="h-6 w-6" />
            </button>

            <button
              v-if="leftCanScrollDown"
              type="button"
              class="scroll-button scroll-button--bottom"
              title="Scroll down"
              @click.stop="scrollSidebar('left', 'down')"
            >
              <Icon name="kind-icon:chevron-down" class="h-6 w-6" />
            </button>
          </div>
        </div>
      </aside>

      <template #fallback />
    </ClientOnly>

    <ClientOnly>
      <aside
        class="fixed overflow-visible text-accent-content transition-[top,height,width,right] duration-200"
        :style="displayStore.rightSidebarStyle"
      >
        <div class="sidebar-region sidebar-region--accent">
          <div class="sidebar-shell">
            <div
              ref="rightScrollRef"
              class="smart-scroll-container sidebar-scroll"
              @scroll="updateScrollState('right')"
            >
              <div class="sidebar-scroll__content">
                <slot name="right">
                  <gallery-gallery />
                </slot>
              </div>
            </div>

            <button
              v-if="rightCanScrollUp"
              type="button"
              class="scroll-button scroll-button--top"
              title="Scroll up"
              @click.stop="scrollSidebar('right', 'up')"
            >
              <Icon name="kind-icon:chevron-up" class="h-4 w-4" />
            </button>

            <button
              v-if="rightCanScrollDown"
              type="button"
              class="scroll-button scroll-button--bottom"
              title="Scroll down"
              @click.stop="scrollSidebar('right', 'down')"
            >
              <Icon name="kind-icon:chevron-down" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <template #fallback />
    </ClientOnly>

    <button
      ref="leftToggleRef"
      class="pointer-events-auto sidebar-toggle icon-btn icon-btn--edge icon-btn--secondary"
      :style="displayStore.leftToggleStyle"
      :title="leftSidebarTitle"
      @click="displayStore.toggleLeftSidebar"
    >
      <Icon :name="leftSidebarIcon" class="icon-btn__icon" />
    </button>

    <butterfly-toggle
      toggle-key="left-sidebar"
      :target-ref="leftToggleRef"
      :perch-offset-x="0"
    />

    <button
      ref="rightToggleRef"
      class="pointer-events-auto sidebar-toggle icon-btn icon-btn--edge icon-btn--accent"
      :style="displayStore.rightToggleStyle"
      :title="rightSidebarTitle"
      @click="displayStore.toggleRightSidebar"
    >
      <Icon :name="rightSidebarIcon" class="icon-btn__icon" />
    </button>

    <butterfly-toggle
      toggle-key="right-sidebar"
      :target-ref="rightToggleRef"
      :perch-offset-x="0"
    />

    <main
      class="fixed overflow-hidden rounded-none border border-base-300/60 bg-base-200 text-base-content transition-[top,left,width,height] duration-200"
      :style="adjustedMainStyle"
    >
      <div
        :key="`main-${localPageKey}`"
        class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 pb-4"
        :style="mainInnerStyle"
      >
        <div class="flex min-h-full w-full flex-col justify-start">
          <slot />
        </div>
      </div>
    </main>

    <footer
      class="fixed overflow-hidden border-t-2 border-base-content/20 bg-base-200 text-base-content transition-[height,width,left,bottom] duration-200"
      :style="displayStore.footerStyle"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="footer">
          <footer-selector />
        </slot>
      </div>
    </footer>

    <div
      class="pointer-events-none fixed"
      :style="displayStore.footerToggleStyle"
    >
      <div class="pointer-events-auto flex justify-center">
        <button
          ref="footerToggleRef"
          type="button"
          class="flex items-center justify-center rounded-full border-2 border-base-content/30 bg-base-100/95 text-base-content shadow-lg shadow-base-content/20 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-primary/60 hover:bg-base-100 hover:text-primary hover:shadow-[0_0_1.5rem_rgba(255,255,255,0.25)] active:scale-95"
          :class="footerToggleButtonClass"
          :title="footerTitle"
          @click="displayStore.toggleFooter"
        >
          <Icon :name="footerIcon" :class="footerToggleIconClass" />
        </button>
        <butterfly-toggle
          toggle-key="footer"
          :target-ref="footerToggleRef"
          :perch-offset-y="0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NuxtImg } from '#components'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

import { useButterflyStore } from '@/stores/butterflyStore'
const butterflyStore = useButterflyStore()

watch(
  () => displayStore.leftToggleStyle,
  async () => {
    await nextTick()
    if (leftToggleRef.value)
      butterflyStore.relocateToggleButterfly(
        'left-sidebar',
        leftToggleRef.value,
      )
  },
  { deep: true },
)

watch(
  () => displayStore.rightToggleStyle,
  async () => {
    await nextTick()
    if (rightToggleRef.value)
      butterflyStore.relocateToggleButterfly(
        'right-sidebar',
        rightToggleRef.value,
      )
  },
  { deep: true },
)

watch(
  () => displayStore.footerToggleStyle,
  async () => {
    await nextTick()
    if (footerToggleRef.value)
      butterflyStore.relocateToggleButterfly('footer', footerToggleRef.value)
  },
  { deep: true },
)

watch(
  () => displayStore.headerToggleStyle,
  async () => {
    await nextTick()
    if (headerToggleRef.value)
      butterflyStore.relocateToggleButterfly('header', headerToggleRef.value)
  },
  { deep: true },
)

type SidebarKey = 'left' | 'right'
type ScrollDirection = 'up' | 'down'

const route = useRoute()
const displayStore = useDisplayStore()
const pageStore = usePageStore()

const leftScrollRef = ref<HTMLElement | null>(null)
const rightScrollRef = ref<HTMLElement | null>(null)

const leftCanScrollUp = ref(false)
const leftCanScrollDown = ref(false)
const rightCanScrollUp = ref(false)
const rightCanScrollDown = ref(false)

const headerToggleRef = ref<HTMLElement | null>(null)
const leftToggleRef = ref<HTMLElement | null>(null)
const rightToggleRef = ref<HTMLElement | null>(null)
const footerToggleRef = ref<HTMLElement | null>(null)

const localPageKey = computed(() => route.path)

const sidebarImageSizes = computed(
  () => '(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 420px',
)

const adjustedMainStyle = computed(() => {
  const mainStyle = displayStore.mainContentStyle as Record<string, string>
  const headerStyle = displayStore.headerStyle as Record<string, string>

  const headerTop = headerStyle.top ?? '0px'
  const headerHeight = headerStyle.height ?? '0px'
  const mainTop = mainStyle.top ?? '0px'

  return {
    ...mainStyle,
    top: `max(${mainTop}, calc(${headerTop} + ${headerHeight} + 0.75rem))`,
  }
})

const leftSidebarBackground = computed(() => {
  const img = pageStore.page?.image || '/images/botcafe.webp'
  return img.startsWith('/') ? img : `/images/${img}`
})

onMounted(async () => {
  displayStore.initialize()
  await nextTick()
  updateAllScrollStates()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})

watch(
  () => [
    displayStore.leftSidebarModeLabel,
    displayStore.rightSidebarModeLabel,
    displayStore.mainContentStyle,
    pageStore.page?.image,
    route.path,
  ],
  async () => {
    await nextTick()
    updateAllScrollStates()
  },
  { deep: true },
)

const footerIcon = computed(() => {
  if (displayStore.footerState === 'hidden') return 'kind-icon:chevron-up'
  if (displayStore.footerState === 'compact') return 'kind-icon:chevron-up'
  if (displayStore.footerState === 'open') return 'kind-icon:chevron-up'
  return 'kind-icon:chevron-down'
})

const footerTitle = computed(() => {
  if (displayStore.footerState === 'hidden') return 'Open footer'
  if (displayStore.footerState === 'compact') return 'Expand footer'
  if (displayStore.footerState === 'open') return 'Prioritize footer'
  return 'Reduce footer'
})

const footerToggleButtonClass = computed(() => {
  if (displayStore.footerState === 'hidden') {
    return 'h-14 w-14 sm:h-16 sm:w-16'
  }
  if (displayStore.footerState === 'compact') {
    return 'h-12 w-12 sm:h-14 sm:w-14'
  }
  if (displayStore.footerState === 'open') {
    return 'h-10 w-10 sm:h-12 sm:w-12'
  }
  return 'h-9 w-9 sm:h-10 sm:w-10'
})

const footerToggleIconClass = computed(() => {
  if (displayStore.footerState === 'hidden') {
    return 'h-6 w-6 sm:h-7 sm:w-7'
  }
  if (displayStore.footerState === 'compact') {
    return 'h-5 w-5 sm:h-6 sm:w-6'
  }
  if (displayStore.footerState === 'open') {
    return 'h-4 w-4 sm:h-5 sm:w-5'
  }
  return 'h-4 w-4'
})

const leftSidebarIcon = computed(() => {
  const state = displayStore.leftSidebarModeLabel
  if (state === 'hidden') return 'kind-icon:sidebar-left'
  if (state === 'priority') return 'kind-icon:chevron-left'
  return 'kind-icon:chevron-right'
})

const rightSidebarIcon = computed(() => {
  const state = displayStore.rightSidebarModeLabel
  if (state === 'hidden') return 'kind-icon:sidebar-right'
  if (state === 'priority') return 'kind-icon:chevron-right'
  return 'kind-icon:chevron-left'
})

const leftSidebarTitle = computed(() => {
  if (displayStore.leftSidebarModeLabel === 'hidden') return 'Open left sidebar'
  if (displayStore.leftSidebarModeLabel === 'compact')
    return 'Expand left sidebar'
  if (displayStore.leftSidebarModeLabel === 'open')
    return 'Prioritize left sidebar'
  return 'Reduce left sidebar'
})

const rightSidebarTitle = computed(() => {
  if (displayStore.rightSidebarModeLabel === 'hidden')
    return 'Open right sidebar'
  if (displayStore.rightSidebarModeLabel === 'compact')
    return 'Expand right sidebar'
  if (displayStore.rightSidebarModeLabel === 'open')
    return 'Prioritize right sidebar'
  return 'Reduce right sidebar'
})

const mainInnerStyle = computed(() => {
  return {
    paddingTop: displayStore.showCorner ? '5.5rem' : '1rem',
  }
})

function getScrollElement(side: SidebarKey): HTMLElement | null {
  return side === 'left' ? leftScrollRef.value : rightScrollRef.value
}

function setScrollFlags(
  side: SidebarKey,
  canUp: boolean,
  canDown: boolean,
): void {
  if (side === 'left') {
    leftCanScrollUp.value = canUp
    leftCanScrollDown.value = canDown
    return
  }
  rightCanScrollUp.value = canUp
  rightCanScrollDown.value = canDown
}

function updateScrollState(side: SidebarKey): void {
  const el = getScrollElement(side)
  if (!el) {
    setScrollFlags(side, false, false)
    return
  }

  const canUp = el.scrollTop > 2
  const canDown = el.scrollTop + el.clientHeight < el.scrollHeight - 2

  setScrollFlags(side, canUp, canDown)
}

function updateAllScrollStates(): void {
  updateScrollState('left')
  updateScrollState('right')
}

function scrollSidebar(side: SidebarKey, direction: ScrollDirection): void {
  const el = getScrollElement(side)
  if (!el) return

  const delta = el.clientHeight * 0.6 * (direction === 'up' ? -1 : 1)
  el.scrollBy({ top: delta, behavior: 'smooth' })

  window.setTimeout(() => updateScrollState(side), 200)
}
</script>
