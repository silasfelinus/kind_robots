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
      class="pointer-events-none absolute top-0 left-0 w-full -z-10 overflow-hidden"
      :style="{ height: parallaxHeight + 'px' }"
    >
      <div
        class="parallax-image w-full h-full bg-cover bg-center transition-transform will-change-transform"
        :style="{
          backgroundImage: `url('${resolvedImage}')`,
          transform: `translateY(${scrollOffset}px)`,
        }"
      />
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
    </div>

    <!-- Foreground Content -->
    <div>
      <splash-content />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const scrollContainer = ref<HTMLElement | null>(null)
const scrollOffset = ref(0)
const parallaxHeight = ref(0)

const image = computed(() => pageStore.page?.image)
const fallbackImage = '/images/botcafe.webp'
const resolvedImage = computed(() => {
  const img = image.value
  return img?.startsWith('/') ? img : `/images/${img ?? fallbackImage}`
})

function handleScroll() {
  const el = scrollContainer.value
  if (el) {
    scrollOffset.value = el.scrollTop * -0.2
  }
}

function updateParallaxHeight() {
  const el = scrollContainer.value
  if (el) {
    const contentHeight = el.scrollHeight
    parallaxHeight.value = Math.max(contentHeight + 200, window.innerHeight)
  }
}

let observer: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    updateParallaxHeight()
    if (scrollContainer.value) {
      observer = new ResizeObserver(updateParallaxHeight)
      observer.observe(scrollContainer.value)
    }
    window.addEventListener('resize', updateParallaxHeight)
  })
})

onBeforeUnmount(() => {
  if (observer && scrollContainer.value) {
    observer.unobserve(scrollContainer.value)
  }
  window.removeEventListener('resize', updateParallaxHeight)
})
</script>

<style scoped>
.parallax-image {
  background-size: cover;
  background-position: center top;
  min-height: 100vh;
}
</style>
