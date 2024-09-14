<template>
  <div
    id="app"
    class="flex flex-col h-screen w-screen overflow-hidden bg-base-400 relative"
  >
    <!-- Ami-loader as an overlay -->
    <div class="absolute top-0 left-0 w-full h-full z-50">
      <ami-loader />
    </div>

    <!-- Special Intro Section -->
    <div
      v-if="showIntro"
      class="absolute top-0 left-0 w-full h-full z-40 bg-accent flex flex-col justify-center items-center p-4"
    >
      <img src="/images/intro/welcome.webp" alt="Intro Image" class="mb-4" />
      <h1 class="text-xl font-bold mb-2">Welcome to Kind Robots</h1>
      <p class="text-center">Click anywhere to start the experience.</p>
      <button class="bg-primary p-2 rounded-xl mt-4" @click="handleIntroClick">
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
      style="height: calc(10vh)"
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
      style="height: calc(80vh)"
    >
      <!-- Sidebar Left -->
      <aside
        v-if="isSidebarLeftVisible"
        :class="['transition-all duration-300', sidebarLeftClass]"
        :style="{ width: sidebarLeftWidth }"
        tabindex="0"
        style="height: 100%"
        @focus="setFocus('sidebarLeft')"
        @blur="clearFocus"
      >
        <div class="p-2 text-center text-secondary rounded-2xl relative">
          <p class="font-bold">Sidebar Left Content</p>
          <img
            src="/images/intro/words.webp"
            alt="Sidebar Left Image"
            class="absolute top-0 left-0 w-full h-full object-cover opacity-50"
          />
        </div>
        <button
          class="bg-accent p-2 rounded-2xl mt-4"
          @click="toggle('sidebarLeft')"
        >
          Toggle Sidebar Left
        </button>
      </aside>

      <!-- Main content area -->
      <main
        :class="[
          'flex-grow flex flex-col overflow-y-auto transition-all duration-300 p-2 bg-primary rounded-2xl',
          mainContentClass,
        ]"
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
        :style="{ width: sidebarRightWidth }"
        tabindex="0"
        style="height: 100%"
        @focus="setFocus('sidebarRight')"
        @blur="clearFocus"
      >
        <div class="bg-secondary p-2 text-center rounded-xl relative">
          <p class="font-bold">Sidebar Right Content</p>
          <img
            src="/images/intro/art1.webp"
            alt="Sidebar Right Image"
            class="absolute top-0 left-0 w-full h-full object-cover opacity-50"
          />
        </div>
        <button
          class="bg-accent p-2 rounded-lg mt-4"
          @click="toggle('sidebarRight')"
        >
          Toggle Sidebar Right
        </button>
      </aside>
    </div>

    <!-- Footer -->
    <footer
      v-if="isFooterVisible"
      :class="['transition-all duration-300', footerClass]"
      tabindex="0"
      style="height: calc(10vh)"
      @focus="setFocus('footer')"
      @blur="clearFocus"
    >
      <div class="bg-secondary p-4 text-center rounded-xl relative">
        <p class="font-bold">Footer Content</p>
        <img
          src="/images/intro/footer.webp"
          alt="Footer Image"
          class="absolute top-0 left-0 w-full h-full object-cover opacity-50"
        />
      </div>
      <button class="bg-accent p-2 rounded-lg mt-4" @click="toggle('footer')">
        Toggle Footer
      </button>
    </footer>

    <!-- Intro Toggle Icon -->
    <div
      v-if="!showIntro && allSectionsFocused"
      class="absolute bottom-0 right-0 p-2 m-4 bg-accent text-white rounded-full cursor-pointer"
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

// Toggle function for each container
const toggle = (container) => {
  const state = displayStore[container] === 'open' ? 'hidden' : 'open'
  displayStore.changeState(container, state)
}

// Sidebar widths dynamically calculated based on state and orientation
const sidebarLeftWidth = computed(() => {
  return displayStore.sidebarLeft === 'open'
    ? '20vw'
    : displayStore.sidebarLeft === 'compact'
      ? '10vw'
      : '0'
})

const sidebarRightWidth = computed(() => {
  return displayStore.sidebarRight === 'open'
    ? '20vw'
    : displayStore.sidebarRight === 'compact'
      ? '10vw'
      : '0'
})

// Computed properties for dynamic classes and visibility
const isHeaderVisible = computed(() => displayStore.headerState !== 'hidden')
const isSidebarLeftVisible = computed(
  () => displayStore.sidebarLeft !== 'hidden',
)
const isSidebarRightVisible = computed(
  () => displayStore.sidebarRight !== 'hidden',
)
const isFooterVisible = computed(() => displayStore.footer !== 'hidden')

// Dynamic classes based on display state
const headerClass = computed(() => {
  return {
    'h-20': displayStore.headerState === 'open',
    'h-10': displayStore.headerState === 'compact',
    hidden: displayStore.headerState === 'hidden',
  }
})

const sidebarLeftClass = computed(() => {
  return {
    hidden: displayStore.sidebarLeft === 'hidden',
    'w-20vw': displayStore.sidebarLeft === 'open',
    'w-10vw': displayStore.sidebarLeft === 'compact',
  }
})

const sidebarRightClass = computed(() => {
  return {
    hidden: displayStore.sidebarRight === 'hidden',
    'w-20vw': displayStore.sidebarRight === 'open',
    'w-10vw': displayStore.sidebarRight === 'compact',
  }
})

const footerClass = computed(() => {
  return {
    'h-20': displayStore.footer === 'open',
    'h-10': displayStore.footer === 'compact',
    hidden: displayStore.footer === 'hidden',
  }
})

const mainContentClass = computed(() => {
  return {
    'ml-0': displayStore.sidebarLeft === 'hidden',
    'mr-0': displayStore.sidebarRight === 'hidden',
    'ml-[20vw]': displayStore.sidebarLeft === 'open',
    'mr-[20vw]': displayStore.sidebarRight === 'open',
    'ml-[10vw]': displayStore.sidebarLeft === 'compact',
    'mr-[10vw]': displayStore.sidebarRight === 'compact',
  }
})
</script>
