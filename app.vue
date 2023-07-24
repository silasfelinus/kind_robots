<template>
  <div class="flex flex-col h-screen bg-white text-gray-600">
    <!-- Header -->
    <header
      class="site-header w-full bg-gradient-to-r from-primary to-primary-light text-white shadow-md px-2 py-1 sm:px-6 lg:px-8"
    >
      <div
        class="container mx-auto flex items-center justify-between sm:justify-around lg:justify-between"
      >
        <theme-manager class="hidden sm:flex" />
        <button id="menuBtn" class="md:hidden lg:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
        <nav id="sideNav" class="md:flex">
          <butterfly-toggle />
          <effects-viewer />
        </nav>
      </div>
    </header>
    <!-- Display loading bar when a page is loading -->
    <NuxtLoadingBar />

    <div class="flex flex-col flex-grow overflow-hidden">
      <!-- Center page (main content) -->
      <main class="flex-grow p-2 sm:p-4 overflow-auto">
        <site-title class="text-lg sm:text-xl font-bold" />
        <NuxtPage />
        <side-nav />
      </main>
    </div>

    <!-- Collapsible footer -->
    <footer class="p-2 sm:p-4 border-t flex-shrink-0">
      <dream-status />
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const menuBtn = ref(null)
const sideNav = ref(null)

onMounted(() => {
  menuBtn.value = document.getElementById('menuBtn')
  sideNav.value = document.getElementById('sideNav')

  menuBtn.value.addEventListener('click', toggleMenu)
})

onUnmounted(() => {
  menuBtn.value.removeEventListener('click', toggleMenu)
})

function toggleMenu() {
  sideNav.value.classList.toggle('hidden')
}
</script>
