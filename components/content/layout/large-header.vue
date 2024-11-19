<template>
  <div
    class="flex flex-row items-center justify-between h-full w-full text-left px-4"
  >
    <!-- Title and Subtitle Section -->
    <div
      class="flex flex-col items-start justify-between flex-grow w-1/3 h-full"
    >
      <h1 class="text-2xl lg:text-3xl xl:text-4xl font-semibold text-ellipsis">
        The {{ page.title || 'Room' }} Room
      </h1>
      <h2
        class="text-lg lg:text-xl xl:text-2xl italic text-ellipsis lg:mt-2 lg:ml-auto"
      >
        {{ subtitle }}
      </h2>
    </div>

    <!-- Icons Section -->
    <div class="flex flex-row justify-center items-center h-full w-2/3">
      <login-path class="flex w-1/3" />
      <theme-icon class="flex w-2/3" />
      <swarm-icon class="flex w-2/3" />
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
