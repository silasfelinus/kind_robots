<template>
  <div class="bg-base-200 p-4 border rounded-2xl shadow-md">
    <h2 class="text-lg font-bold text-center mb-4">Display Tester</h2>

    <div class="flex flex-wrap justify-around gap-4">
      <!-- Header State Control -->
      <div class="bg-primary p-4 border border-accent rounded-2xl text-center">
        <h3 class="font-bold mb-2">Header</h3>
        <button
          class="bg-accent p-2 rounded-lg mb-2 flex items-center justify-center"
          @click="toggle('headerState')"
        >
          <Icon name="eye" class="mr-2" /> Toggle Header
        </button>
        <div class="flex justify-around mt-2">
          <button
            :class="[
              'p-2 rounded-lg flex items-center',
              isActive('headerState', 'open') ? 'bg-success' : 'bg-accent',
            ]"
            @click="changeState('headerState', 'open')"
          >
            <Icon name="arrow-up-circle" class="mr-2" /> Open
          </button>
          <button
            :class="[
              'p-2 rounded-lg flex items-center',
              isActive('headerState', 'compact') ? 'bg-warning' : 'bg-accent',
            ]"
            @click="changeState('headerState', 'compact')"
          >
            <Icon name="minimize" class="mr-2" /> Compact
          </button>
          <button
            :class="[
              'p-2 rounded-lg flex items-center',
              isActive('headerState', 'hidden') ? 'bg-error' : 'bg-accent',
            ]"
            @click="changeState('headerState', 'hidden')"
          >
            <Icon name="eye-off" class="mr-2" /> Hidden
          </button>
        </div>
      </div>

      <!-- Sidebar Left State Control -->
      <div class="bg-primary p-4 border border-accent rounded-2xl text-center">
        <h3 class="font-bold mb-2">Sidebar Left</h3>
        <button
          class="bg-accent p-2 rounded-lg mb-2 flex items-center justify-center"
          @click="toggle('sidebarLeft')"
        >
          <Icon name="eye" class="mr-2" /> Toggle Sidebar Left
        </button>
        <div class="flex justify-around mt-2">
          <button
            :class="[
              'p-2 rounded-lg flex items-center',
              isActive('sidebarLeft', 'open') ? 'bg-success' : 'bg-accent',
            ]"
            @click="changeState('sidebarLeft', 'open')"
          >
            <Icon name="arrow-up-circle" class="mr-2" /> Open
          </button>
          <button
            :class="[
              'p-2 rounded-lg flex items-center',
              isActive('sidebarLeft', 'compact') ? 'bg-warning' : 'bg-accent',
            ]"
            @click="changeState('sidebarLeft', 'compact')"
          >
            <Icon name="minimize" class="mr-2" /> Compact
          </button>
          <button
            :class="[
              'p-2 rounded-lg flex items-center',
              isActive('sidebarLeft', 'hidden') ? 'bg-error' : 'bg-accent',
            ]"
            @click="changeState('sidebarLeft', 'hidden')"
          >
            <Icon name="eye-off" class="mr-2" /> Hidden
          </button>
        </div>
      </div>

      <!-- Sidebar Right State Control -->
      <div class="bg-primary p-4 border border-accent rounded-2xl text-center">
        <h3 class="font-bold mb-2">Sidebar Right</h3>
        <button
          class="bg-accent p-2 rounded-lg mb-2 flex items-center justify-center"
          @click="toggle('sidebarRight')"
        >
          <Icon name="eye" class="mr-2" /> Toggle Sidebar Right
        </button>
        <div class="flex justify-around mt-2">
          <button
            :class="[
              'p-2 rounded-lg flex items-center',
              isActive('sidebarRight', 'open') ? 'bg-success' : 'bg-accent',
            ]"
            @click="changeState('sidebarRight', 'open')"
          >
            <Icon name="arrow-up-circle" class="mr-2" /> Open
          </button>
          <button
            :class="[
              'p-2 rounded-lg flex items-center',
              isActive('sidebarRight', 'compact') ? 'bg-warning' : 'bg-accent',
            ]"
            @click="changeState('sidebarRight', 'compact')"
          >
            <Icon name="minimize" class="mr-2" /> Compact
          </button>
          <button
            :class="[
              'p-2 rounded-lg flex items-center',
              isActive('sidebarRight', 'hidden') ? 'bg-error' : 'bg-accent',
            ]"
            @click="changeState('sidebarRight', 'hidden')"
          >
            <Icon name="eye-off" class="mr-2" /> Hidden
          </button>
        </div>
      </div>

      <!-- Bottom Drawer State Control -->
      <div class="bg-primary p-4 border border-accent rounded-2xl text-center">
        <h3 class="font-bold mb-2">Bottom Drawer</h3>
        <button
          class="bg-accent p-2 rounded-lg mb-2 flex items-center justify-center"
          @click="toggle('bottomDrawer')"
        >
          <Icon name="eye" class="mr-2" /> Toggle Bottom Drawer
        </button>
        <div class="flex justify-around mt-2">
          <button
            :class="[
              'p-2 rounded-lg flex items-center',
              isActive('bottomDrawer', 'open') ? 'bg-success' : 'bg-accent',
            ]"
            @click="changeState('bottomDrawer', 'open')"
          >
            <Icon name="arrow-up-circle" class="mr-2" /> Open
          </button>
          <button
            :class="[
              'p-2 rounded-lg flex items-center',
              isActive('bottomDrawer', 'compact') ? 'bg-warning' : 'bg-accent',
            ]"
            @click="changeState('bottomDrawer', 'compact')"
          >
            <Icon name="minimize" class="mr-2" /> Compact
          </button>
          <button
            :class="[
              'p-2 rounded-lg flex items-center',
              isActive('bottomDrawer', 'hidden') ? 'bg-error' : 'bg-accent',
            ]"
            @click="changeState('bottomDrawer', 'hidden')"
          >
            <Icon name="eye-off" class="mr-2" /> Hidden
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Toggle function to switch between open/hidden states
const toggle = (container) => {
  const state = displayStore[container] === 'open' ? 'hidden' : 'open'
  displayStore.changeState(container, state)
}

// Change state function for more specific control
const changeState = (container, state) => {
  displayStore.changeState(container, state)
}

// Check if the current state is active
const isActive = (container, state) => {
  return displayStore[container] === state
}
</script>

<style scoped>
/* Custom styling for DisplayToggler */
button:focus {
  outline: none;
}
</style>
