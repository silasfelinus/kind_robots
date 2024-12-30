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
      <Icon :name="toggleIcon" class="w-16 h-16 text-6xl opacity-80" />
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

const contentStore = useContentStore()
const showText = ref(false)

const toggleInfo = () => {
  // Assuming toggleInfo is a method within contentStore that toggles showInfo state
  contentStore.toggleInfo()
}

const toggleIcon = computed(() => {
  // Access showInfo from contentStore
  return contentStore.showInfo ? 'kind-icon:chatbubbles' : 'kind-icon:chat-off'
})

const tooltipText = computed(() => {
  // Access showInfo from contentStore
  return contentStore.showInfo ? 'Hide Info' : 'Show Info'
})
</script>
