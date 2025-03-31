<!-- /components/content/story/screen-debug.vue -->
<template>
  <teleport to="body">
    <div class="fixed z-50 inset-0 flex items-center justify-center pointer-events-none">
      <div class="absolute top-4 right-4 pointer-events-auto">
        <button
          class="bg-gray-700 text-white p-2 rounded-full shadow-md"
          @click="toggleDebug"
        >
          {{ isDebugVisible ? '🛠️' : '📌' }}
        </button>
      </div>

      <client-only>
        <div
          v-if="isDebugVisible"
          class="bg-black bg-opacity-90 text-white p-6 rounded-xl w-[90vw] max-w-7xl max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto"
        >
          <h2 class="text-xl font-bold mb-4">🧪 Kind Robots Debug Panel</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Visibility & State -->
            <div class="bg-base-200 p-4 rounded-2xl border border-base-300">
              <h3 class="text-lg font-semibold mb-2">State & Visibility</h3>
              <div class="space-y-1 text-sm">
                <div><strong>Header:</strong> {{ headerVisible }} ({{ headerState }})</div>
                <div><strong>Sidebar Left:</strong> {{ sidebarLeftVisible }} ({{ sidebarLeftState }})</div>
                <div><strong>Sidebar Right:</strong> {{ sidebarRightVisible }} ({{ sidebarRightState }})</div>
                <div><strong>Footer:</strong> {{ footerVisible }} ({{ footerState }})</div>
                <div><strong>Fullscreen:</strong> {{ fullscreenState }}</div>
                <div><strong>Flip:</strong> {{ flipState }}</div>
                <div><strong>Big Mode:</strong> {{ bigMode }}</div>
              </div>
            </div>

            <!-- Dimensions -->
            <div class="bg-base-200 p-4 rounded-2xl border border-base-300">
              <h3 class="text-lg font-semibold mb-2">Sizes & Bases</h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Header H:</strong> {{ headerHeight }}</div>
                <div><strong>Footer H:</strong> {{ footerHeight }}</div>
                <div><strong>Left W:</strong> {{ sidebarLeftWidth }}</div>
                <div><strong>Right W:</strong> {{ sidebarRightWidth }}</div>
                <div><strong>Header Base:</strong> {{ headerBase }}</div>
                <div><strong>Footer Base:</strong> {{ footerBase }}</div>
                <div><strong>Left Base:</strong> {{ sidebarLeftBase }}</div>
                <div><strong>Right Base:</strong> {{ sidebarRightBase }}</div>
                <div><strong>Section Pad:</strong> {{ sectionPadding }}</div>
              </div>
            </div>

            <!-- Styles -->
            <div class="bg-base-200 p-4 rounded-2xl border border-base-300">
              <h3 class="text-lg font-semibold mb-2">Style Bindings</h3>
              <div class="space-y-1 text-xs font-mono">
                <div><strong>Header:</strong> {{ headerStyle }}</div>
                <div><strong>Footer:</strong> {{ footerStyle }}</div>
                <div><strong>Main:</strong> {{ mainContentStyle }}</div>
                <div><strong>Left Sidebar:</strong> {{ leftSidebarStyle }}</div>
                <div><strong>Right Sidebar:</strong> {{ rightSidebarStyle }}</div>
                <div><strong>Left Toggle:</strong> {{ leftToggleStyle }}</div>
                <div><strong>Right Toggle:</strong> {{ rightToggleStyle }}</div>
                <div><strong>Footer Toggle:</strong> {{ footerToggleStyle }}</div>
              </div>
            </div>

            <!-- Device + Viewport -->
            <div class="bg-base-200 p-4 rounded-2xl border border-base-300">
              <h3 class="text-lg font-semibold mb-2">Device Info</h3>
              <div class="space-y-1 text-sm">
                <div><strong>Viewport:</strong> {{ viewportSize }}</div>
                <div><strong>Mobile View:</strong> {{ isMobileViewport }}</div>
                <div><strong>Large View:</strong> {{ isLargeViewport }}</div>
                <div><strong>Touch Device:</strong> {{ isTouchDevice }}</div>
              </div>
            </div>

            <!-- Animation -->
            <div class="bg-base-200 p-4 rounded-2xl border border-base-300">
              <h3 class="text-lg font-semibold mb-2">Animation</h3>
              <div class="space-y-1 text-sm">
                <div><strong>Is Animating:</strong> {{ isAnimating }}</div>
                <div><strong>Current Animation:</strong> {{ currentAnimation }}</div>
              </div>
            </div>

            <!-- Routing -->
            <div class="bg-base-200 p-4 rounded-2xl border border-base-300">
              <h3 class="text-lg font-semibold mb-2">Navigation</h3>
              <div class="text-sm"><strong>Previous Route:</strong> {{ previousRoute }}</div>
            </div>
          </div>
        </div>
      </client-only>
    </div>
  </teleport>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const isDebugVisible = ref(false)
const toggleDebug = () => {
  isDebugVisible.value = !isDebugVisible.value
}

// Visibility States
const headerVisible = computed(() => displayStore.headerState == 'open')
const sidebarLeftVisible = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarLeftState),
)

const sidebarRightVisible = computed(
  () => displayStore.sidebarRightState == 'open',
)
const footerVisible = computed(() => displayStore.footerState == 'open')

// Header & Footer
const headerState = computed(() => displayStore.headerState)
const footerState = computed(() => displayStore.footerState)
const headerBase = computed(() => displayStore.headerHeight)
const footerBase = computed(() => displayStore.footerHeight)
const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const headerStyle = computed(() => displayStore.headerStyle)
const footerStyle = computed(() => displayStore.footerStyle)

// Toggles
const leftToggleStyle = computed(() => displayStore.leftToggleStyle)
const rightToggleStyle = computed(() => displayStore.rightToggleStyle)
const footerToggleStyle = computed(() => displayStore.footerToggleStyle)

// Sidebar Dimensions
const sidebarLeftState = computed(() => displayStore.sidebarLeftState)
const sidebarRightState = computed(() => displayStore.sidebarRightState)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const sidebarLeftBase = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightBase = computed(() => displayStore.sidebarRightWidth)

const leftSidebarStyle = computed(() => displayStore.leftSidebarStyle)
const rightSidebarStyle = computed(() => displayStore.rightSidebarStyle)

const mainContentStyle = computed(() => displayStore.mainContentStyle)

// Padding Calculations
const sectionPadding = computed(() => displayStore.sectionPaddingSize)

// Animation & Effects
const isAnimating = computed(() => displayStore.isAnimating)
const currentAnimation = computed(() => displayStore.currentAnimation)

// Viewport & Layout Info
const viewportSize = computed(() => displayStore.viewportSize)
const isTouchDevice = computed(() => displayStore.isTouchDevice)
const isMobileViewport = computed(() => displayStore.isMobileViewport)
const isLargeViewport = computed(() => displayStore.isLargeViewport)
const fullscreenState = computed(() => displayStore.fullscreenState)
const bigMode = computed(() => displayStore.bigMode)
const flipState = computed(() => displayStore.flipState)
const previousRoute = computed(() => displayStore.previousRoute)
</script>
