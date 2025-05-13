<template>
  <div class="flex h-full px-2 gap-4">
    <!-- Title Section (1/3 Width) -->
    <div class="flex flex-col justify-start w-1/3 min-w-[120px]">
      <h1
        class="text-md md:text-lg font-semibold text-left leading-tight tracking-tight"
      >
        The
      </h1>
      <h1
        class="text-md md:text-lg font-semibold text-left leading-tight tracking-tight"
      >
        {{ page?.title || 'Room' }}
      </h1>
      <h1
        class="text-md md:text-lg font-semibold text-left leading-tight tracking-tight"
      >
        Room
      </h1>
    </div>

    <!-- Right Side (2/3 Width) -->
    <div class="flex flex-col flex-grow">
      <!-- Subtitle Section (Top-Aligned) -->
      <div class="flex items-start justify-end min-h-[1.5rem]">
        <h2
          class="text-xs md:text-sm italic text-right text-ellipsis leading-tight max-w-full"
        >
          {{ subtitle }}
        </h2>
      </div>

      <!-- Icons Section (Bottom-Aligned) -->
      <div class="flex-grow flex items-end justify-end gap-2 mt-auto">
        <login-icon />
        <jellybean-icon />
        <theme-icon />
        <swarm-icon />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const { page, subtitle } = storeToRefs(pageStore)
</script>
