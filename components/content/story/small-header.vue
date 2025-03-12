<template>
  <div class="flex h-full px-2">
    <!-- Title Section (1/3 Width) -->
    <div class="flex flex-col justify-start w-1/3">
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
    <div class="flex flex-col w-2/3">
      <!-- Subtitle Section (Top-Aligned) -->
      <div class="relative h-1/3">
        <h2
          class="absolute top-0 w-full text-xs md:text-sm italic text-right text-ellipsis leading-tight"
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

const subtitle = computed(
  () => page.value?.subtitle ?? 'Welcome to Kind Robots',
)
</script>
