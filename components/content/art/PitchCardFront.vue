<template>
  <div
    v-if="pitch"
    class="flex flex-col items-center rounded-2xl hover:shadow-lg p-4 bg-base-200"
  >
    <!-- Avatar Image -->
    <img :src="avatarImage" alt="Avatar" class="rounded-full w-16 h-16 mb-2" />

    <!-- Title -->
    <div class="text-lg font-semibold mb-2">
      {{ pitch.title }}
    </div>

    <!-- Pitch Description -->
    <div class="text-sm text-gray-500 mb-2">
      {{ pitch.pitch }}
    </div>

    <!-- Flavor Text -->
    <div class="text-xs text-gray-400 mb-2">
      {{ pitch.flavorText }}
    </div>

    <!-- Designer Tooltip -->
    <div class="relative">
      <div
        class="text-sm text-gray-500 cursor-pointer"
        @mouseover="showTooltip"
        @mouseleave="hideTooltip"
      >
        {{ pitch.designer }}
      </div>
      <div
        v-if="tooltipVisible"
        class="absolute left-0 top-full text-xs bg-base-100 p-1 rounded"
      >
        {{ pitch.designer }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Pitch } from '@/stores/pitchStore'

const {
  pitch = {
    title: 'Presto-Chango',
    pitch: 'Here today, gone tomorrow',
    flavorText: 'Now you see me...',
    designer: 'Harriet Whodunnit',
  },
} = defineProps<{
  pitch?: Pitch
}>()
const avatarImage = '/images/kindtitle.webp'
const tooltipVisible = ref(false)

const showTooltip = () => {
  tooltipVisible.value = true
}

const hideTooltip = () => {
  tooltipVisible.value = false
}
</script>
