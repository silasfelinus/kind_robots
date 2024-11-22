<template>
  <div class="flex h-full px-2">
    <!-- Title Section (1/3 Width) -->
    <div class="flex flex-col justify-start w-1/3">
      <h1 class="text-lg font-semibold text-left leading-none">The</h1>
      <h1 class="text-lg font-semibold text-left leading-none">
        {{ page.title || 'Room' }}
      </h1>
      <h1 class="text-lg font-semibold text-left leading-none">Room</h1>
    </div>

    <!-- Right Side (2/3 Width) -->
    <div class="flex flex-col w-2/3">
      <!-- Subtitle Section (Top-Aligned) -->
      <div class="relative h-1/3">
        <h2
          class="absolute top-0 w-full text-sm italic text-right text-ellipsis"
        >
          {{ subtitle }}
        </h2>
      </div>

      <!-- Icons Section (Bottom-Aligned) -->
      <div class="relative flex-grow">
        <div class="absolute bottom-0 right-0 flex gap-2">
          <login-path />
          <jellybean-count />
          <theme-icon />
          <swarm-icon />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Page and subtitle
const { page } = useContent()
const subtitle = computed(
  () => page.value?.subtitle ?? 'Welcome to Kind Robots',
)
</script>
