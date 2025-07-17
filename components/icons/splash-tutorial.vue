<template>
  <div
    v-if="pageStore.page"
    ref="scrollContainer"
    @scroll="handleScroll"
    class="relative w-full h-full overflow-y-auto rounded-2xl border-2 border-black z-20"
  >
    <!-- Parallax Background -->
    <div
      v-if="image"
      class="absolute top-0 left-0 w-full -z-10 overflow-hidden"
      :style="{
        height: parallaxHeight + 'px',
        transform: `translateY(${scrollOffset}px)`
      }"
    >
      <div
        class="parallax-image w-full h-full bg-cover bg-center transition-transform"
        :style="{ backgroundImage: `url('${resolvedImage}')` }"
      />
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
    </div>

    <!-- Foreground Content -->
    <div ref="contentContainer">
      <splash-content />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const scrollContainer = ref()
const contentContainer = ref()
const scrollOffset = ref(0)
const parallaxHeight = ref(1000) // fallback default

const image = computed(() => pageStore.page?.image)
const fallbackImage = '/images/botcafe.webp'
const resolvedImage = computed(() => {
  const img = image.value
  return img?.startsWith('/') ? img : `/images/${img ?? fallbackImage}`
})

function updateParallaxHeight() {
  if (contentContainer.value) {
    parallaxHeight.value = contentContainer.value.offsetHeight * 1.25
  }
}

function handleScroll() {
  scrollOffset.value = scrollContainer.value?.scrollTop * -0.2 || 0
}

onMounted(() => {
  updateParallaxHeight()
  window.addEventListener('resize', updateParallaxHeight)
})
</script>
