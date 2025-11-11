<!-- /components/navigation/smart-flip.vue -->
<template>
  <section class="relative w-full max-w-4xl h-[90%] mx-auto overflow-visible">
    <div class="flip-card w-full h-full">
      <div
        ref="flipInner"
        class="flip-card-inner w-full h-full"
        :class="{ 'is-flipped': flipped }"
        @transitionend="onFlipTransitionEnd"
      >
        <div
          class="flip-side flip-front rounded-3xl border-2 border-black shadow-xl bg-base-100/95"
        >
          <smart-front />
        </div>

        <div
          class="flip-side flip-back rounded-3xl border-2 border-black shadow-xl bg-base-100/95"
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

const flipped = computed(() => displayStore.SmartState === 'back')

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
  transition: transform 0.6s;
  transform-style: preserve-3d;
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

.flip-front {
  transform: rotateY(0deg);
}

.flip-back {
  transform: rotateY(180deg);
}
</style>
