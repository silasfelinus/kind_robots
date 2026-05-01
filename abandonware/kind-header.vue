<!-- /components/content/icons/kind-header.vue -->
<template>
  <header class="relative h-full w-full rounded-2xl bg-base-300 box-border">
    <div class="flex h-full w-full items-stretch">
      <div
        class="relative flex h-full min-w-20 items-center justify-center overflow-hidden rounded-2xl"
        :class="isCompactHeader ? 'w-[13%]' : 'w-[20%]'"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full rounded-2xl object-cover object-center"
        />

        <div
          class="absolute bottom-1 left-1/2 z-40 -translate-x-1/2 rounded-md bg-primary px-1 text-[10px] text-white sm:text-xs md:text-sm"
        >
          {{ viewportSize }}
        </div>
      </div>

      <div
        v-if="!isCompactHeader"
        class="hidden w-[15%] flex-col items-center justify-center text-center lg:flex"
      >
        <h1
          key="title"
          class="text-xl font-bold tracking-tight drop-shadow lg:text-2xl xl:text-3xl"
        >
          Kind {{ page?.title || 'Robots' }}
        </h1>
      </div>

      <div
        v-if="displayStore.showCorner"
        class="z-50 flex h-full grow items-center justify-end overflow-hidden px-2"
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
const isCompactHeader = computed(() => displayStore.headerState === 'compact')
</script>
