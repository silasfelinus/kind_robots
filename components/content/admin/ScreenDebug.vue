<template>
  <div class="fixed top-4 right-4 z-50">
    <button
      class="bg-gray-700 text-white p-2 rounded-full"
      @click="toggleDebug"
    >
      {{ isDebugVisible ? '🛠️' : '📌' }}
    </button>

    <div
      v-if="isDebugVisible"
      class="fixed z-50 bg-opacity-90 bg-black text-white p-4 rounded-lg max-w-lg max-h-96 overflow-y-auto"
      style="top: 50%; left: 50%; transform: translate(-50%, -50%)"
    >
      <h2 class="text-lg font-bold">Debug Info</h2>
      <ul class="text-sm space-y-2">
        <!-- Visibility States -->
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
        <li><strong>Header Height (string):</strong> {{ headerHeight }}</li>
        <li><strong>Footer Height (string):</strong> {{ footerHeight }}</li>

        <li><strong>Header Style (object):</strong> {{ headerStyle }}</li>
        <li><strong>Footer Style (object):</strong> {{ footerStyle }}</li>

        <!-- Sidebar Dimensions -->
        <li>
          <strong>Sidebar Left Width (string):</strong> {{ sidebarLeftWidth }}
        </li>
        <li>
          <strong>Sidebar Right Width (string):</strong> {{ sidebarRightWidth }}
        </li>

        <li>
          <strong>Sidebar Left Multiplier (number):</strong>
          {{ sidebarLeftMultiplier }}
        </li>
        <li>
          <strong>Sidebar Right Multiplier (number):</strong>
          {{ sidebarRightMultiplier }}
        </li>

        <!-- Main Content -->
        <li><strong>Center Height (string):</strong> {{ centerHeight }}</li>
        <li><strong>Center Width (string):</strong> {{ centerWidth }}</li>

        <li>
          <strong>Main Content Style (object):</strong> {{ mainContentStyle }}
        </li>
        <li><strong>Mode Row Style (object):</strong> {{ modeRowStyle }}</li>
        <li>
          <strong>Left Sidebar Style (object):</strong> {{ leftSidebarStyle }}
        </li>
        <li>
          <strong>Right Sidebar Style (object):</strong> {{ rightSidebarStyle }}
        </li>

        <!-- Padding Calculations -->

        <li>
          <strong>Section Padding VW (number):</strong> {{ sectionPaddingVw }}
        </li>
        <li>
          <strong>Section Padding VH (number):</strong> {{ sectionPaddingVh }}
        </li>
        <li>
          <strong>Section Padding Multiplier (number):</strong>
          {{ sectionPaddingMultiplier }}
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
        <li><strong>Mode Row Height (number):</strong> {{ modeRowHeight }}</li>

        <!-- Icon & UI Sizes -->
        <li><strong>Icon Size (number):</strong> {{ iconSize }}</li>
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
const sidebarLeftVisible = computed(() => displayStore.sidebarLeftVisible)
const sidebarRightVisible = computed(() => displayStore.sidebarRightVisible)
const footerVisible = computed(() => displayStore.footerVisible)

// Header & Footer
const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)

const headerStyle = computed(() => displayStore.headerStyle)
const footerStyle = computed(() => displayStore.footerStyle)

// Sidebar Dimensions
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)

const sidebarLeftMultiplier = computed(() => displayStore.sidebarLeftMultiplier)
const sidebarRightMultiplier = computed(
  () => displayStore.sidebarRightMultiplier,
)

// Main Content Layout & Styles
const centerHeight = computed(() => displayStore.centerHeight)
const centerWidth = computed(() => displayStore.centerWidth)

const mainContentStyle = computed(() => displayStore.mainContentStyle)
const modeRowStyle = computed(() => displayStore.modeRowStyle)
const leftSidebarStyle = computed(() => displayStore.leftSidebarStyle)
const rightSidebarStyle = computed(() => displayStore.rightSidebarStyle)

// Padding Calculations
const sectionPaddingVw = computed(() => displayStore.sectionPaddingVw)
const sectionPaddingVh = computed(() => displayStore.sectionPaddingVh)
const sectionPaddingMultiplier = computed(
  () => displayStore.sectionPaddingMultiplier,
)

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
const modeRowHeight = computed(() => displayStore.modeRowHeight)
const iconSize = computed(() => displayStore.iconSize)
</script>
