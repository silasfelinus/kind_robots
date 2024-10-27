<template>
  <header
    class="flex items-center justify-between bg-base-300 rounded-2xl border-4 p-2 max-w-full box-border"
    :style="{ height: displayStore.headerHeight }"
  >
    <!-- Left Section: Avatar -->
    <div
      class="flex items-center justify-center w-[12%] sm:w-[10%] h-full relative rounded-2xl"
    >
      <avatar-image
        alt="User Avatar"
        class="w-full h-full rounded-2xl object-cover"
      />
      <!-- Special Overlay: Shows viewportSize, positioned inside avatar-image -->
      <div
        class="absolute bottom-2 right-2 text-white bg-primary rounded-md text-xs md:text-sm lg:text-base p-1"
      >
        {{ displayStore.viewportSize }}
      </div>
    </div>

    <!-- Middle Section: Title and Subtitle -->
    <div
      class="flex flex-col justify-center items-center text-center mx-2 flex-grow max-w-[50%] lg:flex-row lg:max-w-[60%] lg:space-x-4 xl:flex-col"
    >
      <h1
        class="text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold max-w-full text-ellipsis overflow-hidden whitespace-nowrap"
      >
        The {{ page.title || 'Room' }} Room
      </h1>
      <h2
        class="text-md md:text-lg lg:text-xl xl:text-2xl italic max-w-full text-ellipsis overflow-hidden whitespace-nowrap lg:mt-0"
      >
        {{ subtitle }}
      </h2>
    </div>

    <!-- Right Section: Icons and Login -->
    <div class="flex items-center justify-end space-x-2 w-[28%] sm:w-[25%]">
      <login-path class="w-1/3" />
      <theme-icon class="w-1/3" />
      <swarm-icon class="w-1/3" />
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
