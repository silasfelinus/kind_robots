<!-- /components/content/utils/screen-debug.vue -->
<template>
  <div
    v-if="isAdmin"
    class="pointer-events-auto fixed right-3 top-3 z-[10000] flex items-center gap-2 rounded-2xl border border-base-300 bg-base-100/90 p-2 text-base-content shadow-xl backdrop-blur"
  >
    <button
      class="btn btn-sm rounded-2xl border border-primary/40 bg-primary/15 text-primary hover:bg-primary hover:text-primary-content"
      @click="toggleDebug"
    >
      <Icon
        :name="isDebugVisible ? 'kind-icon:close' : 'kind-icon:debug'"
        class="h-4 w-4"
      />
      <span class="hidden sm:inline">
        {{ isDebugVisible ? 'Hide debug' : 'Screen debug' }}
      </span>
    </button>
  </div>

  <Teleport to="body">
    <div
      v-if="isDebugVisible"
      class="pointer-events-none fixed inset-0 z-[9999] overflow-hidden bg-black/35 font-mono text-[0.65rem] text-white backdrop-blur-[1px]"
    >
      <div class="screen-debug-grid absolute inset-0" />

      <div
        :style="viewportLabelStyle"
        class="absolute rounded-2xl border border-white/30 bg-black/60 px-3 py-2 shadow-xl"
      >
        <div class="text-xs font-bold text-white">Viewport</div>
        <div>{{ viewportWidth }}px × {{ viewportHeight }}px</div>
        <div>
          {{ displayStore.viewportSize }} · {{ displayStore.navDock }} dock
        </div>
        <div>--vh {{ vhValue }}</div>
      </div>

      <div
        v-if="displayStore.headerContentVisible"
        :style="displayStore.headerStyle"
        class="screen-debug-region border-info bg-info/20 text-info-content"
      >
        <div class="screen-debug-label bg-info text-info-content">Header</div>
        <div class="screen-debug-copy">
          {{ displayStore.headerState }} · {{ displayStore.headerHeight }}vh ·
          {{ displayStore.headerDockedTop ? 'top' : 'bottom' }}
        </div>
      </div>

      <div
        v-if="displayStore.channelPanelVisible"
        :style="displayStore.channelPanelStyle"
        class="screen-debug-region border-secondary bg-secondary/20 text-secondary-content"
      >
        <div class="screen-debug-label bg-secondary text-secondary-content">
          Channel Panel
        </div>
        <div class="screen-debug-copy">
          {{ displayStore.channelPanelHeight }}vh · bottom dock fallback
        </div>
      </div>

      <div
        v-if="displayStore.sidebarLeftVisible"
        :style="displayStore.leftSidebarStyle"
        class="screen-debug-region border-cyan-300 bg-cyan-300/20 text-cyan-50"
      >
        <div class="screen-debug-label bg-cyan-400 text-cyan-950">
          Left Sidebar
        </div>
        <div class="screen-debug-copy">
          {{ displayStore.leftSidebarModeLabel }} ·
          {{ displayStore.sidebarLeftWidth }}vw ×
          {{ displayStore.sidebarContentHeight }}vh
        </div>
      </div>

      <div
        v-else
        :style="leftSidebarGhostStyle"
        class="screen-debug-ghost border-cyan-300/60 text-cyan-100"
      >
        Left hidden
      </div>

      <div
        v-if="displayStore.sidebarRightVisible"
        :style="displayStore.rightSidebarStyle"
        class="screen-debug-region border-pink-300 bg-pink-300/20 text-pink-50"
      >
        <div class="screen-debug-label bg-pink-400 text-pink-950">
          Right Sidebar
        </div>
        <div class="screen-debug-copy">
          {{ displayStore.rightSidebarModeLabel }} ·
          {{ displayStore.sidebarRightWidth }}vw ×
          {{ displayStore.sidebarContentHeight }}vh
        </div>
      </div>

      <div
        v-else
        :style="rightSidebarGhostStyle"
        class="screen-debug-ghost border-pink-300/60 text-pink-100"
      >
        Right hidden
      </div>

      <div
        :style="displayStore.mainContentStyle"
        class="screen-debug-region border-warning bg-warning/20 text-warning-content"
      >
        <div class="screen-debug-label bg-warning text-warning-content">
          Center Panel
        </div>
        <div class="screen-debug-copy">
          top
          {{ displayStore.topDockHeight + displayStore.sectionPaddingSize }}vh ·
          left {{ displayStore.mainContentLeft }}vw · width
          {{ displayStore.mainContentWidth }}vw · height
          {{ displayStore.mainPanelHeight }}vh
        </div>
      </div>

      <div
        v-if="displayStore.bottomDockHeight > 0"
        :style="bottomDockDebugStyle"
        class="screen-debug-region border-accent bg-accent/15 text-accent-content"
      >
        <div class="screen-debug-label bg-accent text-accent-content">
          Bottom Dock Boundary
        </div>
        <div class="screen-debug-copy">
          total {{ displayStore.bottomDockHeight }}vh · header
          {{ displayStore.bottomHeaderDockHeight }}vh · channel
          {{ displayStore.channelPanelHeight }}vh · footer
          {{ displayStore.footerPanelHeight }}vh
        </div>
      </div>

      <div
        v-if="displayStore.footerContentVisible"
        :style="footerPanelDebugStyle"
        class="screen-debug-region border-emerald-300 bg-emerald-300/20 text-emerald-50"
      >
        <div class="screen-debug-label bg-emerald-400 text-emerald-950">
          Footer Panel
        </div>
        <div class="screen-debug-copy">
          {{ displayStore.footerState }} · height
          {{ displayStore.footerPanelHeight }}vh · component
          {{ displayStore.footerComponent }}
        </div>
      </div>

      <div
        :style="topDockGuideStyle"
        class="screen-debug-guide border-blue-300/80 text-blue-100"
      >
        topDock {{ displayStore.topDockHeight }}vh
      </div>

      <div
        :style="bottomDockGuideStyle"
        class="screen-debug-guide border-orange-300/80 text-orange-100"
      >
        bottomDock {{ displayStore.bottomDockHeight }}vh
      </div>

      <div
        class="pointer-events-auto fixed bottom-3 left-3 max-h-[42vh] w-[calc(100vw-1.5rem)] max-w-4xl overflow-y-auto rounded-2xl border border-base-300 bg-base-100/95 p-4 text-base-content shadow-2xl backdrop-blur sm:w-[42rem]"
      >
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-base font-bold text-primary">
              🧪 Screen Boundary Debug
            </h2>
            <p class="text-xs text-base-content/70">
              Live overlay for dock, sidebar, center, footer, and viewport math.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              class="btn btn-xs rounded-2xl border border-base-300 bg-base-200"
              @click="refreshViewport"
            >
              Refresh
            </button>
            <button
              class="btn btn-xs rounded-2xl border border-error/40 bg-error/15 text-error"
              @click="toggleDebug"
            >
              Close
            </button>
          </div>
        </div>

        <div
          class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-4"
        >
          <div class="screen-debug-stat">
            <strong>Header</strong>
            <span>{{ displayStore.headerState }}</span>
            <span>{{ displayStore.headerHeight }}vh</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Nav Dock</strong>
            <span>{{ displayStore.navDock }}</span>
            <span>top {{ displayStore.topDockHeight }}vh</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Bottom Dock</strong>
            <span>{{ displayStore.bottomDockHeight }}vh</span>
            <span>offset {{ contentBottomOffset }}vh</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Footer</strong>
            <span>{{ displayStore.footerState }}</span>
            <span>{{ displayStore.footerPanelHeight }}vh</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Left</strong>
            <span>{{ displayStore.leftSidebarModeLabel }}</span>
            <span>{{ displayStore.sidebarLeftWidth }}vw</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Right</strong>
            <span>{{ displayStore.rightSidebarModeLabel }}</span>
            <span>{{ displayStore.sidebarRightWidth }}vw</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Center</strong>
            <span>{{ displayStore.mainContentWidth }}vw</span>
            <span>{{ displayStore.mainPanelHeight }}vh</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Padding</strong>
            <span>{{ displayStore.sectionPaddingSize }}vh/vw</span>
            <span>{{ displayStore.viewportSize }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Sections</strong>
            <span>L {{ bool(displayStore.showLeft) }}</span>
            <span
              >C {{ bool(displayStore.showCenter) }} · R
              {{ bool(displayStore.showRight) }}</span
            >
          </div>

          <div class="screen-debug-stat">
            <strong>Extended</strong>
            <span>{{ bool(displayStore.showExtended) }}</span>
            <span>corner {{ bool(displayStore.showCornerPanel) }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Fullscreen</strong>
            <span>{{ displayStore.fullscreenState }}</span>
            <span>{{ bool(displayStore.isFullScreen) }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Touch</strong>
            <span>{{ bool(displayStore.isTouchDevice) }}</span>
            <span>{{ viewportWidth }}×{{ viewportHeight }}</span>
          </div>
        </div>

        <details
          class="mt-3 rounded-2xl border border-base-300 bg-base-200 p-3"
        >
          <summary class="cursor-pointer text-sm font-bold text-primary">
            Raw boundary styles
          </summary>

          <pre
            class="mt-3 whitespace-pre-wrap text-[0.65rem] leading-relaxed text-base-content/80"
          >
headerStyle:        {{ fmt(displayStore.headerStyle) }}
channelPanelStyle:  {{ fmt(displayStore.channelPanelStyle) }}
leftSidebarStyle:   {{ fmt(displayStore.leftSidebarStyle) }}
rightSidebarStyle:  {{ fmt(displayStore.rightSidebarStyle) }}
mainContentStyle:   {{ fmt(displayStore.mainContentStyle) }}
bottomDockStyle:    {{ fmt(bottomDockDebugStyle) }}
footerPanelStyle:   {{ fmt(footerPanelDebugStyle) }}
leftToggleStyle:    {{ fmt(displayStore.leftToggleStyle) }}
rightToggleStyle:   {{ fmt(displayStore.rightToggleStyle) }}
headerToggleStyle:  {{ fmt(displayStore.headerToggleStyle) }}
          </pre>
        </details>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// /components/content/utils/screen-debug.vue
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  type CSSProperties,
} from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'

const displayStore = useDisplayStore()
const userStore = useUserStore()

const isDebugVisible = ref(false)
const viewportWidth = ref(0)
const viewportHeight = ref(0)
const vhValue = ref('unset')

const isAdmin = computed(() => userStore.isAdmin === true)

const contentBottomOffset = computed(() => {
  return displayStore.bottomDockHeight + displayStore.sectionPaddingSize
})

const viewportLabelStyle = computed<CSSProperties>(() => ({
  top: '0.75rem',
  left: '0.75rem',
  zIndex: '10002',
}))

const bottomDockDebugStyle = computed<CSSProperties>(() => ({
  position: 'fixed',
  left: `${displayStore.footerLeftInset}vw`,
  bottom: `calc(var(--vh) * ${displayStore.sectionPaddingSize})`,
  width: `${displayStore.footerWidth}vw`,
  height: `calc(var(--vh) * ${displayStore.bottomDockHeight})`,
  zIndex: '9998',
}))

const footerPanelDebugStyle = computed<CSSProperties>(() => {
  const bottomOffset =
    displayStore.sectionPaddingSize +
    displayStore.bottomHeaderDockHeight +
    displayStore.channelPanelHeight

  return {
    position: 'fixed',
    left: `${displayStore.footerLeftInset}vw`,
    bottom: `calc(var(--vh) * ${bottomOffset})`,
    width: `${displayStore.footerWidth}vw`,
    height: `calc(var(--vh) * ${displayStore.footerPanelHeight})`,
    zIndex: '9999',
  }
})

const leftSidebarGhostStyle = computed<CSSProperties>(() => ({
  position: 'fixed',
  top: displayStore.leftSidebarStyle.top,
  left: `${displayStore.sectionPaddingSize}vw`,
  width: '0px',
  height: `calc(var(--vh) * ${displayStore.sidebarContentHeight})`,
  zIndex: '9999',
}))

const rightSidebarGhostStyle = computed<CSSProperties>(() => ({
  position: 'fixed',
  top: displayStore.rightSidebarStyle.top,
  right: `${displayStore.sectionPaddingSize}vw`,
  width: '0px',
  height: `calc(var(--vh) * ${displayStore.sidebarContentHeight})`,
  zIndex: '9999',
}))

const topDockGuideStyle = computed<CSSProperties>(() => ({
  position: 'fixed',
  top: `calc(var(--vh) * ${displayStore.topDockHeight})`,
  left: '0px',
  width: '100vw',
  height: '0px',
  zIndex: '10000',
}))

const bottomDockGuideStyle = computed<CSSProperties>(() => ({
  position: 'fixed',
  bottom: `calc(var(--vh) * ${displayStore.bottomDockHeight + displayStore.sectionPaddingSize})`,
  left: '0px',
  width: '100vw',
  height: '0px',
  zIndex: '10000',
}))

function toggleDebug() {
  isDebugVisible.value = !isDebugVisible.value
  refreshViewport()
}

function refreshViewport() {
  if (typeof window === 'undefined') return

  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
  vhValue.value =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--vh')
      .trim() || 'unset'

  displayStore.applyViewportSize()
}

function bool(value: boolean) {
  return value ? 'on' : 'off'
}

function fmt(style: CSSProperties): string {
  return Object.entries(style)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ')
}

onMounted(() => {
  displayStore.initialize()
  refreshViewport()

  window.addEventListener('resize', refreshViewport)
  window.addEventListener('orientationchange', refreshViewport)
  window.visualViewport?.addEventListener('resize', refreshViewport)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return

  window.removeEventListener('resize', refreshViewport)
  window.removeEventListener('orientationchange', refreshViewport)
  window.visualViewport?.removeEventListener('resize', refreshViewport)
})
</script>

<style scoped>
.screen-debug-grid {
  background-image:
    linear-gradient(to right, rgb(255 255 255 / 0.16) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 0.16) 1px, transparent 1px),
    linear-gradient(to right, rgb(255 255 255 / 0.28) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 0.28) 1px, transparent 1px);
  background-size:
    5vw 5vh,
    5vw 5vh,
    10vw 10vh,
    10vw 10vh;
}

