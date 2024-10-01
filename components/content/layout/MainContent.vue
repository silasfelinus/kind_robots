<template>
  <div class="rounded-2xl border-2 border-accent-200">
    <!-- For small viewports, display only one section -->
    <div v-if="isMobileViewport" class="single-column">
      <div v-if="showTutorial" class="instructions">
        <SplashTutorial />
      </div>
      <div v-else class="launch">
        <NuxtPage />
      </div>
    </div>

    <!-- For medium viewports, display centered content -->
    <div
      v-if="isMediumViewport"
      class="center-content"
      :style="{ height: mainHeight }"
    >
      <div v-if="showTutorial" class="tutorial-section">
        <SplashTutorial />
      </div>
      <div v-else class="launch-section">
        <NuxtPage />
      </div>
    </div>

    <!-- For large viewports, display two columns -->
    <div
      v-if="isLargeViewport && !isFullScreen"
      class="two-column"
      :style="{ height: mainHeight, gridTemplateColumns: gridColumns }"
    >
      <div class="left-column" :style="{ width: sidebarLeftWidth }">
        <SplashTutorial />
      </div>
      <div class="right-column overflow-y-auto" :style="{ width: mainWidth }">
        <NuxtPage />
      </div>
    </div>

    <!-- Fullscreen view -->
    <div
      v-if="isLargeViewport && isFullScreen"
      class="fullscreen-content"
      :style="{ height: mainHeight }"
    >
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

// Calculating dynamic heights and widths from displayStore
const mainHeight = computed(() => displayStore.mainHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const mainWidth = computed(() => displayStore.mainWidth)
const gridColumns = computed(() => displayStore.gridColumns)
</script>

<style scoped>
/* Layout Styles */
.single-column,
.center-content,
.fullscreen-content {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* For two-column layout */
.two-column {
  display: grid;
}

.left-column,
.right-column {
  padding: 1rem;
}

.right-column {
  overflow-y: auto; /* Allow scrolling only within the NuxtPage */
}
</style>
