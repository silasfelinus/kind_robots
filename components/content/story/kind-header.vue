<template>
  <header
    class="relative flex flex-col bg-base-300 rounded-2xl border-1 border-accent max-w-full box-border h-24 sm:h-32"
  >
    <!-- Top Section: Avatar, Viewport Notice, and Header Content -->
    <div class="flex items-center justify-between w-full h-full">
      <!-- Avatar Section with Viewport Overlay -->
      <div
        class="relative flex items-center w-1/5 sm:w-1/6 h-full rounded-2xl overflow-visible"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full rounded-2xl object-cover"
        />

        <!-- Viewport Notice Overlay -->
        <div
          class="absolute bottom-2 left-2 text-white bg-primary rounded-md text-xs md:text-sm"
        >
          {{ displayStore.viewportSize }}
        </div>
      </div>

      <!-- Dynamic Header Content -->
      <div class="flex flex-col flex-1 h-full px-4">
        <div class="flex h-full w-full">
          <!-- Title and Subtitle Section -->
          <div
            class="flex flex-col justify-center flex-shrink-0 w-1/2 sm:w-1/3 pr-2"
          >
            <h1
              class="font-semibold text-md md:text-lg lg:text-xl xl:text-2xl leading-tight tracking-tight"
            >
              The {{ page?.title || 'Room' }} Room
            </h1>

            <h2
              class="italic text-xs md:text-sm lg:text-md xl:text-lg text-right text-ellipsis leading-tight mt-1 sm:mt-2"
            >
              {{ subtitle }}
            </h2>
          </div>

          <!-- Icons Section -->
          <div
            class="flex gap-2 w-1/2 sm:w-2/3 justify-end sm:flex-row sm:justify-around sm:flex-grow sm:space-x-1 md:space-x-2"
          >
            <login-path class="flex max-w-[80px]" />
            <jellybean-count class="flex max-w-[80px]" />
            <theme-icon class="flex max-w-[80px]" />
            <swarm-icon class="flex max-w-[80px]" />

            <screen-debug class="flex max-w-[80px]" />
          </div>
        </div>

        <!-- Mode Row (Always Aligned at Bottom) -->
        <ModeRow class="w-full" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'
import type { ContentType } from '~/content.config'
import { useDisplayStore } from '@/stores/displayStore'

// Store for detecting screen size
const displayStore = useDisplayStore()

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
