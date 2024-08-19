<template>
  <div class="relative bg-accent">
    <!-- Header -->
    <header
      class="bg-primary border-sm rounded-xl shadow-md z-20 flex flex-col md:flex-row items-center p-2 overflow-x-auto"
    >
      <!-- Left Section -->
      <div class="flex items-center space-x-2 flex-shrink-0 w-full md:w-auto">
        <avatar-image
          :size="avatarSize"
          class="w-12 h-12 md:w-16 md:h-16 rounded-full"
        />
        <div class="flex flex-col text-left">
          <room-title class="text-sm font-semibold" />
          <h2 class="text-xs text-gray-500 italic text-center">
            {{ page.subtitle || 'the kindest' }}
          </h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="flex-1 flex items-center justify-center px-0 mt-0">
        <smart-links class="text-lg w-full max-w-screen-md" />
      </div>

      <!-- Right Section -->
      <div
        class="right-section flex flex-wrap justify-center items-center space-x-2 mt-0 overflow-x-auto"
      >
        <div class="icon-container flex-shrink-0">
          <butterfly-toggle class="text-sm" />
        </div>

        <div class="icon-container flex-shrink-0">
          <theme-toggle class="text-sm" />
        </div>

        <div class="icon-container flex-shrink-0">
          <login-button />
        </div>

        <div class="icon-container flex-shrink-0">
          <NavToggle class="text-sm" @toggle-nav="toggleNav" />
        </div>
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
      class="fixed top-0 left-0 right-0 bottom-0 bg-secondary shadow-lg transition-transform duration-300"
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
header {
  overflow-x: auto;
  white-space: nowrap;
}

.right-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: center; /* Center items horizontally */
  gap: 8px; /* Adjust gap as needed */
}

.icon-container {
  min-width: 60px; /* Ensure icons have a minimum width */
}

/* Additional media query adjustments if necessary */
@media (max-width: 640px) {
  .right-section {
    flex-direction: column; /* Stack items vertically on very small screens */
  }

  .icon-container {
    min-width: 50px; /* Adjust for very small screens */
  }
}
</style>
