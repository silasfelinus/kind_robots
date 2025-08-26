<!-- /components/content/navigation/full-header.vue -->
<template>
  <header
    class="relative w-full h-full rounded-2xl bg-base-300 overflow-visible [isolation:isolate]"
  >
    <div class="flex items-stretch w-full h-full gap-0">
      <!-- Avatar -->
      <div
        class="relative flex-none h-full w-[16%] rounded-2xl overflow-hidden"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full object-cover object-center"
        />
        <div
          class="absolute bottom-[2%] left-1/2 -translate-x-1/2 z-50 text-white bg-primary/90 rounded-md px-[1%] text-[0.8rem] leading-none"
        >
          {{ viewportSize }}
        </div>
      </div>

      <!-- Title: no vertical padding, fills height, scales to available space -->
      <div
        v-if="!bigMode"
        class="flex-[3_1_0%] min-w-0 h-full flex items-stretch"
      >
        <h1
          class="m-0 w-full h-full flex items-center truncate font-bold tracking-tight leading-none text-left px-[0.5%] text-[min(8vh,8vw)]"
        >
          Kind {{ page?.title || 'Robots' }}
        </h1>
      </div>

      <!-- Smart Icons: middle lane -->
      <div class="flex-[2_1_0%] min-w-0 h-full flex items-stretch">
        <smart-icons class="h-full w-full" />
      </div>

      <!-- Smart Toggles: right column (no absolute) -->
      <div class="flex-none h-full w-[10%]">
        <smart-toggles class="h-full w-full" />
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
