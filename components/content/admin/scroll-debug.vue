<!-- /components/content/admin/scroll-debug.vue -->
<template>
  <div
    class="fixed bottom-2 left-2 z-[9999] text-white text-xs px-3 py-2 rounded-xl shadow-md font-mono pointer-events-none"
    :class="scrollBroken ? 'bg-red-800' : 'bg-black bg-opacity-80'"
  >
    <div>Page: {{ pageHeight }}px</div>
    <div>Viewport: {{ windowHeight }}px</div>
    <div v-if="scrollBroken" class="text-yellow-300">Scroll broken!</div>
    <ul class="mt-1 max-h-32 overflow-y-auto">
      <li
        v-for="block in blockingElements"
        :key="block.selector"
        class="text-red-400 truncate"
      >
        {{ block.selector }} → {{ block.overflow }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const pageHeight = ref(0)
const windowHeight = ref(0)
const blockingElements = ref<{ selector: string; overflow: string }[]>([])

const scrollBroken = computed(() => pageHeight.value <= windowHeight.value)

const getSelector = (el: HTMLElement) => {
  if (el.id) return `#${el.id}`
  if (el.className && typeof el.className === 'string') {
    return '.' + el.className.split(' ').join('.')
  }
  return el.tagName.toLowerCase()
}

const scanForOverflowHidden = () => {
  if (typeof document === 'undefined') return

  const offenders: { selector: string; overflow: string }[] = []
  document.querySelectorAll('*').forEach((el) => {
    const style = getComputedStyle(el)
    if (
      (style.overflow === 'hidden' || style.overflowY === 'hidden') &&
      el.scrollHeight > el.clientHeight
    ) {
      offenders.push({
        selector: getSelector(el as HTMLElement),
        overflow: `${style.overflowY}`,
      })
    }
  })
  blockingElements.value = offenders.slice(0, 20)
}

const updateMetrics = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  pageHeight.value = document.documentElement.scrollHeight
  windowHeight.value = window.innerHeight
  scanForOverflowHidden()
}

onMounted(() => {
  if (typeof window === 'undefined') return

  updateMetrics()
  window.addEventListener('resize', updateMetrics)
  window.addEventListener('scroll', updateMetrics)
})

onUnmounted(() => {
  if (typeof window === 'undefined') return

  window.removeEventListener('resize', updateMetrics)
  window.removeEventListener('scroll', updateMetrics)
})
</script>
