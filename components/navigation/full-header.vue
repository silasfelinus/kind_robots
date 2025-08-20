<!-- /components/content/navigation/full-header.vue -->
<template>
  <header class="bg-base-300 rounded-2xl w-full box-border overflow-visible">
    <!-- Single row (no h-full on the row) -->
    <div class="flex w-full items-center px-2 h-full">
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
          class="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 text-white bg-primary rounded-md px-1 text-[10px] sm:text-xs md:text-sm"
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

      <!-- Smart Icons (fills remaining) -->
      <div
        class="relative flex-grow h-full flex items-center justify-end overflow-visible"
      >
        <smart-icons class="h-full" />
      </div>
    </div>

    <!-- Overlays (no layout impact) -->
    <!-- Corner panel -->
    <div class="absolute inset-0 pointer-events-none z-50">
      <div class="absolute right-1 bottom-1 pointer-events-auto">
        <corner-panel v-if="displayStore.showCorner" class="mr-15" />
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
