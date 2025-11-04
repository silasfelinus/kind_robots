<!-- /components/content/icons/splash-tutorial.vue (wrapper) -->
<template>
  <div
    v-if="pageStore.page"
    class="relative w-full h-full overflow-y-auto rounded-2xl border-2 border-black z-20 bg-base-200/80"
  >
    <!-- Static Background Image Layer -->
    <div
      v-if="resolvedImage"
      class="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        class="w-full h-full bg-cover bg-center scale-105 opacity-70"
        :style="{ backgroundImage: `url('${resolvedImage}')` }"
      />
      <!-- Soft tint so content stays readable -->
      <div class="absolute inset-0 bg-base-200/80 mix-blend-multiply" />
      <div
        class="absolute inset-0 bg-gradient-to-b from-base-200/40 via-base-200/60 to-base-200/95"
      />
    </div>

    <!-- Foreground content -->
    <div class="relative z-10 flex flex-col min-h-full">
      <splash-content />
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