.screen-debug-region {
  position: fixed;
  display: flex;
  min-height: 1.5rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-width: 2px;
  border-style: solid;
  border-radius: 1rem;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.25);
}

.screen-debug-region::before,
.screen-debug-region::after {
  position: absolute;
  content: '';
  background: rgb(255 255 255 / 0.45);
}

.screen-debug-region::before {
  left: 50%;
  top: 0;
  height: 100%;
  width: 1px;
}

.screen-debug-region::after {
  left: 0;
  top: 50%;
  height: 1px;
  width: 100%;
}

.screen-debug-label {
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  z-index: 1;
  border-radius: 9999px;
  padding: 0.15rem 0.5rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow: 0 0.5rem 1rem rgb(0 0 0 / 0.25);
}

.screen-debug-copy {
  z-index: 1;
  max-width: 92%;
  border-radius: 1rem;
  background: rgb(0 0 0 / 0.55);
  padding: 0.35rem 0.65rem;
  text-align: center;
  line-height: 1.2;
  text-wrap: balance;
}

.screen-debug-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  border-left-width: 2px;
  border-left-style: dashed;
  background: rgb(255 255 255 / 0.04);
  writing-mode: vertical-rl;
}

.screen-debug-guide {
  border-top-width: 2px;
  border-top-style: dashed;
  background: transparent;
}

.screen-debug-guide::after {
  position: absolute;
  right: 0.5rem;
  top: -1.35rem;
  border-radius: 9999px;
  background: rgb(0 0 0 / 0.72);
  padding: 0.15rem 0.45rem;
  content: attr(class);
}

.screen-debug-stat {
  display: flex;
  min-height: 4.5rem;
  flex-direction: column;
  justify-content: center;
  gap: 0.15rem;
  border-radius: 1rem;
  border: 1px solid hsl(var(--bc) / 0.12);
  background: hsl(var(--b2) / 0.7);
  padding: 0.65rem;
}

.screen-debug-stat strong {
  color: hsl(var(--p));
}
</style>
