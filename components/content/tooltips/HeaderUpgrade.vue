<template>
  <div>
    <header
      class="header-container"
      :style="{ height: headerHeight, maxHeight: '100vh' }"
    >
      <!-- Header Content -->
      <div class="flex w-full items-center justify-between px-1">
        <!-- Left Section -->
        <div class="flex items-center space-x-1 flex-shrink-0">
          <avatar-image :size="avatarSize" class="rounded-full w-10 h-10" />
          <div class="flex flex-col text-left">
            <room-title class="text-sm font-semibold" />
            <h2 class="text-xs text-gray-500 italic">
              {{ page.subtitle || 'the kindest' }}
            </h2>
          </div>
        </div>

        <!-- Center Section -->
        <div class="flex-1 flex flex-col items-center justify-center px-2">
          <smart-links class="text-sm mb-1" />
          <!-- Nav and Controls Section -->
          <div class="flex items-center space-x-1">
            <NavToggle @toggle-nav="toggleNav" />
            <theme-toggle class="text-sm" />
            <butterfly-toggle class="text-sm" />
          </div>
        </div>
      </div>

      <!-- Jellybean Counter -->
      <jellybean-count
        class="fixed top-1 right-1 text-sm z-10 bg-white p-1 rounded-full shadow-md"
      />
    </header>

    <!-- Navigation -->
    <navigation-trimmed
      v-if="showNav"
      class="relative z-30 p-1 bg-white shadow-lg transition-transform duration-300 transform"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
    />

    <!-- Main Content -->
    <main class="flex-1 p-4">
      <!-- Your main content goes here -->
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const { page } = useContent()
const avatarSize = 'small'

// Define responsive header height
const headerHeight = computed(() => {
  return `calc(3rem + env(safe-area-inset-top))`
})

const showNav = ref(false)

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
:root {
  --header-height: 3rem;
}

.header-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 20; /* Ensure header is on top */
}

.header-content {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  align-items: center;
  justify-content: space-between; /* Ensure even space distribution */
  padding: 0 1rem; /* Padding inside the header */
  box-sizing: border-box;
}

.left-section,
.center-section,
.right-section {
  display: flex;
  align-items: center;
}

.center-section {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 1rem; /* Ensure proper spacing */
}

.jellybean-count {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background-color: white;
  padding: 0.5rem;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10; /* Lower priority */
}

.navigation-drawer {
  position: fixed;
  top: var(--header-height); /* Ensure it's positioned below the header */
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-secondary); /* Ensure correct background color */
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
  transform: translateY(100%); /* Hide it by default */
  z-index: 40; /* Adjust z-index if needed */
}

.navigation-drawer.translate-y-0 {
  transform: translateY(0); /* Show the drawer */
}

.right-section {
  display: flex;
  align-items: center;
  gap: 0.5rem; /* Adjust the gap between items */
  margin-right: 0.5rem; /* Reduce the margin on the right side */
}

.page-content {
  flex: 1;
  padding: 1rem;
  margin-top: var(--header-height); /* Ensure content starts below the header */
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .header-content {
    flex-direction: column;
    align-items: stretch; /* Ensure elements take full width */
  }

  .left-section,
  .center-section,
  .right-section {
    width: 100%;
    justify-content: center; /* Center items in smaller screens */
  }

  .right-section {
    margin-right: 0; /* Remove extra margin on smaller screens */
    padding: 0.5rem; /* Adjust padding if necessary */
  }
}
</style>
