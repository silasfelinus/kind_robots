<template>
  <header
    class="flex items-center p-0 fixed top-0 left-0 right-0 z-40 bg-white shadow-md"
    :style="{ height: headerHeight, maxHeight: '100vh' }"
  >
    <!-- Header Content -->
    <div class="flex w-full items-center justify-between px-4">
      <!-- Left Section -->
      <div class="flex items-center space-x-2 flex-shrink-1">
        <avatar-image :size="avatarSize" class="rounded-full w-8 h-8" />
        <div class="flex flex-col text-left">
          <room-title class="text-sm font-semibold" />
          <h2 class="text-xs text-gray-500 italic">
            {{ page.subtitle || 'the kindest' }}
          </h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="flex-1 flex items-center justify-center px-2">
        <smart-links class="text-sm" />
      </div>

      <!-- Right Section -->
      <div class="flex items-center space-x-2 flex-shrink-1">
        <nav-toggle @toggle-nav="toggleNav" />
        <theme-toggle class="text-sm" />
        <butterfly-toggle class="text-sm" />
        <login-button />
      </div>
    </div>

    <!-- Jellybean Counter -->
    <jellybean-count
      v-if="isLoggedIn"
      class="fixed bottom-2 right-2 text-sm bg-white p-1 rounded-full shadow-md"
    />

    <!-- Navigation Drawer -->
    <transition name="slide">
      <navigation-trimmed v-if="showNav" class="navigation-drawer" />
    </transition>
  </header>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const { page } = useContent()
const avatarSize = 'small'

// Define responsive header height
const headerHeight = computed(() => `var(--header-height)`)

const showNav = ref(false)
const isLoggedIn = ref(false) // Update this based on your authentication logic

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
:root {
  --header-height: 3rem; /* Adjust height for a thinner header */
}

header {
  display: flex;
  align-items: center;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  overflow-x: auto; /* Allow horizontal scrolling if needed */
}

header .text-sm {
  font-size: 0.875rem; /* Small text size */
}

.avatar-image {
  width: 2rem;
  height: 2rem;
}

.login-button {
  background-color: var(--button-bg);
  color: var(--button-text);
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  margin-left: 1rem;
}

.login-button:hover {
  background-color: var(--button-bg-hover);
}

@media (max-width: 600px) {
  .flex-shrink-1 {
    flex-shrink: 2; /* Allow elements to shrink */
  }

  button {
    width: 2rem; /* Ensure button is small */
    height: 2rem; /* Ensure button is small */
  }

  .w-8 {
    width: 2rem; /* Adjust avatar size for small screens */
    height: 2rem; /* Adjust avatar size for small screens */
  }
}

.jellybean-count {
  z-index: 10; /* Lower priority */
}

/* Navigation Drawer Styles */
.navigation-drawer {
  position: fixed;
  top: var(--header-height); /* Position below the header */
  left: 0;
  right: 0;
  bottom: 0; /* Full height from header to bottom */
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 30; /* Ensure it's on top of other content */
}

/* Transition for navigation drawer */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-in-out;
}
.slide-enter,
.slide-leave-to {
  transform: translateY(100%); /* Hide by default and slide down */
}
</style>
