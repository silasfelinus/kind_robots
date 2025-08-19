<!-- /components/content/icons/kind-header.vue -->
<template>
  <header
    class="relative bg-base-300 rounded-2xl w-full box-border overflow-visible"
  >
    <!-- Single row only; NEVER use h-full on the row -->
    <div class="flex w-full items-stretch px-2" :class="rowHeight">
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
          class="absolute bottom-1 left-1/2 -translate-x-1/2 z-40 text-white bg-primary rounded-md px-1 text-[10px] sm:text-xs md:text-sm"
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

      <!-- Smart Icons -->
      <div class="flex-grow flex items-center justify-end overflow-hidden">
        <!-- Give icons their own explicit height; DO NOT pad for corner panel -->
        <smart-icons class="h-10 md:h-12" />
      </div>
    </div>

    <!-- Corner Panel: anchored bottom-right INSIDE header, floats over content -->
    <div class="absolute bottom-1 right-1 z-[80] pointer-events-none">
      <corner-panel v-if="showCorner" class="pointer-events-auto" />
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

// Explicit row heights; avoid h-full anywhere to prevent phantom space
const rowHeight = computed(() =>
  bigMode.value ? 'h-12 md:h-14' : 'h-16 md:h-20',
)

// Support either flag
const showCorner = computed(() => {
  // @ts-ignore
  return !!(displayStore.showCorner ?? displayStore.showCounter)
})
</script>
