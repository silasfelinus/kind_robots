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
        At Kind Robots, we believe that humans and AI can be best friends—like
        peanut butter and jelly, but cooler. 🌐🤖
      </p>
      <p class="text-center mb-4">
        Our mission? To create a social space where you can unleash your
        creativity with a little help from our robot friends. Whether it's
        crafting stories that tug at the heartstrings or generating epic
        artwork, our AI-powered tools are here to assist you in making something
        awesome.
      </p>
      <p class="text-center mb-4">
        We're all about human-AI positivity. Because why shouldn't robots help
        us make the world a better place? Together, we're shaping a community
        where every interaction leads to new ideas, more art, and a lot of
        fun—no evil robot overlords here! (We promise. 😎)
      </p>
      <p class="text-center">
        So click that button and let’s start creating! You bring the ideas, and
        our AI will sprinkle in a little magic. Let’s go! 🚀
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
        <h1 class="text-lg font-bold">Header Content</h1>
        <img
          src="/images/intro/welcome.webp"
          alt="Header Image"
          class="absolute top-0 left-0 w-full h-full object-cover opacity-50"
        />
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
          <p class="font-bold">Sidebar Left Content</p>
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
          <p class="font-bold">Main Content Area</p>
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
          <p class="font-bold">Sidebar Right Content</p>
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
        <p class="font-bold">Footer Content</p>
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
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

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
