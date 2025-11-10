<!-- /components/navigation/smart-flip.vue -->
<template>
  <section
    class="relative w-full max-w-4xl h-[90%] mx-auto rounded-3xl border-2 border-black bg-base-100/95 shadow-xl overflow-hidden"
  >
    <div class="flip-card w-full h-full">
      <div
        ref="flipInner"
        class="flip-card-inner w-full h-full"
        :class="{
          'is-flipped': flipped,
        }"
        @transitionend="onFlipTransitionEnd"
      >
        <div
          class="flip-side flip-front"
          :class="{
            'flip-static-visible': !flipped,
            'flip-static-hidden': flipped,
          }"
        >
          <smart-front />
        </div>

        <div
          class="flip-side flip-back"
          :class="{
            'flip-static-visible': flipped,
            'flip-static-hidden': !flipped,
          }"
        >
          <smart-back />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/navigation/smart-flip.vue
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const flipInner = ref<HTMLElement | null>(null)
const isAnimating = ref(false)
const displayStore = useDisplayStore()

const flipped = computed(() => displayStore.SmartState === 'ami')

watch(
  () => displayStore.SmartState,
  (newState, oldState) => {
    if (newState === oldState) return

    isAnimating.value = true

    nextTick(() => {
      if (flipInner.value) {
        void flipInner.value.offsetWidth
      }
    })
  },
)

const onFlipTransitionEnd = (event: TransitionEvent) => {
  if (event.propertyName !== 'transform') return
  isAnimating.value = false
}

onMounted(() => {
  if (flipInner.value) {
    void flipInner.value.offsetWidth
  }
})
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  width: 100%;
  height: 100%;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-side {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}

.flip-side > * {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-back {
  transform: rotateY(180deg);
}

.flip-static-visible {
  display: block !important;
}

.flip-static-hidden {
  display: none !important;
}
</style>
