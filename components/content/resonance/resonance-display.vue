<!-- /components/content/resonance/resonance-display.vue -->
<template>
  <div
    class="relative w-full h-full flex flex-col items-center justify-center bg-base-200 rounded-2xl overflow-hidden"
  >
    <!-- Current Image -->
    <transition name="fade" mode="out-in">
      <img
        v-if="currentImage"
        :key="currentImage"
        :src="currentImage"
        alt="Current Resonance"
        class="w-full h-full object-cover rounded-2xl"
      />
    </transition>

    <!-- Overlay: Story Text -->
    <div
      class="absolute inset-0 flex flex-col items-center justify-end bg-black/20 p-6 space-y-4 pointer-events-none"
    >
      <transition-group
        name="slide-up"
        tag="div"
        class="space-y-2 w-full text-center"
      >
        <p
          v-for="(line, index) in currentChapterText"
          :key="index"
          class="text-lg md:text-2xl text-white font-light drop-shadow-lg animate-pulse"
        >
          {{ line }}
        </p>
      </transition-group>
    </div>

    <!-- (Optional) Debug Info -->
    <div
      v-if="debug"
      class="absolute top-2 left-2 bg-black/40 text-xs text-white p-2 rounded-md"
    >
      <div>Inputs: {{ activeInputs.join(', ') }}</div>
      <div>Source: {{ inputSource }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/resonance/resonance-display.vue
import { computed, ref } from 'vue'
import { useResonanceStore } from '@/stores/resonanceStore'

const resonanceStore = useresonanceStore()

const debug = ref(false)

const currentImage = computed(() => resonanceStore.currentImage)
const currentChapterText = computed(
  () => resonanceStore.currentChapter.text || [],
)
const activeInputs = computed(() => resonanceStore.activeInputs)
const inputSource = computed(() => resonanceStore.inputSource)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition:
    transform 0.8s ease,
    opacity 0.8s ease;
}
.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}
</style>
