<template>
  <header
    class="relative flex flex-col bg-base-300 rounded-2xl border-1 border-accent max-w-full box-border"
  >
    <!-- Top Section: Avatar, Viewport Notice, and Header Content -->
    <div class="flex items-center justify-between w-full h-full">
      <!-- Avatar Section with Viewport Overlay -->
      <div
        class="relative flex items-center w-1/5 sm:w-1/6 h-20 sm:h-24 rounded-2xl pr-2 overflow-visible"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full rounded-2xl object-cover"
        />

        <!-- Viewport Notice Overlay -->
        <div
          class="absolute bottom-0 left-2 text-white bg-primary rounded-md text-xs md:text-sm p-1"
          style="transform: translateY(100%)"
        >
          {{ displayStore.viewportSize }}
        </div>
      </div>

      <screen-debug />

      <!-- Dynamic Header Content -->
      <div class="flex flex-col flex-1 h-full">
        <div class="flex h-full w-full px-4">
          <!-- Title and Subtitle Section -->
          <div
            class="flex flex-col justify-center flex-shrink-0"
            :class="{
              'w-full px-2': isSmallDisplay,
              'w-1/3': !isSmallDisplay,
            }"
          >
            <h1
              class="font-semibold"
              :class="{
                'text-md md:text-lg leading-tight tracking-tight':
                  isSmallDisplay,
                'text-lg lg:text-xl xl:text-2xl': !isSmallDisplay,
              }"
            >
              The {{ page?.title || 'Room' }} Room
            </h1>

            <h2
              class="italic"
              :class="{
                'text-xs md:text-sm text-right text-ellipsis leading-tight mt-1':
                  isSmallDisplay,
                'text-sm lg:text-md xl:text-lg mt-2': !isSmallDisplay,
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
              'flex-row justify-around flex-grow space-x-4': !isSmallDisplay,
            }"
          >
            <login-path class="flex max-w-[80px]" />
            <jellybean-count class="flex max-w-[80px]" />
            <theme-icon class="flex max-w-[80px]" />
            <swarm-icon class="flex max-w-[80px]" />
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

const subtitle = computed(
  () => page.value?.subtitle ?? 'Welcome to Kind Robots',
)
</script>
