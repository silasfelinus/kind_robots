<template>
  <header
    class="flex items-center h-full justify-between bg-base-300 rounded-2xl border-4 p-1 z-30 max-w-full box-border"
    :style="{
      height: displayStore.headerHeight,
    }"
  >
    <!-- Left Section: Avatar -->
    <div class="flex items-center justify-center w-[15%] h-full rounded-2xl relative">
      <avatar-image
        alt="User Avatar"
        class="w-full h-full rounded-2xl object-cover"
      />
      <!-- Special Overlay: Shows viewportSize from displayStore, positioned inside avatar-image -->
      <div
        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-white bg-primary rounded-lg text-xs md:text-sm lg:text-base p-1"
      >
        {{ displayStore.viewportSize }}
      </div>
    </div>

    <!-- Second Section: Title and Subtitle -->
    <div
      class="max-w-[40%] flex-grow flex flex-col items-center justify-center text-center mx-2 box-border"
    >
      <h1
        class="text-xs md:text-sm lg:text-md xl:text-xl font-semibold text-ellipsis overflow-hidden whitespace-nowrap max-w-full"
      >
        The {{ page.title || 'Room' }} Room
      </h1>
      <h2
        class="text-xs md:text-sm lg:text-lg xl:text-xl italic text-ellipsis overflow-hidden whitespace-nowrap max-w-full"
      >
        {{ subtitle }}
      </h2>
    </div>

    <!-- Right Section: Icons and Login -->
    <div
      class="flex items-center justify-end space-x-1 box-border"
      :style="{
        width: '45%', // This section takes 45% for three elements each taking 15%
      }"
    >
      <!-- Login Button -->
      <login-path class="w-1/3 box-border" />
      <!-- Theme Icon -->
      <theme-icon class="w-1/3 box-border" />
      <!-- Butterfly Toggle Icon -->
      <swarm-icon class="w-1/3 box-border" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access display store
const displayStore = useDisplayStore()

// Access page content and subtitle
const { page } = useContent()
const subtitle = computed(
  () => page.value?.subtitle ?? 'Welcome to Kind Robots',
)
</script>
