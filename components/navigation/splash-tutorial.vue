<!-- /components/navigation/splash-tutorial.vue -->
<template>
  <div
    v-if="pageStore.page"
    class="flex h-full w-full flex-col gap-3 overflow-x-hidden overflow-y-auto md:gap-4"
  >
    <!-- Title card -->
    <div class="w-full overflow-x-hidden">
      <title-card />
    </div>

    <!-- Chat -->
    <div class="w-full overflow-x-hidden">
      <ami-chat class="w-full" />
    </div>

    <!-- Page image with gradient overlay -->
    <div v-if="pageImage" class="w-full overflow-x-hidden">
      <div
        class="relative aspect-video w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200/70 md:aspect-21/9g:aspect-[3/1]"
      >
        <NuxtImg
          :src="pageImage"
          alt="Room illustration"
          :sizes="imageSizes"
          class="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <!-- Subtle gradient overlay for readability -->
        <div
          class="absolute inset-0 bg-linear-to-t from-base-300/40 via-transparent to-transparent"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
