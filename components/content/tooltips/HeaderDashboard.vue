<template>
  <header
    class="flex items-center justify-between p-4 fixed top-0 left-0 right-0 z-40 bg-white shadow-md"
    :style="{ height: headerHeight }"
  >
    <!-- Header Content -->
    <div class="flex w-full items-center justify-between">
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

      <!-- Right Section -->
      <div class="flex items-center space-x-2 flex-shrink-0">
        <smart-links />
        <jellybean-count />
        <login-button />
        <theme-toggle />
        <butterfly-toggle />
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
const { page } = useContent()
const avatarSize = 'small'

// Define responsive header height
const headerHeight = computed(() => {
  return `calc(var(--header-height) + env(safe-area-inset-top))`
})
</script>

<style scoped>
/* Define a CSS variable for the header height */
:root {
  --header-height: 7rem;
}

/* Adjust header height based on screen size */
@media (min-width: 640px) {
  :root {
    --header-height: 5rem; /* Example for medium screens */
  }
}

@media (min-width: 1024px) {
  :root {
    --header-height: 6rem; /* Example for large screens */
  }
}
</style>
