<template>
  <div class="relative">
    <!-- Header -->
    <header
      class="z-50 flex flex-col md:flex-row items-center overflow-x-hidden"
    >
      <!-- Left Section -->
      <div class="flex items-center space-x-2 flex-shrink-0 w-full md:w-auto">
        <avatar-image
          :size="avatarSize"
          class="w-12 h-12 md:w-16 md:h-16 rounded-full"
        />
        <div class="flex flex-col text-left">
          <room-title class="text-sm font-semibold" />
          <h2 class="text-xs text-gray-500 italic">
            {{ page.subtitle || 'the kindest' }}
          </h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="flex-1 flex items-center justify-center px-1">
        <smart-links class="text-sm w-full max-w-screen-md z-30" />
      </div>

      <!-- Right Section -->
      <div
        class="flex items-center justify-end gap-2 overflow-hidden w-full md:w-auto"
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
      class="relative bottom-0 bg-secondary shadow-lg transition-transform duration-300 z-20"
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
/* General overflow management for the header */
header {
  overflow-x: hidden; /* Prevent horizontal scrolling */
  white-space: nowrap; /* Prevent items from wrapping */
  z-index: 50; /* Ensuring the header is above most elements */
}

/* Positioning for fixed elements */
.fixed {
  position: fixed;
  right: 0;
  left: 0;
  z-index: 10; /* Lower z-index for non-critical overlay elements */
}

.bg-primary {
  background-color: var(--color-primary);
}

.navigation-trimmed {
  position: fixed;
  bottom: 0;
  background-color: var(--color-secondary);
  border: 1px solid #ccc;
  border-radius: 20px;
  z-index: 30; /* Ensure it's under the header */
  transform: translateY(
    calc(100% - var(--header-height))
  ); /* Adjust translation based on header height */
  transition: transform 0.3s ease-in-out;
}

.show-nav {
  transform: translateY(
    var(--header-height)
  ); /* Correct the transform direction */
}

@media (max-width: 768px) {
  /* Mobile-specific adjustments */
  header {
    z-index: 50;
  }

  .fixed {
    background-color: var(--color-primary);
  }
  .hidden.sm\:block {
    display: none; /* Hide elements on small screens */
  }

  .flex-wrap {
    flex-wrap: wrap; /* Allow items to wrap to next line */
  }
}
</style>
