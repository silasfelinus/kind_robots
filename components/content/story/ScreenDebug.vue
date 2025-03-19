<template>
  <div class="fixed bottom-4 right-4 z-50">
    <button
      class="bg-gray-700 text-white p-2 rounded-full"
      @click="toggleDebug"
    >
      {{ isDebugVisible ? '🛠️' : '📌' }}
    </button>

    <div
      v-if="isDebugVisible"
      class="fixed z-50 bg-opacity-90 bg-black text-white p-4 rounded-lg max-w-lg max-h-96 overflow-y-auto"
      style="bottom: 50%; left: 50%; transform: translate(-50%, -50%)"
    >
      <h2 class="text-lg font-bold">Debug Info</h2>
      <ul class="text-sm space-y-2">
        <!-- Visibility States -->
        <li><strong>Header Visible (boolean):</strong> {{ headerVisible }}</li>
        <li>
          <strong>Sidebar Left Visible (boolean):</strong>
          {{ sidebarLeftVisible }}
        </li>
        <li>
          <strong>Sidebar Right Visible (boolean):</strong>
          {{ sidebarRightVisible }}
        </li>
        <li><strong>Footer Visible (boolean):</strong> {{ footerVisible }}</li>

        <!-- Header & Footer -->
        <li><strong>Header State (string):</strong> {{ headerState }}</li>
        <li><strong>Footer State (string):</strong> {{ footerState }}</li>
        <li><strong>Header Height (string):</strong> {{ headerHeight }}</li>
        <li><strong>Footer Height (string):</strong> {{ footerHeight }}</li>
        <li><strong>Header Base (number):</strong> {{ headerBase }}</li>
        <li><strong>Footer Base (number):</strong> {{ footerBase }}</li>
        <li><strong>Header Style (object):</strong> {{ headerStyle }}</li>
        <li><strong>Footer Style (object):</strong> {{ footerStyle }}</li>

        <!-- Sidebar Dimensions -->
        <li>
          <strong>Sidebar Left State (string):</strong> {{ sidebarLeftState }}
        </li>
        <li>
          <strong>Sidebar Right State (string):</strong> {{ sidebarRightState }}
        </li>
        <li>
          <strong>Sidebar Left Width (string):</strong> {{ sidebarLeftWidth }}
        </li>
        <li>
          <strong>Sidebar Right Width (string):</strong> {{ sidebarRightWidth }}
        </li>
        <li>
          <strong>Sidebar Left Base (number):</strong> {{ sidebarLeftBase }}
        </li>
        <li>
          <strong>Sidebar Right Base (number):</strong> {{ sidebarRightBase }}
        </li>

        <li>
          <strong>Left Sidebar Style (object):</strong> {{ leftSidebarStyle }}
        </li>
        <li>
          <strong>Right Sidebar Style (object):</strong> {{ rightSidebarStyle }}
        </li>

        <!-- Main Content -->

        <li>
          <strong>Main Content Style (object):</strong> {{ mainContentStyle }}
        </li>

        <!-- Padding Calculations -->
        <li>
          <strong>Section Padding (number):</strong>
          {{ sectionPadding }}
        </li>

        <!-- Animation & Effects -->
        <li><strong>Is Animating (boolean):</strong> {{ isAnimating }}</li>
        <li>
          <strong>Current Animation (string):</strong> {{ currentAnimation }}
        </li>

        <!-- Viewport & Layout Info -->
        <li><strong>Viewport Size (string):</strong> {{ viewportSize }}</li>
        <li><strong>Is Touch Device (boolean):</strong> {{ isTouchDevice }}</li>
        <li>
          <strong>Is Mobile Viewport (boolean):</strong> {{ isMobileViewport }}
        </li>
        <li>
          <strong>Is Large Viewport (boolean):</strong> {{ isLargeViewport }}
        </li>
        <li>
          <strong>Fullscreen State (string):</strong> {{ fullscreenState }}
        </li>
        <li><strong>Big Mode (boolean):</strong> {{ bigMode }}</li>
        <li><strong>Flip State (string):</strong> {{ flipState }}</li>
        <li><strong>Previous Route (string):</strong> {{ previousRoute }}</li>
      </ul>
    </div>
  </div>
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
const sidebarLeftVisible = computed(
  () => displayStore.sidebarLeftState == 'open',
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
