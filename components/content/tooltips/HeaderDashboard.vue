<template>
  <header
    class="flex flex-col items-stretch p-4 fixed top-0 left-0 right-0 z-40 bg-white shadow-md"
    :style="{ height: headerHeight }"
  >
    <!-- Toggle Navigation Button -->
    <button
      class="p-2 bg-primary rounded-full absolute bottom-4 right-4 z-50 w-10 h-10 flex items-center justify-center"
      @click="toggleNav"
    >
      <icon name="fluent:row-triple-20-filled" class="text-xl text-white" />
    </button>

    <!-- Header Content -->
    <div class="flex flex-col items-stretch w-full">
      <!-- Top Section -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <!-- Left Section -->
        <div class="flex items-center space-x-4 flex-shrink-0">
          <div class="flex-shrink-0">
            <avatar-image :size="avatarSize" class="rounded-2xl" />
          </div>
          <div class="flex flex-col items-center text-center">
            <room-title class="text-base font-semibold border-b mb-1" />
            <h2 class="text-xs text-gray-500 italic">
              {{ page.subtitle || 'the kindest' }}
            </h2>
          </div>
        </div>

        <!-- Center Section -->
        <div class="flex-1 flex items-center justify-center">
          <smart-links />
        </div>

        <!-- Right Section -->
        <div class="flex items-center space-x-2 flex-shrink-0">
          <jellybean-count />
          <login-button />
          <theme-toggle />
          <butterfly-toggle />
        </div>
      </div>

      <!-- Navigation -->
      <navigation-trimmed
        v-if="showNav"
        class="fixed bottom-0 left-0 right-0 rounded-t-xl p-2 bg-white shadow-lg z-30 transition-transform duration-300"
        :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
      />
    </div>
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
  --header-height: 7rem; /* Default height for larger screens */
}

header {
  display: flex;
  flex-direction: column;
}

@media (max-height: 600px) {
  :root {
    --header-height: 5rem; /* Adjust height for smaller screens */
  }

  header {
    padding: 1rem; /* Adjust padding for smaller screens */
  }

  header .text-base {
    font-size: 0.875rem; /* Reduce font size for smaller screens */
  }

  header .text-xs {
    font-size: 0.75rem; /* Reduce font size for smaller screens */
  }
}

@media (max-width: 600px) {
  header .flex-wrap {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  button {
    bottom: 2rem;
    right: 2rem;
    width: auto; /* Ensure width is controlled by button content */
    height: auto; /* Ensure height is controlled by button content */
  }
}
</style>
