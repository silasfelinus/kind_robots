<template>
  <header
    class="flex items-center fixed justify-between rounded-2xl border p-2 bg-base-300 z-20 space-x-2"
    :style="{ 
      height: displayStore.headerHeight + 'vh', 
      width: displayStore.headerWidth + '%' 
    }"
  >
    <!-- Avatar and Title Section -->
    <div class="flex items-center space-x-3 flex-grow">
      <avatar-image
        alt="User Avatar"
        class="max-h-full min-h-14 aspect-square rounded-2xl"
      />
      <!-- Title and Subtitle Column -->
      <div class="flex flex-col items-center justify-center flex-grow">
        <h1 class="text-lg font-semibold text-center truncate w-full">
          The {{ page.title || 'Room' }} Room
        </h1>
        <h2 class="text-sm text-accent italic text-center truncate w-full">
          {{ subtitle }}
        </h2>
      </div>
    </div>

    <!-- Buttons Section -->
    <div class="flex items-center justify-between space-x-2 flex-grow">
      <login-button class="flex-grow" />
      <theme-icon class="flex-grow" />
      <butterfly-toggle class="flex-grow" />
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
