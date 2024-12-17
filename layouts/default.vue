<template>
  <div
    class="main-layout h-screen w-screen relative bg-base-300 overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <animation-loader />
      <milestone-popup />
    </div>

    <!-- Header -->
    <header
      class="fixed z-10 flex items-center justify-center box-border overflow-hidden transition-all duration-500 ease-in-out"
      :style="headerStyle"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Left Sidebar -->
    <aside
      class="fixed z-10 box-border rounded-2xl transition-all duration-300 ease-in-out overflow-visible"
      :style="leftSidebarStyle"
      style="background-color: rgba(0, 0, 0, 0.1)"
    >
      <kind-sidebar-simple
        v-if="sidebarLeftOpen"
        class="relative z-10 h-full rounded-2xl w-full"
      />
    </aside>

    <!-- Main Content -->
    <main
      class="fixed z-10 rounded-2xl box-border transition-all duration-600 ease-in-out"
      :style="mainContentStyle"
    >
      <slot /> <!-- Page content renders here -->
    </main>

    <!-- Footer -->
    <footer
      class="fixed z-10 box-border rounded-2xl overflow-visible transition-all duration-600 ease-in-out"
      :style="footerStyle"
      style="background-color: rgba(0, 0, 0, 0.2)"
    >
      <horizontal-nav v-if="footerOpen" class="h-full w-full z-5" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Use computed properties as in app.vue for styles
const headerStyle = computed(() => ({ ... }))
const leftSidebarStyle = computed(() => ({ ... }))
const mainContentStyle = computed(() => ({ ... }))
const footerStyle = computed(() => ({ ... }))

const footerOpen = computed(() => displayStore.footerState === 'open')
const sidebarLeftOpen = computed(() => ...)
</script>
