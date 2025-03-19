<template>
  <header
    class="relative flex flex-col bg-base-300 rounded-2xl border-1 border-accent max-w-full box-border"
    :class="{
      'h-screen': displayStore.isLargeScreen,
      'h-auto': !displayStore.isLargeScreen
    }"
  >
    <!-- Top Section: Avatar, Viewport Notice, and Header Content -->
    <div class="flex items-center justify-between w-full h-full">
      <!-- Avatar Section with Viewport Overlay -->
      <div
        class="relative flex items-center justify-center w-1/5 sm:w-1/6 md:w-1/5 h-full rounded-2xl"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full rounded-2xl object-cover"
        />
        <!-- Viewport Notice Overlay -->
        <div
          class="absolute bottom-2 left-2 text-white bg-primary/80 rounded-md text-xs md:text-sm p-1"
        >
          {{ displayStore.viewportSize }}
        </div>
      </div>

      <screen-debug />

      <!-- Dynamic Header Content -->
      <div class="flex flex-col flex-grow h-full w-full">
        <div class="flex items-center h-full w-full px-4">
          <!-- Title and Subtitle Section -->
          <div
            class="flex flex-col justify-center w-full px-2 sm:w-1/3"
          >
            <h1
              class="font-semibold text-md md:text-lg lg:text-xl xl:text-2xl leading-tight tracking-tight"
            >
              The {{ page?.title || 'Room' }} Room
            </h1>
            <h2
              class="italic text-xs md:text-sm lg:text-md xl:text-lg text-right truncate leading-tight mt-1 sm:mt-2"
            >
              {{ subtitle }}
            </h2>
          </div>

          <!-- Icons Section -->
          <div
            class="flex flex-wrap justify-end gap-2 sm:flex-row sm:justify-around sm:flex-grow md:space-x-2"
          >
            <login-path class="flex max-w-[80px]" />
            <jellybean-count class="flex max-w-[80px]" />
            <theme-icon class="flex max-w-[80px]" />
            <swarm-icon class="flex max-w-[80px]" />
          </div>
        </div>

        <!-- Mode Row (Ensuring Full Width & Proper Alignment) -->
        <div class="w-full flex justify-center">
          <ModeRow class="w-full flex-grow" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useLazyAsyncData } from '#app'
import type { ContentType } from '~/content.config'
import { useDisplayStore } from '@/stores/displayStore'

// Store for detecting screen size
const displayStore = useDisplayStore()
const isLargeScreen = ref(false)

// Detect screen size dynamically
onMounted(() => {
  isLargeScreen.value = window.innerWidth >= 1024
})

// Get the route params
const route = useRoute()

const { data: page } = useLazyAsyncData(route.path, async () => {
  return (await queryCollection('content')
    .path(route.path)
    .first()) as ContentType | null
})

const subtitle = computed(() => page.value?.subtitle ?? 'Welcome to Kind Robots')
</script>
