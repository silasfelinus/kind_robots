<template>
  <div id="app" class="flex flex-col h-screen w-screen overflow-hidden bg-base-200">
    <!-- Header -->
    <header
      v-if="isHeaderVisible"
      :class="['p-1 m-1 border border-accent bg-primary rounded-2xl', headerClass]"
      class="transition-all duration-300 flex justify-between items-center"
      @focus="setFocus('headerState')"
      @blur="clearFocus"
      tabindex="0"
    >
      <div class="bg-secondary p-4 w-full text-center">
        <h1 class="text-lg font-bold">Header Content</h1>
      </div>
      <button @click="toggle('headerState')" class="bg-accent p-2 rounded-lg">
        Toggle Header
      </button>
    </header>

    <!-- Main container with sidebars and content -->
    <div class="flex flex-grow overflow-hidden">
      <!-- Sidebar Left -->
      <aside
        v-if="isSidebarLeftVisible"
        :class="['p-1 m-1 border border-accent bg-primary rounded-2xl transition-all duration-300', sidebarLeftClass]"
        :style="{ width: sidebarLeftWidth }"
        @focus="setFocus('sidebarLeft')"
        @blur="clearFocus"
        tabindex="0"
      >
        <div class="bg-secondary p-4 text-center">
          <p class="font-bold">Sidebar Left Content</p>
        </div>
        <button @click="toggle('sidebarLeft')" class="bg-accent p-2 rounded-lg">
          Toggle Sidebar Left
        </button>
      </aside>

      <!-- Main content area -->
      <main
        :class="['flex-grow flex flex-col overflow-y-auto transition-all duration-300 p-1 m-1 border border-accent bg-primary rounded-2xl', mainContentClass]"
        @focus="setFocus('mainContent')"
        @blur="clearFocus"
        tabindex="0"
      >
        <div class="flex-grow bg-secondary p-4 text-center">
          <p class="font-bold">Main Content Area</p>
<display-toggler.vue />
        </div>
      </main>

      <!-- Sidebar Right -->
      <aside
        v-if="isSidebarRightVisible"
        :class="['p-1 m-1 border border-accent bg-primary rounded-2xl transition-all duration-300', sidebarRightClass]"
        :style="{ width: sidebarRightWidth }"
        @focus="setFocus('sidebarRight')"
        @blur="clearFocus"
        tabindex="0"
      >
        <div class="bg-secondary p-4 text-center">
          <p class="font-bold">Sidebar Right Content</p>
        </div>
        <button @click="toggle('sidebarRight')" class="bg-accent p-2 rounded-lg">
          Toggle Sidebar Right
        </button>
      </aside>
    </div>

    <!-- Bottom Drawer -->
    <div
      v-if="isBottomDrawerVisible"
      :class="['p-1 m-1 border border-accent bg-primary rounded-2xl transition-all duration-300', bottomDrawerClass]"
      @focus="setFocus('bottomDrawer')"
      @blur="clearFocus"
      tabindex="0"
    >
      <div class="bg-secondary p-4 text-center">
        <p class="font-bold">Bottom Drawer Content</p>
      </div>
      <button @click="toggle('bottomDrawer')" class="bg-accent p-2 rounded-lg">
        Toggle Bottom Drawer
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/display'

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
  return displayStore.sidebarLeft === 'open' ? '25vw' : '0'
})

const sidebarRightWidth = computed(() => {
  return displayStore.sidebarRight === 'open' ? '25vw' : '0'
})

// Computed properties for dynamic classes and visibility
const isHeaderVisible = computed(() => displayStore.headerState !== 'hidden')
const isSidebarLeftVisible = computed(() => displayStore.sidebarLeft !== 'hidden')
const isSidebarRightVisible = computed(() => displayStore.sidebarRight !== 'hidden')
const isBottomDrawerVisible = computed(() => displayStore.bottomDrawer !== 'hidden')

// Dynamic classes based on display state
const headerClass = computed(() => {
  return {
    'h-16': displayStore.headerState === 'open',
    'h-8': displayStore.headerState === 'compact',
    'hidden': displayStore.headerState === 'hidden',
  }
})

const sidebarLeftClass = computed(() => {
  return {
    'w-64': displayStore.sidebarLeft === 'open',
    'w-24': displayStore.sidebarLeft === 'compact',
    'hidden': displayStore.sidebarLeft === 'hidden',
  }
})

const sidebarRightClass = computed(() => {
  return {
    'w-64': displayStore.sidebarRight === 'open',
    'w-24': displayStore.sidebarRight === 'compact',
    'hidden': displayStore.sidebarRight === 'hidden',
  }
})

const bottomDrawerClass = computed(() => {
  return {
    'h-16': displayStore.bottomDrawer === 'open',
    'h-8': displayStore.bottomDrawer === 'compact',
    'hidden': displayStore.bottomDrawer === 'hidden',
  }
})

// Main content adapts based on sidebar visibility
const mainContentClass = computed(() => {
  return {
    'ml-0': displayStore.sidebarLeft === 'hidden',
    'mr-0': displayStore.sidebarRight === 'hidden',
    'ml-64': displayStore.sidebarLeft === 'open',
    'mr-64': displayStore.sidebarRight === 'open',
  }
})
</script>

<style scoped>
/* Any custom styles not handled by Tailwind */
</style>
