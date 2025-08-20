<!-- /components/content/navigation/full-header.vue -->
<template>
  <header
    class="bg-base-300 rounded-2xl w-full box-border overflow-visible [isolation:isolate]"
  >
    <!-- Single row (explicit height; no h-full), kill line-height -->
    <div class="descender-fix flex w-full items-center px-2 h-14 md:h-16 leading-none">
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
        <h1 class="font-bold text-xl lg:text-2xl xl:text-3xl tracking-tight leading-none">
          Kind {{ page?.title || 'Robots' }}
        </h1>
      </div>

      <!-- Smart Icons (fills remaining; shrinkable) -->
      <div
        class="relative flex-grow min-w-0 h-full flex items-center justify-end overflow-visible"
      >
        <smart-icons class="h-full w-full" />
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

<style scoped>
/* Remove inline descender gaps under images/SVGs inside the row */
.descender-fix :where(img, svg) { display: block; }
/* Defensive: remove extra gap under Nuxt Icon component wrappers too */
.descender-fix :where([data-icon], .icon, i) { display: inline-flex; }
</style>
