<template>
  <div
    class="flex h-full w-full px-4"
    :class="{ 'flex-col items-start': isSmallDisplay, 'flex-row items-center': !isSmallDisplay }"
  >
    <!-- Title and Subtitle Section -->
    <div
      class="flex flex-col justify-center flex-shrink-0"
      :class="{ 'w-full px-2': isSmallDisplay, 'w-1/3': !isSmallDisplay }"
    >
      <h1
        class="font-semibold"
        :class="{
          'text-md md:text-lg leading-tight tracking-tight': isSmallDisplay,
          'text-lg lg:text-xl xl:text-2xl': !isSmallDisplay
        }"
      >
        The {{ page?.title || 'Room' }} Room
      </h1>

      <h2
        class="italic"
        :class="{
          'text-xs md:text-sm text-right text-ellipsis leading-tight mt-1': isSmallDisplay,
          'text-sm lg:text-md xl:text-lg mt-2': !isSmallDisplay
        }"
      >
        {{ subtitle }}
      </h2>
    </div>

    <!-- Icons Section -->
    <div
      class="flex gap-2"
      :class="{
        'w-full justify-end mt-2': isSmallDisplay,
        'flex-row justify-around flex-grow space-x-4': !isSmallDisplay
      }"
    >
      <login-path class="flex max-w-[80px]" />
      <jellybean-count class="flex max-w-[80px]" />
      <theme-icon class="flex max-w-[80px]" />
      <swarm-icon class="flex max-w-[80px]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'
import type { ContentType } from '~/content.config'
import { useDisplayStore } from '@/stores/displayStore'

// Store for detecting screen size
const displayStore = useDisplayStore()
const isSmallDisplay = computed(() => displayStore.viewportSize === 'small')

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

const subtitle = computed(() => page.value?.subtitle ?? 'Welcome to Kind Robots')
</script>
