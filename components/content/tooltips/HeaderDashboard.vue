<template>
  <header class="bg-base-200 flex flex-wrap items-start justify-between p-4 md:p-8">
    <!-- Left Section -->
    <div class="flex flex-col md:flex-row items-center w-full md:w-auto">
      <div class="flex-shrink-0">
        <!-- Fixed dimensions for the avatar -->
        <avatar-image :size="avatarSize" class="m-4 rounded-2xl border" />
      </div>
      <div class="flex flex-col items-center w-full md:w-auto">
        <room-title class="text-lg font-semibold w-full border-b text-center" />
        <h2 v-if="page.subtitle" class="text-sm text-gray-500 italic text-center">
          {{ page.subtitle }}
        </h2>
      </div>
    </div>

    <!-- Middle Section -->
    <div class="hidden md:flex justify-center items-center w-full md:w-auto">
      <smart-links />
    </div>

    <!-- Right Section -->
    <div class="flex flex-wrap items-start justify-center space-x-2 w-full md:w-auto">
      <jellybean-count />
      <login-button />
      <theme-toggle />
      <butterfly-toggle />
    </div>

    <!-- Smart Links for Mobile -->
    <div class="md:hidden flex justify-center items-center w-full mt-4">
      <smart-links />
    </div>
  </header>
</template>

<script lang="ts" setup>
const { page } = useContent()

const avatarSize = 'small'
</script>
