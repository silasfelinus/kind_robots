<template>
  <div id="app" class="flex flex-col h-full w-full bg-base-200">
    <!-- KindLoader -->
    <KindLoader @page-ready="handlePageReady" />

    <!-- Header -->
    <header
      class="w-full bg-base-200 flex justify-between items-center transition-all duration-500 ease-in-out"
      :style="{ height: `${displayStore.headerVh}vh` }"
    >
      <!-- Sidebar Toggle -->
      <div class="absolute top-4 left-4 p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl" />
      </div>

      <!-- Navigation Links (Refactored into its own component) -->
      <NavLinks />
    </header>

    <!-- Main Layout -->
    <div class="flex flex-1 w-full overflow-hidden">
      <!-- Sidebar (Left) -->
      <kind-sidebar />

      <!-- Main Content -->
      <div class="flex-grow flex justify-center items-center overflow-y-auto">
        <div class="w-full max-w-4xl rounded-2xl p-1 bg-base-200">
          <nuxt-page />
        </div>
      </div>
    </div>

    <!-- Footer (Positioned after scrolling through content) -->
    <footer
      v-if="displayStore.footer !== 'hidden'"
      :style="{ height: `${displayStore.footerVh}vh` }"
      class="flex-none w-full bg-gray-800 text-accent mt-auto"
    >
      created by Silas Knight silas@kindrobots.org
    </footer>
  </div>
</template>

<script setup>
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
</script>
