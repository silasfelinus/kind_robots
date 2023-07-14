<template>
  <div class="flex flex-col h-screen bg-white text-gray-600">
    <!-- Header -->
    <header>
      <bot-header />
    </header>

    <div class="flex flex-col md:flex-row flex-grow">
      <!-- Left aside (bot spinner) -->
      <aside class="flex flex-col w-full md:w-1/4 md:max-w-xs p-2 border-r border-gray-300">
        <transition name="slide-fade" class="flex-grow">
          <bot-spinner v-if="showLeftAside" />
        </transition>
      </aside>

      <!-- Center page (main content) -->
      <main class="flex-grow p-4 overflow-auto">
        <NuxtPage />
      </main>

      <!-- Right aside (bot prompt) -->
      <aside
        class="flex-none w-full md:w-1/4 md:max-w-xs p-4 border-l border-gray-300 overflow-auto"
      >
        <button class="md:hidden p-2 mb-4 bg-gray-200" @click="toggleRightAside">
          Toggle Right Sidebar
        </button>
        <transition name="slide-fade">
          <bot-prompt v-if="showRightAside" />
        </transition>
      </aside>
    </div>

    <!-- Collapsible footer with side-nav -->
    <footer class="p-4 border-t">
      <dream-status />
    </footer>

    <!-- Display loading bar when a page is loading -->
    <NuxtLoadingBar />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showLeftAside = ref(true)
const showRightAside = ref(true)

const toggleLeftAside = () => {
  showLeftAside.value = !showLeftAside.value
}

const toggleRightAside = () => {
  showRightAside.value = !showRightAside.value
}
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}
</style>
