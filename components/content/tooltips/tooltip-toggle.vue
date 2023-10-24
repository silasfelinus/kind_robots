<template>
  <div
    class="relative flex flex-col items-center justify-center w-20 h-20"
    @mouseover="showText = true"
    @mouseleave="showText = false"
  >
    <button
      class="focus:outline-none transition-transform duration-200 transform hover:scale-110"
      @click="toggleInfo"
    >
      <icon :name="toggleIcon" class="w-16 h-16 text-6xl opacity-80" />
    </button>
    <p
      v-if="showText"
      class="text-sm absolute bottom-0 transition-opacity duration-300 opacity-100 pointer-events-none"
    >
      {{ tooltipText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const showText = ref(false)

const toggleInfo = () => {
  pageStore.toggleInfo()
}

const toggleIcon = computed(() => {
  return pageStore.showInfo ? 'mdi:chat-outline' : 'carbon:chat-off'
})

const tooltipText = computed(() => {
  return pageStore.showInfo ? 'Hide Info' : 'Show Info'
})
</script>
