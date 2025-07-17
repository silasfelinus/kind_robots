<template>
  <div
    v-if="pageStore.page"
    ref="scrollContainer"
    @scroll="handleScroll"
    class="relative w-full h-full overflow-y-auto rounded-2xl border-2 border-black z-20"
  >
    <!-- Parallax Background (in scroll context) -->
    <div
      v-if="image"
      class="absolute top-0 left-0 w-full h-[150%] -z-10 overflow-hidden"
      :style="{ transform: `translateY(${scrollOffset}px)` }"
    >
      <div
        class="parallax-image w-full h-full bg-cover bg-center transition-transform"
        :style="{ backgroundImage: `url('${resolvedImage}')` }"
      />
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
    </div>

    <!-- Main Content -->
    <splash-content />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const scrollContainer = ref()
const scrollOffset = ref(0)

const image = computed(() => pageStore.page?.image)
const fallbackImage = '/images/botcafe.webp'
const resolvedImage = computed(() => {
  const img = image.value
  return img?.startsWith('/') ? img : `/images/${img ?? fallbackImage}`
})

function handleScroll() {
  const scrollTop = scrollContainer.value?.scrollTop || 0
  scrollOffset.value = scrollTop * -0.2
}
</script>

<style scoped>
.parallax-image {
  background-size: cover;
  background-position: center top;
}
</style>
