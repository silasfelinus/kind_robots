<template>
  <header
    class="flex flex-col items-stretch justify-between p-4 fixed top-0 left-0 right-0 z-40 bg-white shadow-md overflow-hidden"
    :style="{ height: headerHeight }"
  >
    <!-- Toggle Navigation Button -->
    <button class="p-2 bg-primary rounded-full" @click="toggleNav">
      <icon name="fluent:row-triple-20-filled" class="text-2xl text-white" />
    </button>

    <!-- Header Content -->
    <div class="flex flex-col items-stretch w-full mt-2">
      <!-- Top Section -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <!-- Left Section -->
        <div class="flex items-center space-x-4 flex-shrink-0">
          <div class="flex-shrink-0">
            <avatar-image :size="avatarSize" class="rounded-2xl" />
          </div>
          <div class="flex flex-col items-center text-center">
            <room-title class="text-lg font-semibold border-b mb-1" />
            <h2 class="text-sm text-gray-500 italic">
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
  align-items: stretch;
}

@media (max-height: 600px) {
  :root {
    --header-height: 5rem; /* Adjust height for smaller screens */
  }

  header {
    padding: 0.5rem; /* Adjust padding for smaller screens */
  }

  header .text-lg {
    font-size: 1rem; /* Reduce font size for smaller screens */
  }

  header .text-sm {
    font-size: 0.875rem; /* Reduce font size for smaller screens */
  }
}

@media (max-width: 600px) {
  header .flex-wrap {
    flex-direction: column;
    align-items: flex-start;
    text-align: center;
  }
}
</style>
