<!-- /components/navigation/splash-tutorial.vue -->
<template>
  <div
    v-if="pageStore.page"
    class="flex w-full flex-col gap-2 overflow-x-hidden md:gap-3 lg:gap-4"
  >
    <div class="w-full overflow-x-hidden">
      <title-card />
    </div>

    <div class="w-full overflow-x-hidden">
      <smart-panel />
    </div>

    <div v-if="pageImage" class="w-full overflow-x-hidden">
      <div
        class="relative aspect-video w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200/70 md:aspect-21/9 lg:aspect-3/1"
      >
        <NuxtImg
          :src="pageImage"
          alt="Room illustration"
          :sizes="imageSizes"
          class="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    </div>

    <div class="flex-1 min-h-16" />

    <div class="w-full overflow-x-hidden">
      <ami-chat class="w-full" />
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/splash-tutorial.vue
import { computed } from 'vue'
import { NuxtImg } from '#components'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const image = computed(() => pageStore.page?.image || '')

const pageImage = computed(() => {
  const img = image.value
  if (!img) return ''
  return img.startsWith('/') ? img : `/images/${img}`
})

const imageSizes = computed(
  () => '(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1024px',
)
</script>
