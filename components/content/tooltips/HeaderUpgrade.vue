<template>
  <div class="relative">
    <!-- Header -->
    <header
      ref="headerRef"
      class="z-50 flex flex-col md:flex-row items-center justify-between overflow-x-visible max-w-full"
    >
      <!-- Left Section -->
      <div class="flex items-center space-x-2 flex-shrink-0 min-w-0 md:flex-1">
        <avatar-image
          :size="avatarSize"
          class="w-12 h-12 md:w-16 md:h-16 rounded-full"
        />
        <div class="flex items-center flex-shrink-0 min-w-0 md:flex-1">
          <room-title class="w-6 h-6 md:w-8 md:h-8 rounded-full" />
          <h2 class="text-xs text-gray-500 italic">
            {{ page.subtitle || 'the kindest' }}
          </h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="flex-1 flex items-center justify-center px-0 min-w-0">
        <smart-links class="text-sm w-full max-w-screen-md z-30" />
      </div>

      <!-- Right Section -->
      <div
        class="flex items-center justify-end gap-2 overflow-visible min-w-0 md:flex-1"
        :class="{ 'flex-wrap': isMobile }"
      >
        <butterfly-toggle class="text-sm z-40 hidden sm:block" />
        <theme-toggle class="text-sm z-50 hidden sm:block" />
        <login-button class="text-sm z-40" />
        <nav-toggle class="text-sm z-40" @toggle-nav="toggleNav" />
      </div>
    </header>

    <!-- Jellybean Counter -->
    <jellybean-count
      v-if="isLoggedIn"
      class="fixed bottom-8 right-8 bg-white p-2 rounded-full shadow-md z-10"
    />

    <!-- Navigation -->
    <navigation-trimmed
      v-if="showNav"
      class="absolute bottom-0 bg-secondary shadow-lg transition-transform duration-300 z-20"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from './../../../stores/userStore'

const { page } = useContent()
const avatarSize = ref('small')
const showNav = ref(false)
const isLoggedIn = computed(() => useUserStore().isLoggedIn)

// Initialize isMobile with a default fallback
const isMobile = ref(false)
const headerHeight = ref(0)
const headerRef = ref<HTMLElement | null>(null)

// Define a function to handle resize
function handleResize() {
  isMobile.value = window.innerWidth < 768
  if (headerRef.value) {
    headerHeight.value = headerRef.value.clientHeight
  }
}

onMounted(() => {
  // Correctly initialize isMobile based on the client's window size
  handleResize() // Call it to set initial state based on current window size

  // Set up the resize listener once the component is mounted to ensure window is available
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Ensure to clean up the event listener when the component unmounts
  window.removeEventListener('resize', handleResize)
})

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
.avatar-image {
  perspective: 1000px;
  width: 100%;
  max-width: 100px; /* Adjusted to fit within the header */
}
header {
  overflow-x: hidden; /* Prevent horizontal scrolling */
  max-width: 100vw; /* Ensure header does not exceed viewport width */
}

.navigation-trimmed {
  position: absolute; /* Use absolute to keep it out of flow */
  width: 100%; /* Full width to align with the header */
  transition: transform 0.3s ease-in-out;
}

@media (max-width: 768px) {
  .flex-wrap {
    flex-wrap: wrap; /* Allow items to wrap to next line on small screens */
  }
}
</style>
