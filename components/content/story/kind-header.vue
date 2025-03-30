<template>
  <header
    v-if="hydrated"
    class="relative flex flex-col bg-base-300 rounded-2xl border-1 border-black max-w-full box-border"
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
      </div>

      <!-- Viewport Notice Overlay -->
      <div
        class="absolute bottom-0 left-2 mb-1 px-2 py-1 text-white bg-primary rounded-md text-xs md:text-sm"
      >
        {{ displayStore.viewportSize }}
      </div>

      <!-- Dynamic Header Content -->
      <div class="flex flex-col flex-1 h-full px-4">
        <right-toggle :style="rightToggleStyle" class="fixed z-50" />

        <big-toggle :style="leftToggleStyle" class="fixed z-50" />

        <div class="flex h-full w-full">
          <!-- Title and Subtitle -->
          <div class="flex flex-col justify-center w-full max-w-xl pr-2">
            <h1
              class="font-semibold text-md md:text-lg lg:text-xl xl:text-2xl leading-tight tracking-tight"
            >
              The {{ page?.title || 'Room' }} Room
            </h1>
            <h2
              class="italic text-xs md:text-sm lg:text-md xl:text-lg text-ellipsis"
            >
              {{ subtitle }}
            </h2>
          </div>

          <!-- Icons -->
          <div class="flex gap-2 justify-end flex-wrap items-center ml-auto">
            <login-path class="flex max-w-[80px]" />
            <jellybean-count class="flex max-w-[80px]" />
            <theme-icon class="flex max-w-[80px]" />
            <swarm-icon class="flex max-w-[80px]" />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()
const { page, subtitle } = storeToRefs(pageStore)

const leftToggleStyle = computed(() => displayStore.leftToggleStyle)
const rightToggleStyle = computed(() => displayStore.rightToggleStyle)

const hydrated = ref(false)
onMounted(() => {
  hydrated.value = true
})
</script>
