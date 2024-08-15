<script lang="ts" setup>
const { page } = useContent()

const avatarSize = 'small'
</script>

<template>
  <header
    class="bg-base-200 flex items-center justify-between p-4 fixed top-0 left-0 right-0 z-40"
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
  height: 5rem; /* Adjust based on the actual height of your header content */
  padding: 1rem 2rem; /* Adjust padding for more space around the content */
  /* Optional: Add box-sizing to include padding in height calculation */
  box-sizing: border-box;
}

/* Optional: Ensure no overlap or unintended spacing issues */
main {
  padding-top: 6rem; /* Space for the fixed header */
}

@media (max-width: 768px) {
  /* Adjust header padding for smaller screens */
  header {
    padding: 1rem;
    height: auto; /* Allow height to adjust based on content */
  }

  .flex-col {
    flex-direction: column;
  }
}
</style>
