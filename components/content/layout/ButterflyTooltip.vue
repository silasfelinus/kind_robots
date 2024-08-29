<template>
  <div class="fixed bottom-4 right-4" @click="toggleTooltip">
    <!-- Pulsing Butterfly Icon -->
    <div v-if="!tooltipOpen && page.tooltip" class="cursor-pointer">
      <Icon name="ph:butterfly-duotone" class="text-3xl animate-pulse" />
    </div>

    <!-- Tooltip Popup -->
    <div
      v-else-if="tooltipOpen && page.tooltip"
      class="tooltip-popup bg-base-200 p-4 rounded-2xl border"
    >
      <div v-if="page.tooltip">
        <span class="font-semibold">
          <butterfly-loader />
          <Icon name="mdi:chat" class="text-default mr-2 text-2xl" />AMI Says:
          <!-- Display tooltip text -->
          <span class="text-default text-xl">{{ page.tooltip }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useContentStore } from './../../../stores/contentStore'

const contentStore = useContentStore()
const tooltipOpen = ref(false)

// Destructure `page` from contentStore
const { page } = contentStore

// Toggle tooltip visibility
const toggleTooltip = () => {
  tooltipOpen.value = !tooltipOpen.value
}
</script>

<style scoped>
.tooltip-popup {
  max-width: 300px;
}
</style>
