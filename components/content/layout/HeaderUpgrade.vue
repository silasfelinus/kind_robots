<template>
  <header
    class="relative flex items-center fixed justify-between rounded-2xl border p-2 bg-base-300 z-20 h-[calc(var(--vh,1vh)*10)] space-x-2"
  >
    <!-- Avatar and Title Section -->
    <div class="flex items-center space-x-3 flex-grow">
      <avatar-image
        alt="User Avatar"
        class="max-h-full min-h-14 aspect-square rounded-2xl"
      />
      <!-- Title and Subtitle Column -->
      <div class="flex flex-col items-center justify-center flex-grow">
        <h1 class="text-lg font-semibold text-center truncate w-full max-w-xs sm:max-w-sm lg:max-w-md">
          The {{ page.title || 'Room' }} Room
        </h1>
        <h2 class="text-sm text-accent italic text-center truncate w-full max-w-xs sm:max-w-sm lg:max-w-md">
          {{ subtitle }}
        </h2>
      </div>
    </div>

    <!-- Buttons Section -->
    <div class="flex items-center justify-end space-x-2">
      <login-button class="w-[90px] sm:w-[110px] md:w-[130px] lg:w-[150px]" />
      <theme-icon class="w-[90px] sm:w-[110px] md:w-[130px] lg:w-[150px]" />
      <butterfly-toggle class="w-[50px] sm:w-[60px] md:w-[70px] lg:w-[80px]" />
    </div>
  </header>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access display store
const displayStore = useDisplayStore()

const { page } = useContent()
const subtitle = computed(
  () => page.value?.subtitle ?? 'Welcome to Kind Robots',
)
</script>
