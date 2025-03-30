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

      <!-- Main content wrapper -->
      <div class="flex flex-col flex-1 px-4 py-2 w-full">
        <right-toggle :style="rightToggleStyle" class="fixed z-50" />
        <big-toggle :style="leftToggleStyle" class="fixed z-50" />

        <!-- Flex container with responsive wrap -->
        <div class="flex flex-wrap gap-4 items-center justify-between w-full">
          <!-- Title/Subtitle -->
          <div
            class="flex flex-col justify-center flex-1 min-w-[200px] max-w-xl"
          >
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

          <!-- Icons with wrap and spacing -->
          <div class="flex flex-wrap justify-end gap-2 max-w-full">
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
