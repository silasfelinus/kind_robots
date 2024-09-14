<template>
  <div
    id="app"
    class="flex flex-col h-screen w-screen overflow-hidden bg-base-400 relative"
  >
    <!-- Ami-loader as an overlay, hidden once intro starts -->
    <div v-if="!showIntro" class="absolute top-0 left-0 w-full h-full z-50">
      <ami-loader />
    </div>

    <!-- Special Intro Section -->
    <div
      v-if="showIntro"
      class="absolute top-0 left-0 w-full h-full z-40 bg-accent flex flex-col justify-center items-center p-4"
    >
      <img src="/images/intro/welcome.webp" alt="Intro Image" class="mb-4" />
      <h1 class="text-xl font-bold mb-2">Welcome to Kind Robots</h1>
      <p class="text-center mb-4">
        At Kind Robots, we bring people and AI together to do amazing things.
      </p>
      <p class="text-center mb-4">
        Create art with AI. Let your mind explore and see what our tools can do
        for you.
      </p>
      <p class="text-center mb-4">
        Bring your ideas to life. Our AI helps shape your thoughts into action.
      </p>
      <p class="text-center">
        Let’s work together to make the world better. Every idea can help shape
        the future.
      </p>
      <button
        class="bg-primary p-2 rounded-xl mt-4"
        aria-label="Start the Experience"
        @click="handleIntroClick"
      >
        Let's Begin
      </button>
    </div>

    <!-- Header -->
    <header
      v-if="isHeaderVisible"
      :class="[
        headerClass,
        'transition-all duration-300 flex justify-between items-center',
      ]"
      tabindex="0"
      @focus="setFocus('headerState')"
      @blur="clearFocus"
    >
      <div class="bg-primary p-2 w-full text-center rounded-xl relative">
        <h1 class="text-lg font-bold">Kind Robots</h1>
      </div>
    </header>

    <!-- Main container with sidebars and content -->
    <div
      class="flex flex-grow overflow-hidden gap-2"
      :style="{ height: mainContentHeight }"
    >
      <!-- Sidebar Left -->
      <aside
        v-if="isSidebarLeftVisible"
        :class="['transition-all duration-300', sidebarLeftClass]"
        :style="{ width: sidebarWidth(displayStore.sidebarLeft) }"
        tabindex="0"
        @focus="setFocus('sidebarLeft')"
        @blur="clearFocus"
      >
        <div class="p-2 text-center text-secondary rounded-2xl relative">
          <p class="font-bold">Create Art</p>
          <p class="text-sm">Use AI to make stunning art.</p>
        </div>
      </aside>

      <!-- Main content area -->
      <main
        :class="[mainContentClass]"
        tabindex="0"
        @focus="setFocus('mainContent')"
        @blur="clearFocus"
      >
        <div class="flex-grow text-secondary p-2 m-2 text-center rounded-2xl">
          <p class="font-bold">Develop Ideas</p>
          <p class="text-sm">Use AI to explore new ideas.</p>
          <nuxt-page />
        </div>
      </main>

      <!-- Sidebar Right -->
      <aside
        v-if="isSidebarRightVisible"
        :class="['transition-all duration-300', sidebarRightClass]"
        :style="{ width: sidebarWidth(displayStore.sidebarRight) }"
        tabindex="0"
        @focus="setFocus('sidebarRight')"
        @blur="clearFocus"
      >
        <div class="bg-secondary p-2 text-center rounded-xl relative">
          <p class="font-bold">Make the World Better</p>
          <p class="text-sm">Work with us to build a brighter future.</p>
        </div>
      </aside>
    </div>

    <!-- Footer -->
    <footer
      v-if="isFooterVisible"
      :class="['transition-all duration-300', footerClass]"
      tabindex="0"
      @focus="setFocus('footer')"
      @blur="clearFocus"
    >
      <div class="bg-secondary p-4 text-center rounded-xl relative">
        <p class="font-bold">Join the Community</p>
        <p class="text-sm">Connect with others and grow with us.</p>
      </div>
    </footer>

    <!-- Intro Toggle Icon -->
    <div
      v-if="!showIntro && allSectionsFocused"
      class="absolute bottom-0 right-0 p-2 m-4 bg-accent text-white rounded-full cursor-pointer"
      aria-label="Toggle Intro"
      @click="toggleIntroState"
    >
      <icon name="toggle_intro" class="text-2xl" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

onMounted(() => {
  displayStore.loadState() // Load the state from localStorage when the component is mounted
})

const showIntro = computed(() => displayStore.showIntro)
const allSectionsFocused = computed(() => displayStore.allSectionsFocused)

const handleIntroClick = () => {
  displayStore.toggleIntroState()
}

// Handle focus state to dynamically control which container has priority
const setFocus = (container) => {
  displayStore.setFocus(container)
}

const clearFocus = () => {
  displayStore.clearFocus()
}

// Dynamic sidebar width based on state
const sidebarWidth = (state) => {
  return state === 'open' ? '20vw' : '5vw'
}

// Dynamic classes based on display state
const headerClass = computed(() => ({
  'h-20': displayStore.headerState === 'open',
  'h-10': displayStore.headerState === 'compact',
}))

const footerClass = computed(() => ({
  'h-20': displayStore.footer === 'open',
  'h-10': displayStore.footer === 'compact',
}))

const mainContentHeight = computed(() => {
  return displayStore.mainContentFocused ? '75vh' : 'calc(80vh - 10vh)'
})

const mainContentClass = computed(() => ({
  'ml-0': displayStore.sidebarLeft === 'hidden',
  'mr-0': displayStore.sidebarRight === 'hidden',
  'ml-[20vw]': displayStore.sidebarLeft === 'open',
  'mr-[20vw]': displayStore.sidebarRight === 'open',
}))
</script>

<style>
.transition-all {
  transition:
    width 0.3s ease,
    height 0.3s ease;
}
</style>
