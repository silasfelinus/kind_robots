<template>
  <div class="flex flex-col h-full px-4">
    <!-- Title Section -->
    <div class="flex flex-col items-start justify-start h-1/3">
      <h1 class="text-lg font-semibold text-left leading-none">
        The
      </h1>
      <h1 class="text-lg font-semibold text-left leading-none">
        {{ page.title || 'Room' }}
      </h1>
      <h1 class="text-lg font-semibold text-left leading-none">
        Room
      </h1>
    </div>

    <!-- Subtitle Section -->
    <div class="relative h-1/3">
      <h2 class="absolute top-0 w-full text-sm italic text-right text-ellipsis">
        {{ subtitle }}
      </h2>
    </div>

    <!-- Icons Section -->
    <div class="relative h-2/3">
      <div class="absolute bottom-0 right-0 flex gap-2">
        <login-path />
        <theme-icon />
        <swarm-icon />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Page and subtitle
const { page } = useContent();
const subtitle = computed(() => page.value?.subtitle ?? 'Welcome to Kind Robots');
</script>
