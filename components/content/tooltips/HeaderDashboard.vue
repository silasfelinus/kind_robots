<script lang="ts" setup>
const { page } = useContent()

const avatarSize = 'small'
</script>

<template>
  <header class="bg-base-200 flex items-center justify-between p-1">
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
    <!-- Right Section -->
    <div class="flex items-center justify-center flex-wrap space-x-2 w-auto">
      <jellybean-count />
      <login-button />
      <theme-toggle />
      <butterfly-toggle />
    </div>
  </header>
</template>
