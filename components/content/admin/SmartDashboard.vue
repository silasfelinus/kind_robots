<template>
  <div>
    <component :is="currentDashboardComponent" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useToggleStore, ToggleableScreens, ScreenState } from '@/stores/toggleStore'

const toggleStore = useToggleStore()

// Load initial state from localStorage (if you haven't done this in the main entry file)
toggleStore.loadFromLocalStorage()

const toggleDashboardState = () => {
  toggleStore.toggleScreenState(ToggleableScreens.USER_DASHBOARD)
}

const currentDashboardComponent = computed(() => {
  const state = toggleStore.screenStates[ToggleableScreens.USER_DASHBOARD]
  return state === ScreenState.FULL ? 'DefaultDashboard' : 'MinimalDashboard'
})
</script>
