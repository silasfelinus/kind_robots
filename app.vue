<template>
  <div id="app" class="flex flex-col h-full w-full bg-base-200">
    <!-- KindLoader -->
    <KindLoader @page-ready="handlePageReady" />

    <!-- Header -->
    <header
      class="w-full bg-base-200 bg-opacity-60 flex justify-between items-center transition-all duration-500 ease-in-out"
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
      <aside>
        <kind-sidebar />
      </aside>

      <!-- Main Content with scrollable area -->
      <main
        class="flex-grow overflow-y-auto p-1 transition-all duration-500 ease-in-out"
      >
        <transition name="fade" mode="out-in">
          <div v-if="pageReady" class="flex justify-center items-center">
            <div class="w-full max-w-4xl rounded-2xl p-1 bg-base-200">
              <nuxt-page />
            </div>
          </div>
        </transition>
      </main>
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
import NavLinks from '@/components/NavLinks.vue'
import { ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const pageReady = ref(false) // This will now be set by the KindLoader component

// Method to handle the event emitted from KindLoader
function handlePageReady(isReady) {
  pageReady.value = isReady
}
</script>

<style>
html,
body,
#app {
  height: 100%;
}
</style>
