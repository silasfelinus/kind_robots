<!-- /components/content/icons/splash-content.vue -->
<template>
  <div
    ref="contentContainer"
    class="relative z-20 w-full max-w-4xl mx-auto px-4 py-6 h-[min(80vh,720px)] overflow-x-hidden"
  >
    <section
      class="relative overflow-hidden rounded-3xl border border-black bg-base-200/90 shadow-xl h-full px-2 py-3 sm:px-4 sm:py-4"
    >
      <div class="flip-card h-full w-full">
        <div
          class="flip-card-inner h-full w-full"
          :class="{ 'is-flipped': flipped }"
        >
          <!-- FRONT SIDE: title-card + ami-chat as two separate cards -->
          <div class="flip-side flip-front">
            <div class="h-full w-full overflow-y-auto overflow-x-hidden">
              <div class="space-y-4 sm:space-y-5 max-w-full">
                <div
                  class="rounded-2xl border border-base-300 bg-base-100/95 shadow-md px-4 py-4 sm:px-6 sm:py-5"
                >
                  <title-card />
                </div>

                <div
                  class="rounded-2xl border border-base-300 bg-base-100 shadow-md px-4 py-4 sm:px-6 sm:py-5"
                >
                  <ami-chat />
                </div>
              </div>
            </div>
          </div>

          <!-- BACK SIDE: smart-panel as a single independent card, no extra padding from flip-card -->
          <div class="flip-side flip-back">
            <div class="h-full w-full overflow-y-auto overflow-x-hidden">
              <smart-panel />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="absolute top-4 right-5 z-20 inline-flex items-center gap-1 rounded-full border border-base-300 bg-base-100/95 px-3 py-1 text-[0.65rem] sm:text-xs font-semibold shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
        @click="flipped = !flipped"
      >
        <Icon v-if="!flipped" name="kind-icon:arrow-right" class="w-3 h-3" />
        <Icon v-else name="kind-icon:arrow-left" class="w-3 h-3" />
        <span class="hidden sm:inline">
          {{ flipped ? 'Details' : 'Browse' }}
        </span>
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/splash-content.vue
import { ref, onMounted } from 'vue'
import { Icon } from '#components'
import { useNavStore } from '@/stores/navStore'

const contentContainer = ref<HTMLElement | null>(null)
const flipped = ref(false)
const navStore = useNavStore()

onMounted(async () => {
  if (!navStore.isInitialized) {
    await navStore.initialize()
  }
  navStore.setActiveModelType(null)
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
  backface-visibility: hidden;
}

.flip-back {
  transform: rotateY(180deg);
}
</style>
