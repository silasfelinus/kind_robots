<template>
  <div id="app" class="flex flex-col h-screen w-screen overflow-hidden bg-base-400">
    <!-- Header -->
    <header
      v-if="isHeaderVisible"
      :class="['transition-all duration-300 flex justify-between items-center', headerClass]"
      @focus="setFocus('headerState')"
      @blur="clearFocus"
      tabindex="0"
      style="height: calc(10vh);" 
    >
      <div class="bg-primary p-2 w-full text-center rounded-xl">
        <h1 class="text-lg font-bold">Header Content</h1>
      </div>
    </header>
<ami-loader />

    <!-- Main container with sidebars and content -->
    <div class="flex flex-grow overflow-hidden gap-2" style="height: calc(80vh);">
      <!-- Sidebar Left -->
      <aside
        v-if="isSidebarLeftVisible"
        :class="['transition-all duration-300', sidebarLeftClass]"
        :style="{ width: sidebarLeftWidth }"
        @focus="setFocus('sidebarLeft')"
        @blur="clearFocus"
        tabindex="0"
        style="height: 100%;" 
      >
        <div class="p-2 text-center text-secondary rounded-2xl">
          <p class="font-bold">Sidebar Left Content</p>
        </div>
        <button @click="toggle('sidebarLeft')" class="bg-accent p-2 rounded-2xl mt-4">
          Toggle Sidebar Left
        </button>
      </aside>

      <!-- Main content area -->
      <main
        :class="['flex-grow flex flex-col overflow-y-auto transition-all duration-300 p-2 bg-primary rounded-2xl', mainContentClass]"
        @focus="setFocus('mainContent')"
        @blur="clearFocus"
        tabindex="0"
        style="min-width: 50%;" 
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
        @focus="setFocus('sidebarRight')"
        @blur="clearFocus"
        tabindex="0"
        style="height: 100%;" 
      >
        <div class="bg-secondary p-2 text-center rounded-xl">
          <p class="font-bold">Sidebar Right Content</p>
        </div>
        <button @click="toggle('sidebarRight')" class="bg-accent p-2 rounded-lg mt-4">
          Toggle Sidebar Right
        </button>
      </aside>
    </div>

    <!-- Bottom Drawer -->
    <div
      v-if="isBottomDrawerVisible"
      :class="['transition-all duration-300', bottomDrawerClass]"
      @focus="setFocus('bottomDrawer')"
      @blur="clearFocus"
      tabindex="0"
      style="height: calc(10vh);" 
    >
      <div class="bg-secondary p-4 text-center rounded-xl">
        <p class="font-bold">Bottom Drawer Content</p>
      </div>
      <button @click="toggle('bottomDrawer')" class="bg-accent p-2 rounded-lg mt-4">
        Toggle Bottom Drawer
      </button>
    </div>
  </div>
</template>



<script setup>
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

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
  return displayStore.sidebarLeft === 'open' ? '20vw' : displayStore.sidebarLeft === 'compact' ? '10vw' : '0'
})

const sidebarRightWidth = computed(() => {
  return displayStore.sidebarRight === 'open' ? '20vw' : displayStore.sidebarRight === 'compact' ? '10vw' : '0'
})

// Computed properties for dynamic classes and visibility
const isHeaderVisible = computed(() => displayStore.headerState !== 'hidden')
const isSidebarLeftVisible = computed(() => displayStore.sidebarLeft !== 'hidden')
const isSidebarRightVisible = computed(() => displayStore.sidebarRight !== 'hidden')
const isBottomDrawerVisible = computed(() => displayStore.bottomDrawer !== 'hidden')

// Dynamic classes based on display state
const headerClass = computed(() => {
  return {
    'h-20': displayStore.headerState === 'open',
    'h-10': displayStore.headerState === 'compact',
    'hidden': displayStore.headerState === 'hidden',
  }
})

const sidebarLeftClass = computed(() => {
  return {
    'hidden': displayStore.sidebarLeft === 'hidden',
    'w-20vw': displayStore.sidebarLeft === 'open',
    'w-10vw': displayStore.sidebarLeft === 'compact',
  }
})

const sidebarRightClass = computed(() => {
  return {
    'hidden': displayStore.sidebarRight === 'hidden',
    'w-20vw': displayStore.sidebarRight === 'open',
    'w-10vw': displayStore.sidebarRight === 'compact',
  }
})

const bottomDrawerClass = computed(() => {
  return {
    'h-20': displayStore.bottomDrawer === 'open',
    'h-10': displayStore.bottomDrawer === 'compact',
    'hidden': displayStore.bottomDrawer === 'hidden',
  }
})

const mainContentClass = computed(() => {
  return {
    'ml-0': displayStore.sidebarLeft === 'hidden',
    'mr-0': displayStore.sidebarRight === 'hidden',
    'ml-20vw': displayStore.sidebarLeft === 'open',
    'mr-20vw': displayStore.sidebarRight === 'open',
  }
})
</script>
