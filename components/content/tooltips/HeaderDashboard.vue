<template>
  <header
    class="flex items-center p-2 fixed top-0 left-0 right-0 z-40 bg-white shadow-md"
    :style="{ height: headerHeight }"
  >
    <!-- Header Content -->
    <div class="flex-1 flex items-center justify-between px-2">
      <!-- Left Section -->
      <div class="flex items-center space-x-2 flex-shrink-0">
        <avatar-image :size="avatarSize" class="rounded-2xl w-8 h-8" />
        <div class="flex flex-col items-center text-center">
          <room-title class="text-xs font-semibold" />
          <h2 class="text-xs text-gray-500 italic">
            {{ page.subtitle || 'the kindest' }}
          </h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="flex-1 flex items-center justify-center px-2">
        <smart-links class="text-xs" />
      </div>

      <!-- Right Section -->
      <div class="flex items-center space-x-1 flex-shrink-0">
        <jellybean-count class="text-xs" />
        <login-button class="text-xs" />
        <theme-toggle class="text-xs" />
        <butterfly-toggle class="text-xs" />
        <NavToggle @toggle-nav="toggleNav" />
      </div>
    </div>

    <!-- Navigation -->
    <navigation-trimmed
      v-if="showNav"
      class="fixed bottom-0 left-0 right-0 rounded-t-xl p-2 bg-white shadow-lg z-30 transition-transform duration-300"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
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
/* Define a CSS variable for the header height */
:root {
  --header-height: 4rem; /* Adjust height for one-line header */
}

header {
  display: flex;
  align-items: center;
  padding: 0.5rem; /* Adjust padding for compactness */
}

header .text-xs {
  font-size: 0.75rem; /* Ensure text is small and fits */
}

@media (max-width: 600px) {
  .flex-shrink-0 {
    flex-shrink: 1; /* Allow elements to shrink */
  }

  button {
    width: 2rem; /* Ensure button is small */
    height: 2rem; /* Ensure button is small */
  }

  .w-8 {
    width: 2rem; /* Adjust avatar size */
    height: 2rem; /* Adjust avatar size */
  }
}
</style>
