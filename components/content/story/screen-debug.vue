<template>
  <teleport to="body">
    <div
      class="fixed z-50 inset-0 flex items-center justify-center pointer-events-none"
    >
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
          class="bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-lg max-h-[90vh] overflow-y-auto shadow-xl pointer-events-auto"
        >
          <h2 class="text-lg font-bold mb-2">Debug Info</h2>
          <ul class="text-sm space-y-2">
            <!-- your debug info unchanged -->
            <li><strong>Header Visible:</strong> {{ headerVisible }}</li>
            <li>
              <strong>Sidebar Left Visible:</strong> {{ sidebarLeftVisible }}
            </li>
            <li>
              <strong>Sidebar Right Visible:</strong> {{ sidebarRightVisible }}
            </li>
            <li><strong>Footer Visible:</strong> {{ footerVisible }}</li>
            <li><strong>Header State:</strong> {{ headerState }}</li>
            <li><strong>Footer State:</strong> {{ footerState }}</li>
            <li><strong>Header Height:</strong> {{ headerHeight }}</li>
            <li><strong>Footer Height:</strong> {{ footerHeight }}</li>
            <li><strong>Header Base:</strong> {{ headerBase }}</li>
            <li><strong>Footer Base:</strong> {{ footerBase }}</li>
            <li><strong>Header Style:</strong> {{ headerStyle }}</li>
  <li><strong>Left Sidebar Style:</strong> {{ leftSidebarStyle }}</li>
            <li>
              <strong>Right Sidebar Style:</strong> {{ rightSidebarStyle }}
            </li>
            <li><strong>Main Content Style:</strong> {{ mainContentStyle }}</li>
            <li><strong>Footer Style:</strong> {{ footerStyle }}</li>
            <li><strong>Left Toggle Style:</strong> {{ leftToggleStyle }}</li>
            <li><strong>Right Toggle Style:</strong> {{ rightToggleStyle }}</li>
            <li>
              <strong>Footer Toggle Style:</strong> {{ footerToggleStyle }}
            </li>
            <li><strong>Sidebar Left State:</strong> {{ sidebarLeftState }}</li>
            <li>
              <strong>Sidebar Right State:</strong> {{ sidebarRightState }}
            </li>
            <li><strong>Sidebar Left Width:</strong> {{ sidebarLeftWidth }}</li>
            <li>
              <strong>Sidebar Right Width:</strong> {{ sidebarRightWidth }}
            </li>
            <li><strong>Sidebar Left Base:</strong> {{ sidebarLeftBase }}</li>
            <li><strong>Sidebar Right Base:</strong> {{ sidebarRightBase }}</li>
          
            <li><strong>Section Padding:</strong> {{ sectionPadding }}</li>
            <li><strong>Is Animating:</strong> {{ isAnimating }}</li>
            <li><strong>Current Animation:</strong> {{ currentAnimation }}</li>
            <li><strong>Viewport Size:</strong> {{ viewportSize }}</li>
            <li><strong>Is Touch Device:</strong> {{ isTouchDevice }}</li>
            <li><strong>Is Mobile Viewport:</strong> {{ isMobileViewport }}</li>
            <li><strong>Is Large Viewport:</strong> {{ isLargeViewport }}</li>
            <li><strong>Fullscreen State:</strong> {{ fullscreenState }}</li>
            <li><strong>Big Mode:</strong> {{ bigMode }}</li>
            <li><strong>Flip State:</strong> {{ flipState }}</li>
            <li><strong>Previous Route:</strong> {{ previousRoute }}</li>
          </ul>
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
