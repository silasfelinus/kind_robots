<template>
  <div id="app" class="flex flex-col min-h-screen w-full bg-base-200">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isKindLoaderInitialized" @page-ready="handlePageReady" />

    <!-- Main content is displayed only when the page is ready -->
    <div v-if="isPageReady">
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

        <!-- Page Info Toggle (on the right side of the header) -->
        <div class="absolute top-4 right-4 p-1 z-40">
          <PageInfo />
        </div>
      </header>

      <!-- Main Layout -->
      <div class="flex-1 w-full flex">
        <kind-sidebar-simple />
        <main class="flex-grow overflow-y-auto relative">
          <div class="flex justify-center items-center">
            <div class="w-full max-w-4xl rounded-2xl bg-base-200 relative">
              <!-- Conditional rendering of tutorial or page content -->
              <SplashTutorial
                v-if="showTutorial"
                @page-transition="handlePageTransition"
              />
              <NuxtPage v-else />
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
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import SplashTutorial from '@/components/SplashTutorial.vue'

// Track whether the KindLoader has been initialized
const isKindLoaderInitialized = ref(false)
const displayStore = useDisplayStore()
const isPageReady = ref(false)

// Control for tutorial visibility
const showTutorial = ref(true)

const handlePageReady = (ready) => {
  isPageReady.value = ready
  if (ready) {
    isKindLoaderInitialized.value = true
  }
}

const handlePageTransition = () => {
  // Transition from tutorial to Nuxt page content
  showTutorial.value = false
}

onMounted(() => {
  displayStore.initializeViewportWatcher()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>

<style scoped>
main {
  overflow-y: auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
