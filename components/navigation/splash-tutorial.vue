<!-- /components/content/icons/splash-tutorial.vue -->
<template>
  <div
    v-if="pageStore.page"
    class="relative w-full h-full rounded-2xl z-20 bg-base-200/80 overflow-hidden"
  >
    <div
      v-if="resolvedImage"
      class="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        class="w-full h-full bg-cover bg-center"
        :style="{ backgroundImage: `url('${resolvedImage}')` }"
      />
    </div>

    <div class="relative z-10 w-full h-full flex items-center justify-center">
      <div
        class="w-full h-full flex items-center justify-center px-1 md:px-2 lg:px-3 xl:px-4 py-[5%]"
      >
        <smart-flip class="w-full h-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/splash-tutorial.vue
import { computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const fallbackImage = '/images/botcafe.webp'
const image = computed(() => pageStore.page?.image)

const resolvedImage = computed(() => {
  const img = image.value || fallbackImage
  return img.startsWith('/') ? img : `/images/${img}`
})
</script>