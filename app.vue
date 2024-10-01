<template>
  <div class="main-layout absolute inset-0 bg-base-300">
    <kind-loader></kind-loader>

    <!-- Header -->
    <header
      class="header-overlay bg-base-300 flex items-center justify-between w-full"
      :style="{ height: headerHeight }"
    >
      <div class="p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl"></sidebar-toggle>
      </div>

      <div class="flex-grow">
        <nav-links class="hidden sm:flex justify-center"></nav-links>
      </div>
    </header>

    <!-- Main content area (Grid column layout based on viewport and fullscreen status) -->
    <div
      class="content-area grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4"
      :style="{ height: mainHeight }"
    >
      <!-- Sidebar left -->
      <kind-sidebar-simple
        class="sidebar-left-overlay overflow-y-auto bg-base-300 hidden md:block"
        :style="{ width: sidebarLeftWidth, height: mainHeight }"
      ></kind-sidebar-simple>

      <!-- Main content -->
      <main
        class="main-content-overlay rounded-2xl bg-base-300 flex items-center justify-center"
        :style="{ height: mainHeight, width: mainWidth }"
      >
        <main-content />
      </main>

      <!-- Sidebar right -->
      <aside
        class="sidebar-right-overlay hidden md:block"
        :style="{ width: sidebarRightWidth, height: mainHeight }"
      ></aside>
    </div>

    <footer class="footer-overlay" :style="{ height: footerHeight }"></footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDisplayStore } from './stores/displayStore'
import { useErrorStore, ErrorType } from './stores/errorStore'

const displayStore = useDisplayStore()
const errorStore = useErrorStore()

// Computed layout properties
const headerHeight = computed(() => displayStore.headerHeight)
const mainHeight = computed(() => displayStore.mainHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const mainWidth = computed(() => displayStore.mainWidth)

// Initialization and error handling
onMounted(async () => {
  try {
    if (!displayStore.isInitialized) {
      await errorStore.handleError(
        async () => displayStore.initialize(),
        ErrorType.STORE_ERROR,
        'Error initializing display store',
      )
    }
  } catch (error) {
    errorStore.setError(
      ErrorType.STORE_ERROR,
      error instanceof Error ? error.message : 'Unknown error during mounting',
    )
  }
})
</script>

<style scoped>
.main-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  overflow: hidden;
}

.content-area {
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 1rem;
}

@media (min-width: 768px) {
  .content-area {
    grid-template-columns: auto 1fr auto;
  }
}

.header-overlay,
.sidebar-left-overlay,
.sidebar-right-overlay,
.main-content-overlay,
.footer-overlay {
  position: relative;
  text-align: center;
  padding: 0;
}

.main-content-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
