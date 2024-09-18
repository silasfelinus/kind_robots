<template>
  <div id="app" class="flex flex-col min-h-screen w-full bg-base-200">
    <!-- KindLoader -->
    <KindLoader @page-ready="handlePageReady" />

    <!-- Header -->
    <header
      class="w-full bg-base-200 flex justify-between items-center transition-all duration-500 ease-in-out sticky top-0 z-30"
      :style="{ height: `${displayStore.headerVh}vh` }"
    >
      <!-- Sidebar Toggle -->
      <div class="absolute top-4 left-4 p-1 z-40 text-white">
        <sidebar-toggle
          class="text-4xl"
          @click="displayStore.toggleSidebar('sidebarLeft')"
        />
      </div>

      <!-- Navigation Links -->
      <NavLinks />
    </header>

    <!-- Main Layout -->
    <div class="flex-1 w-full flex overflow-hidden">
      <!-- Sidebar (Left) -->
      <aside
        class="sticky top-0 flex-shrink-0 overflow-y-auto transition-all duration-300"
        :style="{ maxHeight: `calc(100vh - ${displayStore.headerVh}vh)` }"
      >
        <kind-sidebar />
      </aside>

      <!-- Main Content with scrollable area -->
      <main class="flex-grow overflow-y-auto">
        <div class="flex justify-center items-center">
          <div class="w-full max-w-4xl rounded-2xl p-1 bg-base-200">
            <nuxt-page />
          </div>
        </div>
      </main>
    </div>

    <!-- Footer (Stick to Bottom) -->
    <footer
      v-if="displayStore.footer !== 'hidden'"
      :style="{ height: `${displayStore.footerVh}vh` }"
      class="w-full bg-gray-800 text-accent mt-auto flex-none"
    >
      created by Silas Knight silas@kindrobots.org
    </footer>
  </div>
</template>

<script setup>
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
</script>

<style scoped>
/* Ensure the main content does not overflow, and the layout scrolls as expected */
.flex-1 {
  min-height: 0; /* Flexbox fix for height calculation */
}

.sticky {
  position: -webkit-sticky;
  position: sticky;
}

aside {
  transition: width 0.3s ease-in-out; /* Smooth transition for sidebar width */
}
</style>
