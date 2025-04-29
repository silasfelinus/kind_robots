<!-- /components/content/resonance/resonance-display.vue -->
<template>
  <div
    class="relative w-full h-full flex flex-col items-center justify-center bg-base-200 rounded-2xl overflow-hidden"
  >
    <!-- Current Image -->
    <transition name="fade" mode="out-in">
      <img
        v-if="currentImageUrl"
        :key="currentImageUrl"
        :src="currentImageUrl"
        alt="Current Resonance"
        class="w-full h-full object-cover rounded-2xl"
      />
    </transition>

    <!-- Overlay: Seed Text (optional) -->
    <div
      v-if="seedText"
      class="absolute inset-0 flex flex-col items-center justify-end bg-black/20 p-6 pointer-events-none"
    >
      <transition-group
        name="slide-up"
        tag="div"
        class="space-y-2 w-full text-center"
      >
        <p
          key="seedText"
          class="text-lg md:text-2xl text-white font-light drop-shadow-lg animate-pulse"
        >
          {{ seedText }}
        </p>
      </transition-group>
    </div>

    <!-- (Optional) Debug Info -->
    <div
      v-if="debug"
      class="absolute top-2 left-2 bg-black/40 text-xs text-white p-2 rounded-md"
    >
      <div>Running: {{ running ? 'Yes' : 'No' }}</div>
      <div>Interval: {{ intervalMs }} ms</div>
      <div>Mask: {{ imageMask }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/resonance/resonance-display.vue
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useResonanceStore } from '@/stores/resonanceStore'

const resonanceStore = useResonanceStore()

const debug = ref(false)
let intervalHandle: ReturnType<typeof setInterval> | null = null

const currentImageUrl = computed(() => {
  const artId = resonanceStore.resonanceForm.currentArtId
  if (!artId) return null
  return `/api/art/${artId}` // Example path — adjust if you serve images differently
})

const seedText = computed(() => resonanceStore.resonanceForm.seedText || '')
const imageMask = computed(() => resonanceStore.resonanceForm.imageMask ?? 50)
const running = computed(() => resonanceStore.running)
const intervalMs = computed(
  () => resonanceStore.resonanceForm.iteration || 5000,
)

// --- Auto-update Logic based on Running State ---
const setupAutoAdvance = () => {
  if (intervalHandle) clearInterval(intervalHandle)

  if (running.value) {
    intervalHandle = setInterval(() => {
      console.log('[resonance-display] Auto advance triggered.')
      resonanceStore.nextArtAsset()
    }, intervalMs.value)
  }
}

onMounted(() => {
  setupAutoAdvance()

  // Watch for running state changes
  watch(running, (newRunning) => {
    if (newRunning) {
      setupAutoAdvance()
    } else {
      if (intervalHandle) clearInterval(intervalHandle)
    }
  })

  // Watch if interval timing changes
  watch(intervalMs, (newInterval) => {
    if (running.value) {
      setupAutoAdvance()
    }
  })
})

onUnmounted(() => {
  if (intervalHandle) clearInterval(intervalHandle)
})
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
