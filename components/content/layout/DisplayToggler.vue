<template>
  <div class="bg-base-200 p-4 border rounded-2xl shadow-md">
    <h2 class="text-lg font-bold text-center mb-4">Display Tester</h2>

    <div class="flex flex-wrap justify-around gap-4">
      <!-- Header State Control -->
      <div class="bg-primary p-4 border border-accent rounded-2xl text-center">
        <h3 class="font-bold mb-2">Header</h3>
        <button
          class="bg-accent p-2 rounded-lg mb-2"
          @click="toggle('headerState')"
        >
          Toggle Header
        </button>
        <div class="flex justify-around">
          <button
            class="bg-accent p-2 rounded-lg"
            @click="changeState('headerState', 'open')"
          >
            Open
          </button>
          <button
            class="bg-accent p-2 rounded-lg"
            @click="changeState('headerState', 'compact')"
          >
            Compact
          </button>
          <button
            class="bg-accent p-2 rounded-lg"
            @click="changeState('headerState', 'hidden')"
          >
            Hidden
          </button>
        </div>
      </div>

      <!-- Sidebar Left State Control -->
      <div class="bg-primary p-4 border border-accent rounded-2xl text-center">
        <h3 class="font-bold mb-2">Sidebar Left</h3>
        <button
          class="bg-accent p-2 rounded-lg mb-2"
          @click="toggle('sidebarLeft')"
        >
          Toggle Sidebar Left
        </button>
        <div class="flex justify-around">
          <button
            class="bg-accent p-2 rounded-lg"
            @click="changeState('sidebarLeft', 'open')"
          >
            Open
          </button>
          <button
            class="bg-accent p-2 rounded-lg"
            @click="changeState('sidebarLeft', 'compact')"
          >
            Compact
          </button>
          <button
            class="bg-accent p-2 rounded-lg"
            @click="changeState('sidebarLeft', 'hidden')"
          >
            Hidden
          </button>
        </div>
      </div>

      <!-- Sidebar Right State Control -->
      <div class="bg-primary p-4 border border-accent rounded-2xl text-center">
        <h3 class="font-bold mb-2">Sidebar Right</h3>
        <button
          class="bg-accent p-2 rounded-lg mb-2"
          @click="toggle('sidebarRight')"
        >
          Toggle Sidebar Right
        </button>
        <div class="flex justify-around">
          <button
            class="bg-accent p-2 rounded-lg"
            @click="changeState('sidebarRight', 'open')"
          >
            Open
          </button>
          <button
            class="bg-accent p-2 rounded-lg"
            @click="changeState('sidebarRight', 'compact')"
          >
            Compact
          </button>
          <button
            class="bg-accent p-2 rounded-lg"
            @click="changeState('sidebarRight', 'hidden')"
          >
            Hidden
          </button>
        </div>
      </div>

      <!-- Bottom Drawer State Control -->
      <div class="bg-primary p-4 border border-accent rounded-2xl text-center">
        <h3 class="font-bold mb-2">Bottom Drawer</h3>
        <button
          class="bg-accent p-2 rounded-lg mb-2"
          @click="toggle('bottomDrawer')"
        >
          Toggle Bottom Drawer
        </button>
        <div class="flex justify-around">
          <button
            class="bg-accent p-2 rounded-lg"
            @click="changeState('bottomDrawer', 'open')"
          >
            Open
          </button>
          <button
            class="bg-accent p-2 rounded-lg"
            @click="changeState('bottomDrawer', 'compact')"
          >
            Compact
          </button>
          <button
            class="bg-accent p-2 rounded-lg"
            @click="changeState('bottomDrawer', 'hidden')"
          >
            Hidden
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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
</script>

<style scoped>
/* Custom styling for DisplayTester */
</style>
