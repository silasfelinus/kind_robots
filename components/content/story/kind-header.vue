<template>
  <header
    v-if="hydrated"
    class="relative flex flex-col bg-base-300 rounded-2xl border border-black w-full max-w-screen-2xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2"
  >
    <!-- Top Section -->
    <div class="flex flex-wrap items-center justify-between w-full gap-4">
      <!-- Avatar -->
      <div
        class="flex items-center w-16 sm:w-20 h-16 sm:h-20 rounded-2xl overflow-hidden"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full object-cover rounded-2xl"
        />
      </div>

      <!-- Viewport Notice -->
      <div
        class="absolute bottom-1 left-2 px-2 py-1 text-white bg-primary rounded-md text-xs sm:text-sm"
      >
        {{ displayStore.viewportSize }}
      </div>

      <!-- Header Content -->
      <div class="flex-1 flex flex-col gap-2 min-w-[200px]">
        <right-toggle :style="rightToggleStyle" class="fixed z-50" />
        <big-toggle :style="leftToggleStyle" class="fixed z-50" />

        <!-- Title / Subtitle -->
        <div class="flex flex-col">
          <h1
            class="font-semibold text-base sm:text-lg md:text-xl xl:text-2xl leading-tight tracking-tight"
          >
            The {{ page?.title || 'Room' }} Room
          </h1>
          <h2
            class="italic text-xs sm:text-sm md:text-base xl:text-lg text-ellipsis"
          >
            {{ subtitle }}
          </h2>
        </div>
      </div>

      <!-- Icons -->
      <div class="flex flex-wrap justify-end gap-2 sm:gap-4 ml-auto max-w-full">
        <login-path class="flex max-w-[80px]" />
        <jellybean-count class="flex max-w-[80px]" />
        <theme-icon class="flex max-w-[80px]" />
        <swarm-icon class="flex max-w-[80px]" />
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
