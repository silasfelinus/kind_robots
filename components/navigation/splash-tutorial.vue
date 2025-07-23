<template>
  <div
    v-if="pageStore.page"
    ref="scrollContainer"
    @scroll.passive="handleScroll"
    class="relative w-full h-full overflow-y-auto rounded-2xl border-2 border-black z-20"
  >
    <!-- Parallax Background -->
    <div
      v-if="resolvedImage"
      class="pointer-events-none absolute top-0 left-0 w-full -z-10 overflow-hidden"
      :style="{ height: parallaxHeight + 'px' }"
    >
      <div
        class="parallax-image w-full h-full bg-cover bg-center will-change-transform"
        :style="{
          backgroundImage: `url('${resolvedImage}')`,
          transform: `translateY(${scrollOffset}px)`,
        }"
      />
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
    </div>

    <!-- Foreground Structured Sections -->
    <div
      class="relative z-10 flex flex-col gap-6 p-4 sm:p-6 md:p-8 min-h-[120vh]"
    >
      <!-- Section: Splash Nav -->
      <div
        class="min-h-[40vh] overflow-y-auto rounded-2xl border border-base-300 bg-base-100/80 p-4"
      >
        <splash-nav />
      </div>

      <!-- Section: Title and Section Content -->
      <div
        class="min-h-[40vh] overflow-y-auto rounded-2xl border border-base-300 bg-base-200/70 p-4"
      >
        <splash-content />
      </div>

      <!-- Section: Chat Tips or Guidance -->
      <div
        class="min-h-[40vh] overflow-y-auto rounded-2xl border border-base-300 bg-base-100/80 p-4"
      >
        <div class="text-base-content/70 font-mono text-sm">
          <p class="mb-2">💡 <strong>Tips from AMI:</strong></p>
          <ul class="list-disc list-inside space-y-1">
            <li>Tap a navigation style to get started.</li>
            <li>Scroll through the tutorial sections at your pace.</li>
            <li>Need a reset? Hit the 🔄 toggle to start fresh.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const scrollContainer = ref<HTMLElement | null>(null)
const scrollOffset = ref(0)
const parallaxHeight = ref(0)

const fallbackImage = '/images/botcafe.webp'

const image = computed(() => pageStore.page?.image)
const resolvedImage = computed(() => {
  const img = image.value || fallbackImage
  return img.startsWith('/') ? img : `/images/${img}`
})

let ticking = false
function handleScroll() {
  const el = scrollContainer.value
  if (!el) return
  if (!ticking) {
    ticking = true
    requestAnimationFrame(() => {
      scrollOffset.value = el.scrollTop * -0.2
      ticking = false
    })
  }
}

function updateParallaxHeight() {
  const el = scrollContainer.value
  if (el) {
    const buffer = 300
    const visibleHeight = el.clientHeight
    parallaxHeight.value = Math.max(
      visibleHeight + buffer,
      window.innerHeight + buffer,
    )
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

watch(
  () => pageStore.page,
  () => {
    nextTick(() => {
      requestAnimationFrame(() => {
        updateParallaxHeight()
        setTimeout(updateParallaxHeight, 300)
      })
    })
  },
)
</script>

<style scoped>
.parallax-image {
  background-size: cover;
  background-position: center top;
  min-height: 100vh;
  will-change: transform;
  transform: translateZ(0);
  transition: transform 0.1s ease-out;
}
</style>
