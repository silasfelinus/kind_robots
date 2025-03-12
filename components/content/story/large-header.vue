<template>
  <div class="flex h-full w-full px-4">
    <!-- Title and Subtitle Section -->
    <div class="flex flex-col justify-center flex-shrink-0 w-1/3">
      <h1 class="text-lg lg:text-xl xl:text-2xl font-semibold">
        The {{ page?.title || 'Room' }} Room
      </h1>
      <h2 class="text-sm lg:text-md xl:text-lg italic mt-2">
        {{ subtitle }}
      </h2>
    </div>

    <!-- Icons Section -->
    <div class="flex flex-row justify-around items-center flex-grow space-x-4">
      <login-path class="flex flex-1 max-w-[80px]" />
      <jellybean-count class="flex flex-1 max-w-[80px]" />
      <theme-icon class="flex flex-1 max-w-[80px]" />
      <swarm-icon class="flex flex-1 max-w-[80px]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'
import type { ContentType } from '~/content.config'

// Get the route params
const route = useRoute()

const page = computed(() => {
  const { data } = useAsyncData(route.path, async () => {
    return (await queryCollection('content')
      .path(route.path)
      .first()) as ContentType | null
  })
  return data.value
})

// Compute the subtitle properly
const subtitle = computed(
  () => page.value?.subtitle ?? 'Welcome to Kind Robots',
)
</script>
