<!-- /layouts/default.vue -->
<template>
  <div class="fixed inset-0 overflow-hidden bg-base-300 text-base-content">
    <header
      class="fixed overflow-hidden border-b-2 border-primary-focus bg-primary text-primary-content transition-[height,width,left,top] duration-200"
      :style="headerStyle"
    >
      <slot name="header">
        <full-header />
      </slot>

      <div
        v-if="headerState !== 'hidden'"
        class="pointer-events-none fixed z-[220]"
        :style="headerToggleStyle"
      >
        <div class="pointer-events-auto flex items-start gap-2">
          <button
            class="icon-btn icon-btn--pill icon-btn--primary"
            :class="{ 'icon-btn--dim': headerState === 'hidden' }"
            :title="`Header: ${headerModeLabel}`"
            @click="toggleHeader"
          >
            <Icon
              :name="headerIcon"
              class="icon-btn__icon"
            />
            <span class="icon-btn__label">{{ headerModeLabel }}</span>
          </button>
        </div>
      </div>
    </header>

    <ClientOnly>
      <aside
        class="fixed overflow-hidden border-r-2 border-secondary-focus bg-secondary text-secondary-content transition-[top,height,width,left] duration-200"
        :style="leftSidebarStyle"
      >
        <div class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <slot name="left">
            <left-sidebar />
          </slot>
        </div>

        <div
          v-if="sidebarLeftState !== 'hidden'"
          class="pointer-events-none fixed z-[220]"
          :style="leftToggleStyle"
        >
          <div class="pointer-events-auto flex flex-col items-start gap-2">
            <button
              class="icon-btn icon-btn--tab icon-btn--secondary"
              :class="{ 'icon-btn--dim': sidebarLeftState === 'hidden' }"
              :title="`Left sidebar: ${leftSidebarModeLabel}`"
              @click="toggleLeftSidebar"
            >
              <Icon
                :name="leftSidebarIcon"
                class="icon-btn__icon icon-btn__icon--mirror"
              />
              <span class="icon-btn__label icon-btn__label--vertical">
                {{ leftSidebarModeLabel }}
              </span>
            </button>

            <div class="flex flex-col gap-1">
              <button
                class="icon-btn icon-btn--mini icon-btn--secondary"
                :class="{ 'icon-btn--active': sidebarLeftHeaderPriority }"
                title="Left sidebar header priority"
                @click="toggleSidebarLeftHeaderPriority"
              >
                <Icon
                  :name="sidebarLeftHeaderPriority ? 'kind-icon:compress' : 'kind-icon:expand'"
                  class="icon-btn__icon icon-btn__icon--flip-v"
                />
              </button>

              <button
                class="icon-btn icon-btn--mini icon-btn--secondary"
                :class="{ 'icon-btn--active': sidebarLeftFooterPriority }"
                title="Left sidebar footer priority"
                @click="toggleSidebarLeftFooterPriority"
              >
                <Icon
                  :name="sidebarLeftFooterPriority ? 'kind-icon:compress' : 'kind-icon:expand'"
                  class="icon-btn__icon"
                />
              </button>
            </div>
          </div>
        </div>
      </aside>
      <template #fallback />
    </ClientOnly>

    <ClientOnly>
      <aside
        class="fixed overflow-hidden border-l-2 border-accent-focus bg-accent text-accent-content transition-[top,height,width,right] duration-200"
        :style="rightSidebarStyle"
      >
        <div class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <slot name="right">
            <right-sidebar />
          </slot>
        </div>

        <div
          v-if="sidebarRightState !== 'hidden'"
          class="pointer-events-none fixed z-[220]"
          :style="rightToggleStyle"
        >
          <div class="pointer-events-auto flex flex-col items-end gap-2">
            <button
              class="icon-btn icon-btn--tab icon-btn--accent"
              :class="{ 'icon-btn--dim': sidebarRightState === 'hidden' }"
              :title="`Right sidebar: ${rightSidebarModeLabel}`"
              @click="toggleRightSidebar"
            >
              <Icon
                :name="rightSidebarIcon"
                class="icon-btn__icon"
              />
              <span class="icon-btn__label icon-btn__label--vertical">
                {{ rightSidebarModeLabel }}
              </span>
            </button>

            <div class="flex flex-col gap-1">
              <button
                class="icon-btn icon-btn--mini icon-btn--accent"
                :class="{ 'icon-btn--active': sidebarRightHeaderPriority }"
                title="Right sidebar header priority"
                @click="toggleSidebarRightHeaderPriority"
              >
                <Icon
                  :name="sidebarRightHeaderPriority ? 'kind-icon:compress' : 'kind-icon:expand'"
                  class="icon-btn__icon icon-btn__icon--flip-v"
                />
              </button>

              <button
                class="icon-btn icon-btn--mini icon-btn--accent"
                :class="{ 'icon-btn--active': sidebarRightFooterPriority }"
                title="Right sidebar footer priority"
                @click="toggleSidebarRightFooterPriority"
              >
                <Icon
                  :name="sidebarRightFooterPriority ? 'kind-icon:compress' : 'kind-icon:expand'"
                  class="icon-btn__icon"
                />
              </button>
            </div>
          </div>
        </div>
      </aside>
      <template #fallback />
    </ClientOnly>

    <main
      class="fixed overflow-hidden border border-base-300 bg-base-100 text-base-content transition-[top,left,width,height] duration-200"
      :style="mainContentStyle"
    >
      <div class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4">
        <slot />
      </div>
    </main>

    <footer
      class="fixed overflow-hidden border-t-2 border-base-content/20 bg-base-200 text-base-content transition-[height,width,left,bottom] duration-200"
      :style="footerStyle"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="footer">
          <main-footer />
        </slot>
      </div>

      <div
        v-if="footerState !== 'hidden'"
        class="pointer-events-none fixed z-[220]"
        :style="footerToggleStyle"
      >
        <div class="pointer-events-auto flex justify-center">
          <button
            class="icon-btn icon-btn--pill icon-btn--base"
            :class="{ 'icon-btn--dim': footerState === 'hidden' }"
            :title="`Footer: ${footerModeLabel}`"
            @click="toggleFooter"
          >
            <Icon
              :name="footerIcon"
              class="icon-btn__icon"
            />
            <span class="icon-btn__label">{{ footerModeLabel }}</span>
          </button>
        </div>
      </div>
    </footer>

    <div
      class="pointer-events-none fixed z-[230]"
      :style="headerGhostToggleStyle"
    >
      <button
        v-if="headerState === 'hidden'"
        class="icon-btn icon-btn--pill icon-btn--primary"
        style="pointer-events: auto"
        title="Show header"
        @click="toggleHeader"
      >
        <Icon name="kind-icon:chevron-double-down" class="icon-btn__icon" />
        <span class="icon-btn__label">header</span>
      </button>
    </div>

    <div
      class="pointer-events-none fixed z-[230]"
      :style="footerGhostToggleStyle"
    >
      <button
        v-if="footerState === 'hidden'"
        class="icon-btn icon-btn--pill icon-btn--base"
        style="pointer-events: auto"
        title="Show footer"
        @click="toggleFooter"
      >
        <Icon name="kind-icon:chevron-double-up" class="icon-btn__icon" />
        <span class="icon-btn__label">footer</span>
      </button>
    </div>

    <div
      class="pointer-events-none fixed z-[230]"
      :style="leftGhostToggleStyle"
    >
      <button
        v-if="sidebarLeftState === 'hidden'"
        class="icon-btn icon-btn--tab icon-btn--secondary"
        style="pointer-events: auto"
        title="Show left sidebar"
        @click="toggleLeftSidebar"
      >
        <Icon name="kind-icon:panel-right" class="icon-btn__icon icon-btn__icon--mirror" />
        <span class="icon-btn__label icon-btn__label--vertical">left</span>
      </button>
    </div>

    <div
      class="pointer-events-none fixed z-[230]"
      :style="rightGhostToggleStyle"
    >
      <button
        v-if="sidebarRightState === 'hidden'"
        class="icon-btn icon-btn--tab icon-btn--accent"
        style="pointer-events: auto"
        title="Show right sidebar"
        @click="toggleRightSidebar"
      >
        <Icon name="kind-icon:panel-right-close" class="icon-btn__icon" />
        <span class="icon-btn__label icon-btn__label--vertical">right</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  type CSSProperties,
} from 'vue'

