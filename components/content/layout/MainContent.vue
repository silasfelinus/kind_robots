<template>
  <!-- Main content view that adjusts to available height and width -->
  <div class="main-content" :style="{ height: mainHeight, width: mainWidth }">
    <!-- Mobile view: Single column layout -->
    <div v-if="isMobileViewport" class="single-column">
      <div v-if="showTutorial" class="instructions">
        <SplashTutorial />
      </div>
      <div v-else class="launch">
        <NuxtPage />
      </div>
    </div>

    <!-- Medium view: Centered content -->
    <div v-if="isMediumViewport" class="center-content">
      <div v-if="showTutorial" class="tutorial-section">
        <SplashTutorial />
      </div>
      <div v-else class="launch-section">
        <NuxtPage />
      </div>
    </div>

    <!-- Large view: Two-column layout -->
    <div v-if="isLargeViewport && !isFullScreen" class="two-column">
      <div class="left-column" :style="{ width: sidebarLeftWidth }">
        <SplashTutorial />
      </div>
      <div class="right-column overflow-y-auto" :style="{ width: mainWidth }">
        <NuxtPage />
      </div>
    </div>

    <!-- Full-screen view: Full content area -->
    <div v-if="isFullScreen" class="fullscreen-content">
      <div v-if="showTutorial">
        <SplashTutorial />
      </div>
      <div v-else>
        <NuxtPage />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Viewport conditions
const isMobileViewport = computed(() => displayStore.isMobileViewport)
const isMediumViewport = computed(() => displayStore.viewportSize === 'medium')
const isLargeViewport = computed(() => displayStore.isLargeViewport)
const showTutorial = computed(() => displayStore.showTutorial)
const isFullScreen = computed(() => displayStore.isFullScreen)

// Main height and width calculations based on available space
const mainHeight = computed(() => displayStore.mainHeight)
const mainWidth = computed(() => displayStore.mainWidth)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
</script>

<style scoped>
.main-content {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* Layout for small viewports */
.single-column {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

/* Center content layout */
.center-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

/* Two-column layout for large viewports */
.two-column {
  display: grid;
  grid-template-columns: auto 1fr;
  width: 100%;
  height: 100%;
}

.left-column {
  padding: 1rem;
}

.right-column {
  padding: 1rem;
  overflow-y: auto;
}

/* Fullscreen view */
.fullscreen-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style>
