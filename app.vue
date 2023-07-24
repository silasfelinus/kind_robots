<template>
  <div>
    <!-- Display loading bar when a page is loading -->
    <NuxtLoadingBar />

    <div class="flex flex-col flex-grow overflow-hidden">
      <!-- Center page (main content) -->
      <main class="flex-grow p-2 sm:p-4 overflow-auto">
        <NuxtPage />
        <slot />
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
import { useBotStore } from './stores/botStore'

const menuBtn = ref(null)
const sideNav = ref(null)

const botStore = useBotStore

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