type DisplayState = 'hidden' | 'compact' | 'open' | 'full'
type ViewportSize = 'mobile' | 'tablet' | 'desktop'

const HEADER_FOOTER_CYCLE: DisplayState[] = ['hidden', 'compact', 'open', 'full']
const SIDEBAR_CYCLE: DisplayState[] = ['hidden', 'compact', 'open', 'full']

const headerState = ref<DisplayState>('open')
const footerState = ref<DisplayState>('compact')
const sidebarLeftState = ref<DisplayState>('open')
const sidebarRightState = ref<DisplayState>('open')

const sidebarLeftHeaderPriority = ref(false)
const sidebarLeftFooterPriority = ref(false)
const sidebarRightHeaderPriority = ref(false)
const sidebarRightFooterPriority = ref(false)

const viewportSize = ref<ViewportSize>('desktop')
const bigMode = ref(false)
const resizeTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

function setCustomVh() {
  if (typeof window === 'undefined') return
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

function updateViewport() {
  if (typeof window === 'undefined') return

  if (resizeTimeout.value) clearTimeout(resizeTimeout.value)

  resizeTimeout.value = setTimeout(() => {
    setCustomVh()
    const width = window.innerWidth

    if (width < 768) viewportSize.value = 'mobile'
    else if (width < 1024) viewportSize.value = 'tablet'
    else viewportSize.value = 'desktop'

    resizeTimeout.value = null
  }, 100)
}

onMounted(() => {
  setCustomVh()
  updateViewport()
  window.addEventListener('resize', updateViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
  if (resizeTimeout.value) clearTimeout(resizeTimeout.value)
})

function nextState(current: DisplayState, cycle: DisplayState[]): DisplayState {
  const index = cycle.indexOf(current)
  if (index === -1) return cycle[0] ?? 'open'
  return cycle[(index + 1) % cycle.length] ?? cycle[0] ?? 'open'
}

function toggleHeader() {
  headerState.value = nextState(headerState.value, HEADER_FOOTER_CYCLE)
}

function toggleFooter() {
  footerState.value = nextState(footerState.value, HEADER_FOOTER_CYCLE)
}

function toggleLeftSidebar() {
  sidebarLeftState.value = nextState(sidebarLeftState.value, SIDEBAR_CYCLE)
}

function toggleRightSidebar() {
  sidebarRightState.value = nextState(sidebarRightState.value, SIDEBAR_CYCLE)
}

function toggleSidebarLeftHeaderPriority() {
  sidebarLeftHeaderPriority.value = !sidebarLeftHeaderPriority.value
}

function toggleSidebarLeftFooterPriority() {
  sidebarLeftFooterPriority.value = !sidebarLeftFooterPriority.value
}

function toggleSidebarRightHeaderPriority() {
  sidebarRightHeaderPriority.value = !sidebarRightHeaderPriority.value
}

function toggleSidebarRightFooterPriority() {
  sidebarRightFooterPriority.value = !sidebarRightFooterPriority.value
}

const vh = (n: number) => `calc(var(--vh, 1vh) * ${n})`

const sectionPaddingSize = computed((): number => {
  const sizes: Record<ViewportSize, number> = {
    mobile: 1,
    tablet: 1,
    desktop: 1,
  }
  return sizes[viewportSize.value]
})

const toggleInset = computed((): string => {
  if (viewportSize.value === 'mobile') return '0.35rem'
  if (viewportSize.value === 'tablet') return '0.45rem'
  return '0.5rem'
})

const headerHeight = computed((): number => {
  const p = sectionPaddingSize.value

  switch (headerState.value) {
    case 'hidden':
      return p
    case 'compact':
      return viewportSize.value === 'mobile' ? 5 : 4
    case 'full': {
      const sizes: Record<ViewportSize, number> = {
        mobile: 35,
        tablet: 28,
        desktop: 25,
      }
      return sizes[viewportSize.value]
    }
    default: {
      const sizes: Record<ViewportSize, number> = {
        mobile: bigMode.value ? 6 : 14,
        tablet: bigMode.value ? 12 : 13,
        desktop: bigMode.value ? 8 : 13,
      }
      return sizes[viewportSize.value]
    }
  }
})

const footerHeights: Record<DisplayState, Record<ViewportSize, number>> = {
  hidden: { mobile: 1, tablet: 1, desktop: 1 },
  compact: { mobile: 6, tablet: 4, desktop: 4 },
  open: { mobile: 45, tablet: 25, desktop: 25 },
  full: { mobile: 55, tablet: 40, desktop: 40 },
}

const footerHeight = computed((): number => {
  const p = sectionPaddingSize.value
  if (footerState.value === 'hidden') return p
  return footerHeights[footerState.value]?.[viewportSize.value] ?? p
})

const sidebarLeftWidth = computed((): number => {
  const p = sectionPaddingSize.value

  switch (sidebarLeftState.value) {
    case 'hidden':
      return p
    case 'compact': {
      const sizes: Record<ViewportSize, number> = {
        mobile: 14,
        tablet: 8,
        desktop: 6,
      }
      return sizes[viewportSize.value]
    }
    case 'full': {
      const sizes: Record<ViewportSize, number> = {
        mobile: 60,
        tablet: 28,
        desktop: 22,
      }
      return sizes[viewportSize.value]
    }
    default: {
      const sizes: Record<ViewportSize, number> = {
        mobile: 40,
        tablet: 20,
        desktop: 15,
      }
      return sizes[viewportSize.value]
    }
  }
})

const sidebarRightWidth = computed((): number => {
  const p = sectionPaddingSize.value

  switch (sidebarRightState.value) {
    case 'hidden':
      return p
    case 'compact': {
      const sizes: Record<ViewportSize, number> = {
        mobile: 18,
        tablet: 12,
        desktop: 8,
      }
      return sizes[viewportSize.value]
    }
    case 'full': {
      const sizes: Record<ViewportSize, number> = {
        mobile: 100,
        tablet: 50,
        desktop: 36,
      }
      return sizes[viewportSize.value]
    }
    default: {
      const sizes: Record<ViewportSize, number> = {
        mobile: 90,
        tablet: 35,
        desktop: 25,
      }
      return sizes[viewportSize.value]
    }
  }
})

const headerLeftOffset = computed((): number =>
  sidebarLeftHeaderPriority.value ? 0 : sidebarLeftWidth.value,
)

const headerRightOffset = computed((): number =>
  sidebarRightHeaderPriority.value ? 0 : sidebarRightWidth.value,
)

const headerWidth = computed((): number =>
  Math.max(0, 100 - headerLeftOffset.value - headerRightOffset.value),
)

const footerLeftOffset = computed((): number =>
  sidebarLeftFooterPriority.value ? 0 : sidebarLeftWidth.value,
)

const footerRightOffset = computed((): number =>
  sidebarRightFooterPriority.value ? 0 : sidebarRightWidth.value,
)

const footerWidth = computed((): number =>
  Math.max(0, 100 - footerLeftOffset.value - footerRightOffset.value),
)

function sidebarVh(
  sizeState: DisplayState,
  headerPriority: boolean,
  footerPriority: boolean,
): { top: number; height: number } {
  if (sizeState === 'full') return { top: 0, height: 100 }

  const p = sectionPaddingSize.value
  const hh = headerHeight.value
  const fh = footerHeight.value
  const topEdge = headerPriority ? 0 : hh + p
  const bottomEdge = footerPriority ? 0 : fh + p

  return {
    top: topEdge,
    height: Math.max(p, 100 - topEdge - bottomEdge),
  }
}

function sidebarZ(sizeState: DisplayState, hp: boolean, fp: boolean): number {
  if (sizeState === 'full') return 50
  if (hp || fp) return 40
  return 20
}

const centerTopOffset = computed((): number => headerHeight.value + sectionPaddingSize.value)
const centerBottomOffset = computed((): number => footerHeight.value + sectionPaddingSize.value)
const centerLeftOffset = computed((): number => sidebarLeftWidth.value + sectionPaddingSize.value)
const centerRightOffset = computed((): number => sidebarRightWidth.value + sectionPaddingSize.value)

const mainContentHeight = computed((): number =>
  Math.max(sectionPaddingSize.value, 100 - centerTopOffset.value - centerBottomOffset.value),
)

const mainContentWidth = computed((): number =>
  Math.max(10, 100 - centerLeftOffset.value - centerRightOffset.value),
)

const headerStyle = computed<CSSProperties>(() => ({
  position: 'fixed',
  top: '0',
  left: `${headerLeftOffset.value}vw`,
  width: `${headerWidth.value}vw`,
  height: vh(headerHeight.value),
  zIndex: '30',
}))

const footerStyle = computed<CSSProperties>(() => ({
  position: 'fixed',
  bottom: '0',
  left: `${footerLeftOffset.value}vw`,
  width: `${footerWidth.value}vw`,
  height: vh(footerHeight.value),
  zIndex: '30',
}))

const leftSidebarStyle = computed<CSSProperties>(() => {
  const { top, height } = sidebarVh(
    sidebarLeftState.value,
    sidebarLeftHeaderPriority.value,
    sidebarLeftFooterPriority.value,
  )

  return {
    position: 'fixed',
    left: '0',
    top: vh(top),
    width: `${sidebarLeftWidth.value}vw`,
    height: vh(height),
    zIndex: String(
      sidebarZ(
        sidebarLeftState.value,
        sidebarLeftHeaderPriority.value,
        sidebarLeftFooterPriority.value,
      ),
    ),
  }
})

const rightSidebarStyle = computed<CSSProperties>(() => {
  const { top, height } = sidebarVh(
    sidebarRightState.value,
    sidebarRightHeaderPriority.value,
    sidebarRightFooterPriority.value,
  )

  return {
    position: 'fixed',
    right: '0',
    top: vh(top),
    width: `${sidebarRightWidth.value}vw`,
    height: vh(height),
    zIndex: String(
      sidebarZ(
        sidebarRightState.value,
        sidebarRightHeaderPriority.value,
        sidebarRightFooterPriority.value,
      ),
    ),
  }
})

const mainContentStyle = computed<CSSProperties>(() => ({
  position: 'fixed',
  top: vh(centerTopOffset.value),
  left: `${centerLeftOffset.value}vw`,
  width: `${mainContentWidth.value}vw`,
  height: vh(mainContentHeight.value),
  zIndex: '10',
}))

const headerModeLabel = computed(() => {
  const labels: Record<DisplayState, string> = {
    hidden: 'Hidden',
    compact: 'Compact',
    open: 'Open',
    full: 'Full',
  }
  return labels[headerState.value]
})

const footerModeLabel = computed(() => {
  const labels: Record<DisplayState, string> = {
    hidden: 'Hidden',
    compact: 'Compact',
    open: 'Open',
    full: 'Full',
  }
  return labels[footerState.value]
})

const leftSidebarModeLabel = computed(() => {
  const labels: Record<DisplayState, string> = {
    hidden: 'Hidden',
    compact: 'Compact',
    open: 'Open',
    full: 'Full',
  }
  return labels[sidebarLeftState.value]
})

const rightSidebarModeLabel = computed(() => {
  const labels: Record<DisplayState, string> = {
    hidden: 'Hidden',
    compact: 'Compact',
    open: 'Open',
    full: 'Full',
  }
  return labels[sidebarRightState.value]
})

const headerIcon = computed(() => {
  if (headerState.value === 'hidden') return 'kind-icon:chevron-double-down'
  if (headerState.value === 'compact') return 'kind-icon:chevron-double-down'
  return 'kind-icon:chevron-up'
})

const footerIcon = computed(() => {
  if (footerState.value === 'hidden') return 'kind-icon:chevron-double-up'
  if (footerState.value === 'compact') return 'kind-icon:chevron-double-up'
  return 'kind-icon:chevron-down'
})

const leftSidebarIcon = computed(() => {
  if (sidebarLeftState.value === 'hidden') return 'kind-icon:panel-right'
  if (sidebarLeftState.value === 'compact') return 'kind-icon:panel-right'
  return 'kind-icon:panel-right-close'
})

const rightSidebarIcon = computed(() => {
  if (sidebarRightState.value === 'hidden') return 'kind-icon:panel-right-close'
  if (sidebarRightState.value === 'compact') return 'kind-icon:panel-right-close'
  return 'kind-icon:panel-right'
})

const headerToggleStyle = computed<CSSProperties>(() => {
  const rightOffset =
    sidebarRightHeaderPriority.value && sidebarRightState.value !== 'hidden'
      ? `calc(${sidebarRightWidth.value}vw + ${toggleInset.value})`
      : toggleInset.value

  return {
    top: toggleInset.value,
    right: rightOffset,
  }
})

const leftToggleStyle = computed<CSSProperties>(() => {
  const { top } = sidebarVh(
    sidebarLeftState.value,
    sidebarLeftHeaderPriority.value,
    sidebarLeftFooterPriority.value,
  )

  return {
    top: `calc(${vh(top)} + ${toggleInset.value})`,
    left: toggleInset.value,
  }
})

const rightToggleStyle = computed<CSSProperties>(() => {
  const { top } = sidebarVh(
    sidebarRightState.value,
    sidebarRightHeaderPriority.value,
    sidebarRightFooterPriority.value,
  )

  return {
    top: `calc(${vh(top)} + ${toggleInset.value})`,
    right: toggleInset.value,
  }
})

const footerToggleStyle = computed<CSSProperties>(() => ({
  top: `calc(${vh(100 - footerHeight.value)} + ${toggleInset.value})`,
  left: '50%',
  transform: 'translateX(-50%)',
}))

const headerGhostToggleStyle = computed<CSSProperties>(() => {
  const rightShift =
    sidebarRightHeaderPriority.value && sidebarRightState.value !== 'hidden'
      ? `calc(${sidebarRightWidth.value}vw + ${toggleInset.value})`
      : toggleInset.value

  return {
    top: toggleInset.value,
    right: rightShift,
  }
})

const footerGhostToggleStyle = computed<CSSProperties>(() => ({
  left: '50%',
  bottom: toggleInset.value,
  transform: 'translateX(-50%)',
}))

const leftGhostToggleStyle = computed<CSSProperties>(() => ({
  top: `calc(${vh(centerTopOffset.value)} + ${toggleInset.value})`,
  left: toggleInset.value,
}))

const rightGhostToggleStyle = computed<CSSProperties>(() => ({
  top: `calc(${vh(centerTopOffset.value)} + ${toggleInset.value})`,
  right: toggleInset.value,
}))
</script>

<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  border-width: 1px;
  border-style: solid;
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s,
    border-color 0.15s,
    color 0.15s,
    transform 0.15s;
  box-shadow: 0 1px 6px oklch(0 0 0 / 0.18);
}

.icon-btn:hover {
  transform: scale(1.03);
}

.icon-btn--pill {
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
}

.icon-btn--tab {
  flex-direction: column;
  width: 2rem;
  gap: 0.3rem;
  padding: 0.6rem 0.35rem;
  border-radius: 0.75rem;
}

.icon-btn--mini {
  width: 1.7rem;
  height: 1.7rem;
  padding: 0.2rem;
  border-radius: 0.5rem;
}

.icon-btn--primary {
  background: oklch(var(--p) / 0.95);
  border-color: oklch(var(--pf) / 0.9);
  color: oklch(var(--pc) / 1);
}

.icon-btn--primary:hover {
  background: oklch(var(--pf) / 1);
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

.icon-btn--active {
  outline: 2px solid oklch(var(--wa) / 0.95);
  outline-offset: 1px;
}

.icon-btn--dim {
  opacity: 0.45;
}

.icon-btn--dim:hover {
  opacity: 1;
}

.icon-btn__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  opacity: 0.9;
}

.icon-btn__icon--mirror {
  transform: scaleX(-1);
}

.icon-btn__icon--flip-v {
  transform: scaleY(-1);
}

.icon-btn__label {
  white-space: nowrap;
  font-size: 0.52rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
}

.icon-btn__label--vertical {
  writing-mode: vertical-lr;
  letter-spacing: 0.06em;
}
</style>