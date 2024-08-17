<template>
  <header
    class="flex flex-col items-center p-0 fixed top-0 left-0 right-0 z-40 bg-white shadow-md"
    :style="{ height: headerHeight, maxHeight: '100vh' }"
  >
    <!-- Header Content -->
    <div class="flex w-full items-center justify-between px-0">
      <!-- Left Section -->
      <div class="flex items-center space-x-0 flex-shrink-0">
        <avatar-image :size="avatarSize" class="rounded-full w-10 h-10" />
        <div class="flex flex-col text-left">
          <room-title class="text-sm font-semibold" />
          <h2 class="text-xs text-gray-500 italic">
            {{ page.subtitle || 'the kindest' }}
          </h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="flex-1 flex flex-col items-center justify-center px-0">
        <smart-links class="text-sm mb-2" />
        <!-- Nav and Controls Section -->
        <div class="flex items-center space-x-2">
          <NavToggle @toggle-nav="toggleNav" />
          <theme-toggle class="text-sm" />
          <butterfly-toggle class="text-sm" />
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <navigation-trimmed
      v-if="showNav"
      class="fixed bottom-0 left-0 right-0 rounded-t-x0 p-0 bg-white shadow-lg z-30 transition-transform duration-300"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
    />

    <!-- Jellybean Counter -->
    <jellybean-count
      class="fixed top-2 right-2 text-sm z-10 bg-white p-1 rounded-full shadow-md"
    />
  </header>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const { page } = useContent()
const avatarSize = 'small'

// Define responsive header height
const headerHeight = computed(() => {
  return `calc(var(--header-height) + env(safe-area-inset-top))`
})

const showNav = ref(false)

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
:root {
  --header-height: 4rem; /* Adjust height for one-line header */
}

header {
  display: flex;
  flex-direction: column;
  align-items: center;
}

header .text-sm {
  font-size: 0.875rem; /* Ensure text is small and fits */
}

@media (max-width: 600px) {
  .flex-shrink-0 {
    flex-shrink: 1; /* Allow elements to shrink */
  }

  button {
    width: 2rem; /* Ensure button is small */
    height: 2rem; /* Ensure button is small */
  }

  .w-10 {
    width: 2.5rem; /* Adjust avatar size */
    height: 2.5rem; /* Adjust avatar size */
  }

0
}

.jellybean-count {
  z-index: 10; /* Lower priority */
}
</style>
