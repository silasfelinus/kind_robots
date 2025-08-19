<!-- /components/content/layout/full-header.vue -->
<template>
  <header class="relative bg-base-300 rounded-2xl w-full box-border">
    <!-- Single row: Avatar + (optional) title + spacer -->
    <div class="flex w-full items-stretch h-14 md:h-16 px-2">
      <!-- Avatar -->
      <div
        class="relative flex items-center justify-center overflow-hidden rounded-2xl min-w-20 h-full"
        :class="bigMode ? 'w-[13%]' : 'w-[20%]'"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full object-cover object-center rounded-2xl"
        />
        <div
          class="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 text-white bg-primary rounded-md px-1 text-[10px] sm:text-xs md:text-sm"
        >
          {{ viewportSize }}
        </div>
      </div>

      <!-- Title (hidden in bigMode) -->
      <div
        v-if="!bigMode"
        class="hidden lg:flex flex-col justify-center items-center text-center w-[15%]"
      >
        <h1
          class="font-bold text-xl lg:text-2xl xl:text-3xl tracking-tight drop-shadow"
        >
          Kind {{ page?.title || 'Robots' }}
        </h1>
      </div>

      <div class="flex-grow" />
    </div>

    <!-- FLOATING LAYER: Smart Icons + Corner Panel -->
    <!-- Lives outside document flow; does NOT change layout height -->
    <div class="pointer-events-none absolute inset-x-0 top-full mt-2 z-[60]">
      <div class="pointer-events-auto px-2">
        <smart-icons />
        <corner-panel v-if="displayStore.showCorner" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const page = computed(() => pageStore.page)
const viewportSize = computed(() => displayStore.viewportSize)
const bigMode = computed(() => displayStore.bigMode)
</script>
