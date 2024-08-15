<template>
  <header
    class="bg-base-200 flex items-center justify-between p-4 fixed top-4 left-0 right-0 z-40 shadow-md"
    style="height: 6rem"
  >
    <!-- Left Section -->
    <div class="flex items-center space-x-4">
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
    <div class="flex items-center space-x-2">
      <smart-links />
      <jellybean-count />
      <login-button />
      <theme-toggle />
      <butterfly-toggle />
    </div>
  </header>
</template>

<script lang="ts" setup>
const { page } = useContent()
const avatarSize = 'small'
</script>
