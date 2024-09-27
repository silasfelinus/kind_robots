<template>
  <div class="main-layout absolute inset-0 bg-base-300">
    <!-- Loader Component -->

    <!-- Header -->
    <header
      class="header-overlay bg-base-300 flex items-center justify-between w-full px-4"
      :style="{ height: headerHeight }"
    >
      <!-- Sidebar Toggle -->
      <div class="p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl"></sidebar-toggle>
      </div>

      <!-- Navigation Links (centered in the row) -->
      <div class="flex-grow">
        <nav-links class="hidden sm:flex justify-center"></nav-links>
      </div>

      <!-- Launch/Instructions Buttons (right-aligned in the row) -->
      <button
        v-if="showLaunchButton"
        class="bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-50 p-1"
        @click="displayStore.toggleTutorial"
      >
        Launch
      </button>

      <button
        v-if="showInstructionsButton"
        class="bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-50 p-1"
        @click="displayStore.toggleTutorial"
      >
        Instructions
      </button>
    </header>

    <!-- Main content area with sidebars and main content -->
    <div
      class="content-area"
      :style="{
        gridTemplateColumns: gridColumns,
        height: mainHeight,
      }"
    >
      <!-- Left Sidebar -->
      <kind-sidebar-simple
        class="sidebar-left-overlay overflow-y-auto bg-base-300"
        :style="{
          width: sidebarLeftWidth,
          height: mainHeight,
        }"
      ></kind-sidebar-simple>

      <!-- Main Content -->
      <main
        class="main-content-overlay rounded-2xl bg-base-300"
        :style="{
          height: mainHeight,
          width: mainWidth,
        }"
      >
        <main-flip></main-flip>
      </main>

      <!-- Right Sidebar -->
      <aside
        class="sidebar-right-overlay"
        :style="{
          width: sidebarRightWidth,
          height: mainHeight,
        }"
      ></aside>
    </div>

    <!-- Footer -->
    <footer
      class="footer-overlay"
      :style="{
        height: footerHeight,
      }"
    ></footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from './stores/displayStore'
import { usePitchStore } from './stores/pitchStore'
import { useReactionStore } from './stores/reactionStore'
import { useErrorStore, ErrorType } from './stores/errorStore'

const displayStore = useDisplayStore()
const errorStore = useErrorStore()
const reactionStore = useReactionStore()
const pitchStore = usePitchStore()

// Error handler utility with specific Error type
const handleError = (
  error: Error,
  message: string,
  type: ErrorType = ErrorType.GENERAL_ERROR,
) => {
  console.error(message, error.stack || error)
  errorStore.setError(type, error) // Pass ErrorType and error as arguments
}

// Computed properties for reactive access to store data
const headerHeight = computed(() => {
  try {
    return `calc(var(--vh, 1vh) * ${displayStore.headerVh})`
  } catch (error) {
    console.error('Error in headerHeight:', error) // Log the error to fix unused error issue
    handleError(
      new Error('Header height calculation failed'),
      'Error calculating header height',
      ErrorType.STORE_ERROR,
    )
    return '50px' // Fallback
  }
})

const mainHeight = computed(() => {
  try {
    return `calc(var(--vh, 1vh) * ${displayStore.mainVh})`
  } catch (error) {
    console.error('Error in mainHeight:', error) // Log the error to fix unused error issue
    handleError(
      new Error('Main height calculation failed'),
      'Error calculating main height',
      ErrorType.STORE_ERROR,
    )
    return 'calc(100vh - 100px)' // Fallback
  }
})

const footerHeight = computed(() => {
  try {
    return `calc(var(--vh, 1vh) * ${displayStore.footerVh})`
  } catch (error) {
    console.error('Error in footerHeight:', error) // Log the error to fix unused error issue
    handleError(
      new Error('Footer height calculation failed'),
      'Error calculating footer height',
      ErrorType.STORE_ERROR,
    )
    return '50px' // Fallback
  }
})

const sidebarLeftWidth = computed(() => {
  try {
    return `${displayStore.sidebarLeftVw}vw`
  } catch (error) {
    console.error('Error in sidebarLeftWidth:', error) // Log the error to fix unused error issue
    handleError(
      new Error('Sidebar left width calculation failed'),
      'Error calculating sidebarLeft width',
      ErrorType.STORE_ERROR,
    )
    return '20vw' // Fallback
  }
})

const sidebarRightWidth = computed(() => {
  try {
    return `${displayStore.sidebarRightVw}vw`
  } catch (error) {
    console.error('Error in sidebarRightWidth:', error) // Log the error to fix unused error issue
    handleError(
      new Error('Sidebar right width calculation failed'),
      'Error calculating sidebarRight width',
      ErrorType.STORE_ERROR,
    )
    return '20vw' // Fallback
  }
})

const mainWidth = computed(() => {
  try {
    return `calc(100vw - ${displayStore.sidebarLeftVw}vw - ${displayStore.sidebarRightVw}vw)`
  } catch (error) {
    console.error('Error in mainWidth:', error) // Log the error to fix unused error issue
    handleError(
      new Error('Main width calculation failed'),
      'Error calculating main width',
      ErrorType.STORE_ERROR,
    )
    return '100vw' // Fallback
  }
})

const gridColumns = computed(() => {
  try {
    return `${displayStore.sidebarLeftVw}vw calc(100vw - ${displayStore.sidebarLeftVw}vw - ${displayStore.sidebarRightVw}vw) ${displayStore.sidebarRightVw}vw`
  } catch (error) {
    console.error('Error in gridColumns:', error) // Log the error to fix unused error issue
    handleError(
      new Error('Grid column calculation failed'),
      'Error calculating grid columns',
      ErrorType.STORE_ERROR,
    )
    return '1fr' // Fallback
  }
})

// Computed properties for button visibility
const showLaunchButton = computed(() => {
  return (
    displayStore.showTutorial &&
    ['small', 'medium'].includes(displayStore.viewportSize)
  )
})

const showInstructionsButton = computed(() => {
  return (
    !displayStore.showTutorial &&
    ['small', 'medium'].includes(displayStore.viewportSize)
  )
})

// Function to set a custom --vh CSS variable to handle mobile devices like iPads
const setCustomVh = () => {
  try {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  } catch (error) {
    console.error('Error in setCustomVh:', error) // Log the error to fix unused error issue
    handleError(
      new Error('Setting custom vh failed'),
      'Error setting custom vh',
      ErrorType.STORE_ERROR,
    )
  }
}

onMounted(() => {
  try {
    displayStore.initialize()
    pitchStore.initializePitches()
    reactionStore.initializeReactions()
    console.log('Mounted: Initializing custom vh and display store')
    setCustomVh()

    if (!displayStore.isInitialized) {
      window.addEventListener('resize', setCustomVh)
      displayStore.initialize()
      console.log('displayStore initialized:', displayStore)
    }
  } catch (error) {
    console.error('Error in onMounted:', error) // Log the error to fix unused error issue
    handleError(
      new Error('Component mounting failed'),
      'Error during onMounted lifecycle',
      ErrorType.STORE_ERROR,
    )
  }
})

onBeforeUnmount(() => {
  try {
    window.removeEventListener('resize', setCustomVh)
    displayStore.removeViewportWatcher()
    console.log('Unmounting: Cleaned up event listeners')
  } catch (error) {
    console.error('Error in onBeforeUnmount:', error) // Log the error to fix unused error issue
    handleError(
      new Error('Component unmounting failed'),
      'Error during onBeforeUnmount lifecycle',
      ErrorType.STORE_ERROR,
    )
  }
})
</script>
