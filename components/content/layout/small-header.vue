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
    <div class="h-1/3 flex items-end justify-end">
      <h2 class="text-sm italic text-right text-ellipsis">
        {{ subtitle }}
      </h2>
    </div>

    <!-- Icons Section -->
    <div class="h-2/3 flex items-end justify-end gap-2">
      <login-path />
      <theme-icon />
      <swarm-icon />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Page and subtitle
const { page } = useContent();
const subtitle = computed(() => page.value?.subtitle ?? 'Welcome to Kind Robots');
</script>
