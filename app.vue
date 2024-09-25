<template>
  <div id="app" :style="{ height: '100vh', width: '100vw', backgroundColor: 'var(--base-200)' }">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isPageReady" @page-ready="handlePageReady" />

    <!-- Header -->
    <header
      :style="{ height: `${displayStore.headerVh}vh`, width: '100vw', backgroundColor: 'var(--base-200)', position: 'sticky', top: 0, zIndex: 30 }"
    >
      <!-- Sidebar Toggle -->
      <div class="absolute top-4 left-4 p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl" />
      </div>

      <nav-links />

      <!-- Tutorial and Back Buttons -->
      <button
        v-if="showTutorial"
        class="fixed top-4 right-4 bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-50 px-4 py-2"
        @click="toggleTutorial"
      >
        Launch
      </button>

      <button
        v-else
        class="fixed top-4 right-4 bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-50 px-4 py-2"
        @click="toggleTutorial"
      >
        <span>Instructions</span>
      </button>
    </header>

    <!-- Main Layout Wrapper -->
    <div :style="{ width: '100vw', height: `calc(100vh - ${displayStore.headerVh}vh - ${displayStore.footerVh}vh)` }">
      <!-- Left Sidebar -->
      <kind-sidebar-simple :style="{ width: `${displayStore.sidebarLeftWidth}vw`, height: '100%' }" />

      <!-- Main Content Area -->
      <main :style="{ width: `${displayStore.mainVw}vw`, height: '100%', padding: '2rem', overflow: 'hidden' }">
        <MainScreen>
          <div :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }">
            <div
              class="w-full max-w-5xl rounded-2xl bg-base-200 relative flip-card shadow-lg"
              :style="{
                height: `${displayStore.mainVh}vh`,
                width: `${displayStore.mainVw}vw`,
                paddingRight: '2rem',
                overflow: 'hidden',
              }"
            >
              <div class="flip-card-inner" :class="{ 'is-flipped': !showTutorial }">
                <!-- Front side: Splash Tutorial -->
                <div class="flip-card-front">
                  <SplashTutorial />
                </div>

                <!-- Back side: NuxtPage content -->
                <div class="flip-card-back">
                  <NuxtPage />
                </div>
              </div>
            </div>
          </div>
        </MainScreen>
      </main>

      <!-- Right Sidebar -->
      <kind-sidebar-right :style="{ width: `${displayStore.sidebarRightWidth}vw`, height: '100%' }" />
    </div>

    <!-- Footer -->
    <kind-footer
      :style="{ height: `${displayStore.footerVh}vh`, width: '100vw' }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize stores and states
const displayStore = useDisplayStore()
const showTutorial = ref(true)
const router = useRouter()

// Combine isPageReady and isKindLoaderInitialized logic into one
const isPageReady = ref(false)

// Handle when page is ready
const handlePageReady = (ready: boolean) => {
  isPageReady.value = ready
}

// Toggle between tutorial and main content
const toggleTutorial = () => {
  showTutorial.value = !showTutorial.value
}

// Auto-reset tutorial on route changes if needed
router.beforeEach((to, from, next) => {
  showTutorial.value = true
  next()
})

onMounted(() => {
  displayStore.initializeViewportWatcher()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>

<style scoped>
.flip-card {
  width: 100%;
  height: 100%;
  perspective: 1000px; /* Creates depth for the flip effect */
}

.flip-card-inner {
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg); /* Flips the entire card horizontally */
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden; /* Hides the backside during rotation */
  border-radius: 12px;
}

.flip-card-front {
  z-index: 2; /* Ensures the front side is on top */
}

.flip-card-back {
  transform: rotateY(180deg); /* Ensures the back side starts flipped */
}
</style>
