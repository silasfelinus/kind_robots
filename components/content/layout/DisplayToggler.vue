<template>
  <div class="bg-base-300 p-4 border rounded-2xl shadow-md">
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
              isActive('headerState', 'open') ? 'bg-success' : 'bg-accent',
              'p-2 rounded-lg flex items-center',
            ]"
            @click="changeState('headerState', 'open')"
          >
            <Icon name="arrow-up-circle" class="mr-2" /> Open
          </button>
          <button
            :class="[
              isActive('headerState', 'compact') ? 'bg-warning' : 'bg-accent',
              'p-2 rounded-lg flex items-center',
            ]"
            @click="changeState('headerState', 'compact')"
          >
            <Icon name="minimize" class="mr-2" /> Compact
          </button>
          <button
            :class="[
              isActive('headerState', 'hidden') ? 'bg-error' : 'bg-accent',
              'p-2 rounded-lg flex items-center',
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
          @click="toggle('sidebarLeftState')"
        >
          <Icon name="eye" class="mr-2" /> Toggle Sidebar Left
        </button>
        <div class="flex justify-around mt-2">
          <button
            :class="[
              isActive('sidebarLeftState', 'open') ? 'bg-success' : 'bg-accent',
              'p-2 rounded-lg flex items-center',
            ]"
            @click="changeState('sidebarLeftState', 'open')"
          >
            <Icon name="arrow-up-circle" class="mr-2" /> Open
          </button>
          <button
            :class="[
              isActive('sidebarLeftState', 'compact')
                ? 'bg-warning'
                : 'bg-accent',
              'p-2 rounded-lg flex items-center',
            ]"
            @click="changeState('sidebarLeftState', 'compact')"
          >
            <Icon name="minimize" class="mr-2" /> Compact
          </button>
          <button
            :class="[
              isActive('sidebarLeftState', 'hidden') ? 'bg-error' : 'bg-accent',
              'p-2 rounded-lg flex items-center',
            ]"
            @click="changeState('sidebarLeftState', 'hidden')"
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
          @click="toggle('sidebarRightState')"
        >
          <Icon name="eye" class="mr-2" /> Toggle Sidebar Right
        </button>
        <div class="flex justify-around mt-2">
          <button
            :class="[
              isActive('sidebarRightState', 'open')
                ? 'bg-success'
                : 'bg-accent',
              'p-2 rounded-lg flex items-center',
            ]"
            @click="changeState('sidebarRightState', 'open')"
          >
            <Icon name="arrow-up-circle" class="mr-2" /> Open
          </button>
          <button
            :class="[
              isActive('sidebarRightState', 'compact')
                ? 'bg-warning'
                : 'bg-accent',
              'p-2 rounded-lg flex items-center',
            ]"
            @click="changeState('sidebarRightState', 'compact')"
          >
            <Icon name="minimize" class="mr-2" /> Compact
          </button>
          <button
            :class="[
              isActive('sidebarRightState', 'hidden')
                ? 'bg-error'
                : 'bg-accent',
              'p-2 rounded-lg flex items-center',
            ]"
            @click="changeState('sidebarRightState', 'hidden')"
          >
            <Icon name="eye-off" class="mr-2" /> Hidden
          </button>
        </div>
      </div>

      <!-- Footer State Control -->
      <div class="bg-primary p-4 border border-accent rounded-2xl text-center">
        <h3 class="font-bold mb-2">Footer</h3>
        <button
          class="bg-accent p-2 rounded-lg mb-2 flex items-center justify-center"
          @click="toggle('footerState')"
        >
          <Icon name="eye" class="mr-2" /> Toggle Footer
        </button>
        <div class="flex justify-around mt-2">
          <button
            :class="[
              isActive('footerState', 'open') ? 'bg-success' : 'bg-accent',
              'p-2 rounded-lg flex items-center',
            ]"
            @click="changeState('footerState', 'open')"
          >
            <Icon name="arrow-up-circle" class="mr-2" /> Open
          </button>
          <button
            :class="[
              isActive('footerState', 'compact') ? 'bg-warning' : 'bg-accent',
              'p-2 rounded-lg flex items-center',
            ]"
            @click="changeState('footerState', 'compact')"
          >
            <Icon name="minimize" class="mr-2" /> Compact
          </button>
          <button
            :class="[
              isActive('footerState', 'hidden') ? 'bg-error' : 'bg-accent',
              'p-2 rounded-lg flex items-center',
            ]"
            @click="changeState('footerState', 'hidden')"
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

// Define the type for 'container' and 'state'
type DisplayContainer =
  | 'headerState'
  | 'sidebarLeftState'
  | 'sidebarRightState'
  | 'footerState'
type DisplayState = 'open' | 'compact' | 'hidden'

const displayStore = useDisplayStore()

// Toggle function to switch between open/hidden states
const toggle = (container: DisplayContainer) => {
  const state: DisplayState =
    displayStore[container] === 'open' ? 'hidden' : 'open'
  displayStore.changeState(container, state)
}

// Change state function for more specific control
const changeState = (container: DisplayContainer, state: DisplayState) => {
  displayStore.changeState(container, state)
}

// Check if the current state is active
const isActive = (container: DisplayContainer, state: DisplayState) => {
  return displayStore[container] === state
}
</script>

<style scoped>
button:focus {
  outline: none;
}
</style>
