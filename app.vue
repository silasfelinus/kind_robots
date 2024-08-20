<template>
  <div class="relative flex flex-col h-screen bg-secondary">
    <!-- Header -->
    <header-upgrade
      v-if="toggleSidebar"
      ref="headerRef"
      class="w-full rounded-2xl bg-primary shadow-md z-40 p-1"
    ></header-upgrade>

    <!-- This container ensures the toggle button is always visible -->
    <div class="absolute bottom-4 right-4 z-50">
      <button
        class="bg-accent text-white p-2 rounded-full shadow-md"
        @click="toggleSidebarFunction"
      >
        <span class="text-lg">
          <!-- Dynamic icon based on the sidebar state -->
          <Icon :name="toggleSidebar ? 'fxemoji:eye' : 'nimbus:eye-off'" />
        </span>
      </button>
    </div>

    <!-- Main Content -->
    <main ref="mainContentRef" class="flex-1 p-1 bg-secondary overflow-y-auto z-30">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'


// State management and other imports
const toggleSidebar = ref(true)
const headerRef = ref(null)
const mainContentRef = ref(null)

const toggleSidebarFunction = () => {
  toggleSidebar.value = !toggleSidebar.value
}

onMounted(() => {
  // Additional logic if necessary
})

onUnmounted(() => {
  // Cleanup if necessary
})
</script>

<style scoped>
button {
  font-size: 1.5rem;
  width: 3rem;
  height: 3rem;
}
</style>