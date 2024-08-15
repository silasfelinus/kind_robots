<script lang="ts" setup>
const { page } = useContent()

const avatarSize = 'small'
</script>

<template>
  <header
    class="bg-base-200 flex items-center justify-between p-4 fixed top-0 left-0 right-0 z-40"
  >
    <!-- Left Section -->
    <div
      class="flex flex-col md:flex-row items-center w-full md:w-auto space-y-2 md:space-y-0"
    >
      <div class="flex-shrink-0">
        <avatar-image :size="avatarSize" class="m-2 rounded-2xl" />
      </div>
      <div class="flex flex-col items-center w-full md:w-auto">
        <room-title class="text-lg font-semibold w-full border-b text-center" />
        <h2 class="text-sm text-gray-500 italic text-center">
          {{ page.subtitle || 'the kindest' }}
        </h2>
      </div>
    </div>
    <smart-links />
    <!-- Right Section -->
    <div class="flex items-center justify-center flex-wrap space-x-2 w-auto">
      <jellybean-count />
      <login-button />
      <theme-toggle />
      <butterfly-toggle />
    </div>
  </header>
</template>

<style scoped>
/* Ensure proper spacing around the header */
header {
  height: 6rem; /* Ensure enough height for content */
  padding: 1rem 2rem; /* Provide padding for space around content */
  box-sizing: border-box; /* Include padding in height calculation */
  display: flex;
  align-items: center; /* Vertically align items */
}

/* Ensure main content doesn't overlap header */
main {
  padding-top: 6rem; /* Ensure space for fixed header */
}

@media (max-width: 768px) {
  header {
    padding: 1rem; /* Adjust padding for smaller screens */
    height: auto; /* Allow height to adjust based on content */
  }
}
</style>
