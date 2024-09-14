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
