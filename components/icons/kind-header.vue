<!-- /components/content/icons/kind-header.vue -->

<template>
  <header class="relative bg-base-300 rounded-2xl w-full h-full box-border">
    <div class="flex w-full h-full items-stretch">
      <!-- Avatar with Overlay -->
      <div
        class="relative flex items-center justify-center overflow-hidden rounded-2xl min-w-20 h-full"
        :class="bigMode ? 'w-[13%]' : 'w-[20%]'"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full object-cover object-center rounded-2xl"
        />
        <div
          class="absolute bottom-1 left-1/2 -translate-x-1/2 z-40 text-white bg-primary rounded-md px-1 text-[10px] sm:text-xs md:text-sm"
        >
          {{ viewportSize }}
        </div>
      </div>

      <!-- Title / Subtitle -->
      <div
        v-if="!bigMode"
        class="hidden lg:flex flex-col justify-center items-center text-center w-[15%]"
      >
        <h1
          key="title"
          class="font-bold text-xl lg:text-2xl xl:text-3xl tracking-tight drop-shadow"
        >
          Kind {{ page?.title || 'Robots' }}
        </h1>
      </div>

      <!-- Smart Icons -->
      <div
        class="flex-grow h-full overflow-hidden px-2 flex items-center justify-end"
      >
        <smart-icons />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// /components/content/icons/kind-header.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const page = computed(() => pageStore.page)
const viewportSize = computed(() => displayStore.viewportSize)
const bigMode = computed(() => displayStore.bigMode)
</script>
