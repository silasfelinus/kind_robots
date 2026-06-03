<!-- /components/content/utils/screen-debug.vue -->
<template>
  <div
    v-if="isAdmin"
    class="pointer-events-auto fixed right-3 top-3 z-10000 flex items-center gap-2 rounded-2xl border border-base-300 bg-base-100/90 p-2 text-base-content shadow-xl backdrop-blur"
  >
    <button
      class="btn btn-sm rounded-2xl border border-primary/40 bg-primary/15 text-primary hover:bg-primary hover:text-primary-content"
      type="button"
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
      class="pointer-events-none fixed inset-0 z-9999 overflow-hidden bg-black/35 font-mono text-[0.65rem] text-white backdrop-blur-[1px]"
    >
      <div class="screen-debug-grid absolute inset-0" />

      <div
        class="absolute left-3 top-3 rounded-2xl border border-white/30 bg-black/65 px-3 py-2 shadow-xl"
      >
        <div class="text-xs font-bold text-white">Viewport</div>
        <div>{{ viewportWidth }}px × {{ viewportHeight }}px</div>
        <div>{{ displayStore.viewportSize }}</div>
        <div>vertical {{ bool(displayStore.isVertical) }}</div>
        <div>mobile {{ bool(displayStore.isMobileViewport) }}</div>
        <div>touch {{ bool(displayStore.isTouchDevice) }}</div>
        <div>--vh {{ vhValue }}</div>
      </div>

      <div
        class="absolute right-3 top-16 rounded-2xl border border-white/30 bg-black/65 px-3 py-2 text-right shadow-xl"
      >
        <div class="text-xs font-bold text-white">Display State</div>
        <div>mode {{ displayStore.displayMode }}</div>
        <div>action {{ displayStore.displayAction }}</div>
        <div>main {{ displayStore.mainComponent || 'none' }}</div>
        <div>smart {{ displayStore.SmartState }}</div>
        <div>route {{ displayStore.previousRoute || 'none' }}</div>
      </div>

      <div
        v-for="box in measuredBoxes"
        :key="box.selector"
        :style="box.style"
        class="screen-debug-region"
        :class="box.class"
      >
        <div class="screen-debug-label" :class="box.labelClass">
          {{ box.label }}
        </div>

        <div class="screen-debug-copy">
          <div>{{ box.width }}px × {{ box.height }}px</div>
          <div>x {{ box.left }} · y {{ box.top }}</div>
          <div>{{ box.selector }}</div>
        </div>
      </div>

      <div
        class="pointer-events-auto fixed bottom-3 left-3 max-h-[48vh] w-[calc(100vw-1.5rem)] max-w-5xl overflow-y-auto rounded-2xl border border-base-300 bg-base-100/95 p-4 text-base-content shadow-2xl backdrop-blur sm:w-2xl"
      >
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-base font-bold text-primary">
              🧪 Slim Screen Debug
            </h2>
            <p class="text-xs text-base-content/70">
              Store state, viewport facts, and live DOM measurements. No haunted
              layout math.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              class="btn btn-xs rounded-2xl border border-base-300 bg-base-200"
              type="button"
              @click="refreshDebug"
            >
              Refresh
            </button>

            <button
              class="btn btn-xs rounded-2xl border border-info/40 bg-info/15 text-info"
              type="button"
              @click="displayStore.applyViewportSize()"
            >
              Apply viewport
            </button>

            <button
              class="btn btn-xs rounded-2xl border border-error/40 bg-error/15 text-error"
              type="button"
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
            <strong>Viewport</strong>
            <span>{{ displayStore.viewportSize }}</span>
            <span>{{ viewportWidth }}×{{ viewportHeight }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Device</strong>
            <span>touch {{ bool(displayStore.isTouchDevice) }}</span>
            <span>mobile {{ bool(displayStore.isMobileViewport) }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Orientation</strong>
            <span>vertical {{ bool(displayStore.isVertical) }}</span>
            <span>--vh {{ vhValue }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Header</strong>
            <span>{{ displayStore.headerState }}</span>
            <span>visible {{ bool(displayStore.headerContentVisible) }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Left Sidebar</strong>
            <span>{{ displayStore.sidebarLeftState }}</span>
            <span>visible {{ bool(displayStore.sidebarLeftVisible) }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Right Sidebar</strong>
            <span>{{ displayStore.sidebarRightState }}</span>
            <span>visible {{ bool(displayStore.sidebarRightVisible) }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Footer</strong>
            <span>{{ displayStore.footerState }}</span>
            <span>visible {{ bool(displayStore.footerContentVisible) }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Fullscreen</strong>
            <span>{{ displayStore.fullscreenState }}</span>
            <span>{{ bool(displayStore.isFullScreen) }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Tutorial</strong>
            <span>{{ bool(displayStore.showTutorial) }}</span>
            <span>{{ displayStore.flipState }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Sections</strong>
            <span>L {{ bool(displayStore.showLeft) }}</span>
            <span>
              C {{ bool(displayStore.showCenter) }} · R
              {{ bool(displayStore.showRight) }}
            </span>
          </div>

          <div class="screen-debug-stat">
            <strong>Extended</strong>
            <span>{{ bool(displayStore.showExtended) }}</span>
            <span>corner {{ bool(displayStore.showCorner) }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Animation</strong>
            <span>{{ bool(displayStore.isAnimating) }}</span>
            <span>{{ displayStore.currentAnimation || 'none' }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Mode</strong>
            <span>{{ displayStore.displayMode }}</span>
            <span>{{ displayStore.displayAction }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Smart State</strong>
            <span>{{ displayStore.SmartState }}</span>
            <span>{{ displayStore.mainComponent || 'no component' }}</span>
          </div>

          <div class="screen-debug-stat">
            <strong>DOM Boxes</strong>
            <span>{{ measuredBoxes.length }} found</span>
            <span>{{ missingSelectors.length }} missing</span>
          </div>

          <div class="screen-debug-stat">
            <strong>Initialized</strong>
            <span>{{ bool(displayStore.isInitialized) }}</span>
            <span>admin {{ bool(isAdmin) }}</span>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <details
            class="rounded-2xl border border-base-300 bg-base-200 p-3"
            open
          >
            <summary class="cursor-pointer text-sm font-bold text-primary">
              Debug Controls
            </summary>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                class="btn btn-xs rounded-2xl"
                type="button"
                @click="displayStore.toggleLeftSidebar()"
              >
                Toggle left
              </button>

              <button
                class="btn btn-xs rounded-2xl"
                type="button"
                @click="displayStore.toggleRightSidebar()"
              >
                Toggle right
              </button>

              <button
                class="btn btn-xs rounded-2xl"
                type="button"
                @click="displayStore.toggleHeader()"
              >
                Toggle header
              </button>

              <button
                class="btn btn-xs rounded-2xl"
                type="button"
                @click="displayStore.toggleFooter()"
              >
                Toggle footer
              </button>

              <button
                class="btn btn-xs rounded-2xl"
                type="button"
                @click="displayStore.toggleTutorial()"
              >
                Toggle tutorial
              </button>

              <button
                class="btn btn-xs rounded-2xl"
                type="button"
                @click="displayStore.toggleExtended()"
              >
                Toggle extended
              </button>

              <button
                class="btn btn-xs rounded-2xl"
                type="button"
                @click="displayStore.toggleCorner()"
              >
                Toggle corner
              </button>

              <button
                class="btn btn-xs rounded-2xl"
                type="button"
                @click="displayStore.toggleFullscreen()"
              >
                Toggle fullscreen
              </button>

              <button
                class="btn btn-xs rounded-2xl"
                type="button"
                @click="displayStore.toggleRandomAnimation()"
              >
                Random animation
              </button>

              <button
                class="btn btn-xs rounded-2xl"
                type="button"
                @click="displayStore.stopAnimation()"
              >
                Stop animation
              </button>

              <button
                class="btn btn-xs rounded-2xl"
                type="button"
                @click="displayStore.toggleSmartFlip()"
              >
                Smart flip
              </button>
            </div>
          </details>

          <details class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <summary class="cursor-pointer text-sm font-bold text-primary">
              Measured DOM Boxes
            </summary>

            <pre
              class="mt-3 whitespace-pre-wrap text-[0.65rem] leading-relaxed text-base-content/80"
              >{{ formattedBoxes }}</pre
            >
          </details>

          <details class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <summary class="cursor-pointer text-sm font-bold text-warning">
              Missing Selectors
            </summary>

            <pre
              class="mt-3 whitespace-pre-wrap text-[0.65rem] leading-relaxed text-base-content/80"
              >{{ formattedMissingSelectors }}</pre
            >
          </details>

          <details class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <summary class="cursor-pointer text-sm font-bold text-primary">
              Raw Store Snapshot
            </summary>

            <pre
              class="mt-3 whitespace-pre-wrap text-[0.65rem] leading-relaxed text-base-content/80"
              >{{ storeSnapshot }}</pre
            >
          </details>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// /components/content/utils/screen-debug.vue
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  type CSSProperties,
} from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'

type DebugTarget = {
  label: string
  selector: string
  class: string
  labelClass: string
}

type MeasuredBox = DebugTarget & {
  top: number
  left: number
  width: number
  height: number
  style: CSSProperties
}

const displayStore = useDisplayStore()
const userStore = useUserStore()

const debugTargets: DebugTarget[] = [
  {
    label: 'App Root',
    selector: '#__nuxt',
    class: 'border-white bg-white/10 text-white',
    labelClass: 'bg-white text-black',
  },
  {
    label: 'Page Main',
    selector: 'main',
    class: 'border-warning bg-warning/20 text-warning-content',
    labelClass: 'bg-warning text-warning-content',
  },
  {
    label: 'Dashboard Shell',
    selector: '[data-debug="dashboard-shell"]',
    class: 'border-primary bg-primary/20 text-primary-content',
    labelClass: 'bg-primary text-primary-content',
  },
  {
    label: 'Dashboard Header',
    selector: '[data-debug="dashboard-header"]',
    class: 'border-info bg-info/20 text-info-content',
    labelClass: 'bg-info text-info-content',
  },
  {
    label: 'Dashboard Content',
    selector: '[data-debug="dashboard-content"]',
    class: 'border-accent bg-accent/20 text-accent-content',
    labelClass: 'bg-accent text-accent-content',
  },
  {
    label: 'Left Sidebar',
    selector: '[data-debug="left-sidebar"]',
    class: 'border-cyan-300 bg-cyan-300/20 text-cyan-50',
    labelClass: 'bg-cyan-400 text-cyan-950',
  },
  {
    label: 'Right Sidebar',
    selector: '[data-debug="right-sidebar"]',
    class: 'border-pink-300 bg-pink-300/20 text-pink-50',
    labelClass: 'bg-pink-400 text-pink-950',
  },
  {
    label: 'Builder Stage',
    selector: '[data-debug="builder-stage"]',
    class: 'border-secondary bg-secondary/20 text-secondary-content',
    labelClass: 'bg-secondary text-secondary-content',
  },
  {
    label: 'Worksheet Hand',
    selector: '[data-debug="Worksheet-hand"]',
    class: 'border-emerald-300 bg-emerald-300/20 text-emerald-50',
    labelClass: 'bg-emerald-400 text-emerald-950',
  },
]

const isDebugVisible = ref(false)
const viewportWidth = ref(0)
const viewportHeight = ref(0)
const vhValue = ref('unset')
const measuredBoxes = ref<MeasuredBox[]>([])
const missingSelectors = ref<string[]>([])

const isAdmin = computed(() => userStore.isAdmin === true)

const formattedBoxes = computed(() => {
  if (!measuredBoxes.value.length) return 'No debug targets found.'

  return measuredBoxes.value
    .map((box) => {
      return `${box.label}
selector: ${box.selector}
x/y: ${box.left}, ${box.top}
size: ${box.width} × ${box.height}`
    })
    .join('\n\n')
})

const formattedMissingSelectors = computed(() => {
  if (!missingSelectors.value.length)
    return 'No missing selectors. Suspiciously civilized.'

  return missingSelectors.value.join('\n')
})

const storeSnapshot = computed(() => {
  return JSON.stringify(
    {
      headerState: displayStore.headerState,
      sidebarLeftState: displayStore.sidebarLeftState,
      sidebarRightState: displayStore.sidebarRightState,
      footerState: displayStore.footerState,
      navDock: displayStore.navDock,
      viewportSize: displayStore.viewportSize,
      isVertical: displayStore.isVertical,
      isTouchDevice: displayStore.isTouchDevice,
      isMobileViewport: displayStore.isMobileViewport,
      showTutorial: displayStore.showTutorial,
      flipState: displayStore.flipState,
      isFullScreen: displayStore.isFullScreen,
      fullscreenState: displayStore.fullscreenState,
      isAnimating: displayStore.isAnimating,
      currentAnimation: displayStore.currentAnimation,
      displayMode: displayStore.displayMode,
      displayAction: displayStore.displayAction,
      previousRoute: displayStore.previousRoute,
      mainComponent: displayStore.mainComponent,
      showLeft: displayStore.showLeft,
      showCenter: displayStore.showCenter,
      showRight: displayStore.showRight,
      showExtended: displayStore.showExtended,
      showCorner: displayStore.showCorner,
      SmartState: displayStore.SmartState,
      isInitialized: displayStore.isInitialized,
    },
    null,
    2,
  )
})

function toggleDebug() {
  isDebugVisible.value = !isDebugVisible.value
  refreshDebug()
}

async function refreshDebug() {
  if (typeof window === 'undefined') return

  displayStore.applyViewportSize()

  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
  vhValue.value =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--vh')
      .trim() || 'unset'

  await nextTick()
  measureTargets()
}

function measureTargets() {
  if (typeof window === 'undefined') return

  const boxes: MeasuredBox[] = []
  const missing: string[] = []

  for (const target of debugTargets) {
    const element = document.querySelector(target.selector)

    if (!element) {
      missing.push(`${target.label}: ${target.selector}`)
      continue
    }

    const rect = element.getBoundingClientRect()

    if (rect.width <= 0 || rect.height <= 0) {
      missing.push(
        `${target.label}: ${target.selector} exists but has no visible size`,
      )
      continue
    }

    boxes.push({
      ...target,
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      style: {
        position: 'fixed',
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        zIndex: '9998',
      },
    })
  }

  measuredBoxes.value = boxes
  missingSelectors.value = missing
}

function bool(value: boolean) {
  return value ? 'on' : 'off'
}

onMounted(() => {
  displayStore.initialize()
  refreshDebug()

  window.addEventListener('resize', refreshDebug)
  window.addEventListener('orientationchange', refreshDebug)
  window.visualViewport?.addEventListener('resize', refreshDebug)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return

  window.removeEventListener('resize', refreshDebug)
  window.removeEventListener('orientationchange', refreshDebug)
  window.visualViewport?.removeEventListener('resize', refreshDebug)
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
