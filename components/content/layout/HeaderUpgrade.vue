<template>
  <header
    class="flex items-center justify-between fixed rounded-2xl border p-2 bg-base-300 z-20 space-x-2"
    :style="{
      height: displayStore.headerHeight + 'vh',
      width: displayStore.mainWidth + 'vw',
      left: sidebarLeftWidth,
      right: sidebarRightWidth,
      top: '0px',
    }"
  >
    <!-- Avatar Section -->
    <div class="flex items-center space-x-3">
      <avatar-image
        alt="User Avatar"
        class="max-h-full min-h-14 aspect-square rounded-2xl"
      />
    </div>

    <!-- Title and Subtitle Section (Centered) -->
    <div
      class="flex flex-col items-center justify-center flex-grow text-center"
    >
      <h1 class="text-lg lg:text-xl font-semibold truncate w-full">
        The {{ page.title || 'Room' }} Room
      </h1>
      <h2 class="text-sm lg:text-md text-accent italic truncate w-full">
        {{ subtitle }}
      </h2>
    </div>

    <!-- Buttons Section (Right Aligned) -->
    <div class="flex items-center justify-end space-x-2">
      <login-button class="w-1/5" />
      <theme-icon class="w-1/5" />
      <butterfly-toggle class="w-1/6" />
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

const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
</script>
