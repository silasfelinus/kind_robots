<template>
  <div id="app" class="flex flex-col h-screen w-screen bg-base-200">
    <!-- Loader -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-opacity-70"
    >
      <ami-loader />
    </div>

    <!-- Intro Component -->
    <div
      v-if="displayStore.showIntro"
      class="fixed inset-0 z-40 flex justify-center items-center bg-base-200 bg-opacity-70"
    >
      <IntroPage @finished="onIntroFinished" />
    </div>

    <!-- Header -->
    <header
      class="w-full z-30 bg-base-200 bg-opacity-60 flex justify-between items-center transition-all duration-500 ease-in-out flex-none"
      :style="{ height: `${displayStore.headerVh}vh` }"
    >
      <!-- Sidebar Toggle -->
      <div class="top-4 left-4 p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl" />
      </div>

      <!-- Navigation Links (Centered) -->
      <nav
        class="flex gap-2 items-center mx-auto text-center flex-wrap justify-center"
        style="min-width: 0"
      >
        <nuxt-link
          to="/"
          class="text-accent text-lg hover:underline whitespace-nowrap flex-shrink"
          >Kind Robots</nuxt-link
        >
        <nuxt-link
          to="/memory"
          class="text-accent text-lg hover:underline whitespace-nowrap flex-shrink"
          >Art</nuxt-link
        >
        <nuxt-link
          to="/botcafe"
          class="text-accent text-lg hover:underline whitespace-nowrap flex-shrink"
          >PromptBots</nuxt-link
        >
        <nuxt-link
          to="/amibot"
          class="text-accent text-lg hover:underline whitespace-nowrap flex-shrink"
          >AMI</nuxt-link
        >
      </nav>

      <!-- Intro Toggle Component -->
      <div class="top-4 right-4 p-1 z-50">
        <IntroToggle />
      </div>
    </header>

    <!-- Main Layout -->
    <div class="flex flex-1 w-full overflow-y-auto">
      <!-- Sidebar (Left) -->
      <aside>
        <kind-sidebar />
      </aside>

      <!-- Main Content with scrollable area -->
      <main class="flex-grow p-1 transition-all duration-500 ease-in-out">
        <transition name="fade" mode="out-in">
          <div
            v-if="!displayStore.showIntro"
            class="flex justify-center items-center"
          >
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useThemeStore } from '@/stores/themeStore'
import { useBotStore } from '@/stores/botStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const errorStore = useErrorStore()
const userStore = useUserStore()
const artStore = useArtStore()
const themeStore = useThemeStore()
const botStore = useBotStore()
const milestoneStore = useMilestoneStore()
const displayStore = useDisplayStore()

// Add a flag to prevent double triggers of onIntroFinished
const isProcessing = ref(false)

onMounted(async () => {
  try {
    await botStore.loadStore()
    await userStore.initializeUser()
    await artStore.init()
    await themeStore.initTheme()
    await milestoneStore.initializeMilestones()
    displayStore.loadState()
    displayStore.updateViewport()
    window.addEventListener('resize', displayStore.updateViewport)
    console.log('Initialization complete.')
  } catch (error) {
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', displayStore.updateViewport)
})

// Ensure onIntroFinished is only processed once
const onIntroFinished = () => {
  if (isProcessing.value) return

  isProcessing.value = true
  displayStore.changeState('headerState', 'open') // Ensure header state is updated
  displayStore.changeState('sidebarLeft', 'hidden') // Example of changing state
  displayStore.toggleIntroState() // Hides the intro

  setTimeout(() => {
    isProcessing.value = false // Reset after processing is done
  }, 300) // Adjust the time as per the animation length
}
</script>

<style>
.flex-1 {
  min-height: 0; /* Prevent flex overflow issue */
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>
