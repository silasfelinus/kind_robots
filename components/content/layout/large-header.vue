<template>
  <div
    class="flex flex-col md:flex-row items-center justify-between h-full text-center md:text-left space-y-2 md:space-y-0 px-4"
  >
    <!-- Title and Subtitle Section -->
    <div class="flex flex-col lg:flex-row items-center lg:items-start lg:justify-between flex-grow space-y-2 lg:space-y-0 lg:space-x-6">
      <h1 class="text-2xl lg:text-3xl xl:text-4xl font-semibold text-ellipsis">
        The {{ page.title || 'Room' }} Room
      </h1>
      <h2 class="text-lg lg:text-xl xl:text-2xl italic text-ellipsis lg:mt-2 lg:ml-auto">
        {{ subtitle }}
      </h2>
    </div>

    <!-- Icons Section -->
    <div
      class="flex justify-center lg:justify-end items-center lg:space-x-4 flex-shrink-0 lg:w-1/3 mt-4 md:mt-0"
    >
      <login-path class="flex" />
      <theme-icon class="flex" />
      <swarm-icon class="flex" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Page and subtitle
const { page } = useContent();
const subtitle = computed(() => page.value?.subtitle ?? 'Welcome to Kind Robots');
</script>
