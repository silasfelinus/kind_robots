<!-- /components/content/navigation/full-header.vue -->
<template>
  <header
    class="bg-base-300 rounded-2xl w-full h-full px-2 flex items-stretch overflow-visible [isolation:isolate]"
  >
    <!-- Avatar -->
    <div
      class="relative flex-none h-full w-20 md:w-24 rounded-2xl overflow-hidden"
    >
      <avatar-image
        alt="User Avatar"
        class="h-full w-full object-cover object-center"
      />
      <div
        class="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 text-white bg-primary rounded-md px-1 text-[10px] sm:text-xs md:text-sm"
      >
        {{ viewportSize }}
      </div>
    </div>

    <!-- Title -->
    <div
      v-if="!bigMode"
      class="hidden lg:flex h-full items-center justify-center px-2"
    >
      <h1
        class="font-bold text-xl lg:text-2xl xl:text-3xl tracking-tight leading-none"
      >
        Kind {{ page?.title || 'Robots' }}
      </h1>
    </div>

    <!-- Smart Icons -->
    <div class="flex-1 min-w-0 h-full flex items-center">
      <smart-icons class="h-full w-full" />
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
