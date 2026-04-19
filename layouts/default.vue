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
      class="pointer-events-none fixed"
      :style="displayStore.headerToggleStyle"
    >
      <div class="pointer-events-auto flex items-start">
        <button
          class="icon-btn icon-btn--pill icon-btn--base opacity-80 hover:opacity-100"
          title="Open header"
          @click="displayStore.toggleHeader('open')"
        >
          <Icon name="kind-icon:chevron-down" class="icon-btn__icon" />
        </button>
      </div>
    </div>

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
              <div class="sidebar-scroll__content">
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
              <Icon name="kind-icon:chevron-up" class="h-4 w-4" />
            </button>

            <button
              v-if="leftCanScrollDown"
              type="button"
              class="scroll-button scroll-button--bottom"
              title="Scroll down"
              @click.stop="scrollSidebar('left', 'down')"
            >
              <Icon name="kind-icon:chevron-down" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          class="sidebar-toggle sidebar-toggle--left icon-btn icon-btn--edge icon-btn--secondary"
          :title="leftSidebarTitle"
          @click="displayStore.toggleLeftSidebar"
        >
          <Icon :name="leftSidebarIcon" class="icon-btn__icon" />
        </button>
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
                  <user-dashboard />
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

        <button
          class="sidebar-toggle sidebar-toggle--right icon-btn icon-btn--edge icon-btn--accent"
          :title="rightSidebarTitle"
          @click="displayStore.toggleRightSidebar"
        >
          <Icon :name="rightSidebarIcon" class="icon-btn__icon" />
        </button>
      </aside>

      <template #fallback />
    </ClientOnly>

    <main
      class="fixed overflow-hidden rounded-none border border-base-300/60 bg-base-200 text-base-content transition-[top,left,width,height] duration-200"
      :style="displayStore.mainContentStyle"
    >
      <corner-panel
        class="pointer-events-auto fixed z-40"
        :style="displayStore.cornerPanelStyle"
      />

      <div
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
          <art-generator />
        </slot>
      </div>
    </footer>

    <div
      class="pointer-events-none fixed"
      :style="displayStore.footerToggleStyle"
    >
      <div class="pointer-events-auto flex justify-center">
        <button
          class="icon-btn icon-btn--pill icon-btn--base"
          title="Toggle footer"
          @click="displayStore.toggleFooter"
        >
          <Icon :name="footerIcon" class="icon-btn__icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NuxtImg } from '#components'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

type SidebarKey = 'left' | 'right'
type ScrollDirection = 'up' | 'down'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const leftScrollRef = ref<HTMLElement | null>(null)
const rightScrollRef = ref<HTMLElement | null>(null)

const leftCanScrollUp = ref(false)
const leftCanScrollDown = ref(false)
const rightCanScrollUp = ref(false)
const rightCanScrollDown = ref(false)

const sidebarImageSizes = computed(
  () => '(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 420px',
)

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
<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-style: solid;
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s,
    border-color 0.15s,
    color 0.15s;
  box-shadow: 0 1px 6px oklch(0 0 0 / 0.18);
  backdrop-filter: blur(8px);
}

.icon-btn--pill {
  padding: 0.35rem 0.65rem;
  border-radius: 9999px;
}

.icon-btn--edge {
  width: 2rem;
  height: 2.75rem;
  border-radius: 0.85rem;
  padding: 0;
}

.icon-btn--secondary {
  background: oklch(var(--s) / 0.95);
  border-color: oklch(var(--sf) / 0.9);
  color: oklch(var(--sc) / 1);
}

.icon-btn--secondary:hover {
  background: oklch(var(--sf) / 1);
}

.icon-btn--accent {
  background: oklch(var(--a) / 0.95);
  border-color: oklch(var(--af) / 0.9);
  color: oklch(var(--ac) / 1);
}

.icon-btn--accent:hover {
  background: oklch(var(--af) / 1);
}

.icon-btn--base {
  background: oklch(var(--b2) / 0.95);
  border-color: oklch(var(--b3) / 0.9);
  color: oklch(var(--bc) / 1);
}

.icon-btn--base:hover {
  background: oklch(var(--b3) / 1);
}

.icon-btn__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  opacity: 0.95;
  transition: transform 0.15s ease;
}

.icon-btn:hover .icon-btn__icon {
  transform: scale(1.06);
}

.sidebar-toggle {
  position: absolute;
  top: 50%;
  z-index: 60;
  transform: translateY(-50%);
}

.sidebar-toggle--left {
  right: 0.75rem;
}

.sidebar-toggle--right {
  left: 0.75rem;
}

.sidebar-region {
  height: 100%;
  width: 100%;
  padding: 0.75rem;
}

.sidebar-region--secondary {
  color: oklch(var(--sc) / 1);
}

.sidebar-region--accent {
  color: oklch(var(--ac) / 1);
}

.sidebar-shell {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  border-width: 2px;
  border-style: solid;
  border-radius: 1.75rem;
  background: oklch(var(--b1) / 0.92);
  box-shadow:
    0 12px 30px oklch(0 0 0 / 0.16),
    inset 0 1px 0 oklch(1 0 0 / 0.18);
  backdrop-filter: blur(10px);
}

.sidebar-region--secondary .sidebar-shell {
  border-color: oklch(var(--sf) / 0.9);
}

.sidebar-region--accent .sidebar-shell {
  border-color: oklch(var(--af) / 0.9);
}

.sidebar-scroll {
  position: relative;
  z-index: 10;
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

.sidebar-scroll__content {
  display: flex;
  min-height: 100%;
  width: 100%;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.scroll-button {
  position: absolute;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid oklch(var(--b3) / 0.9);
  border-radius: 9999px;
  background: oklch(var(--b2) / 0.86);
  color: oklch(var(--bc) / 0.82);
  box-shadow: 0 1px 6px oklch(0 0 0 / 0.12);
  backdrop-filter: blur(8px);
  padding: 0.35rem;
  transition:
    background 0.15s ease,
    transform 0.15s ease,
    color 0.15s ease;
}

.scroll-button:hover {
  background: oklch(var(--b3) / 0.96);
  color: oklch(var(--bc) / 1);
  transform: scale(1.04);
}

.scroll-button--top {
  top: 0.75rem;
}

.scroll-button--bottom {
  bottom: 0.75rem;
}

.sidebar-region--secondary .scroll-button {
  left: 0.5rem;
  right: auto;
}

.sidebar-region--accent .scroll-button {
  right: 0.5rem;
  left: auto;
}

.smart-scroll-container {
  scrollbar-width: none;
}

.smart-scroll-container::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
