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
        class="flex items-center justify-end gap-2 overflow-x-hidden w-full md:w-auto"
      >
        <butterfly-toggle class="text-sm z-40" />
        <theme-toggle class="text-sm z-50" />
        <login-button class="text-sm z-40" />
        <nav-toggle class="text-sm z-40" @toggle-nav="toggleNav" />
      </div>
    </header>

    <!-- Jellybean Counter -->
    <jellybean-count
      v-if="isLoggedIn"
      class="fixed bottom-8 right-8 bg-white p-2 rounded-full shadow-md z-10"
    />

    <!-- Navigation Drawer -->
    <navigation-trimmed
      v-if="showNav"
      class="fixed bottom-0 bg-secondary border rounded-2xl shadow-lg transition-transform duration-300 m-2 z-30"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const { page } = useContent()
const avatarSize = 'small'

const showNav = ref(false)
const isLoggedIn = computed(() => useUserStore().isLoggedIn)

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

/* Specific display settings for medium and up screens */
.md\\:flex {
  display: flex; /* Ensure flexibility of display at md breakpoint */
}

/* Positioning for fixed elements, ensuring they do not overlap important UI elements */
.fixed {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 10; /* Lower z-index for non-critical overlay elements */
}

.bg-primary {
  background-color: var(--color-primary);
}

@media (max-width: 768px) {
  /* Mobile-specific adjustments */
  header {
    z-index: 50;
  }

  .fixed {
    background-color: var(--color-primary);
  }
}
</style>
