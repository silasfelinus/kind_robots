<script lang="ts" setup>
const { page } = useContent()

const avatarSize = 'small'
</script>

<template>
  <header
    class="bg-base-200 flex items-center justify-between p-2 fixed top-0 left-0 right-0 z-40"
  >
    <!-- Left Section -->
    <div class="flex flex-col md:flex-row items-center w-full md:w-auto">
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
    <layout-selector />
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
  height: 4rem; /* Adjust based on actual header height */
  /* You can add additional styles here if needed */
}

/* Optional: Ensure no overlap or unintended spacing issues */
main {
  padding-top: 4rem; /* Space for the fixed header */
}
</style>
