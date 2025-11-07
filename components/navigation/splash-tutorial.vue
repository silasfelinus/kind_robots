<!-- /components/content/icons/splash-tutorial.vue -->
<template>
  <div
    v-if="pageStore.page"
    class="relative w-full min-h-full rounded-2xl border-2 border-black z-20 bg-base-200/80 overflow-hidden"
  >
    <!-- Static Background Image Layer -->
    <div
      v-if="resolvedImage"
      class="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        class="w-full h-full bg-cover bg-center scale-105 opacity-70"
        :style="{ backgroundImage: `url('${resolvedImage}')` }"
      />
      <div class="absolute inset-0 bg-base-200/80 mix-blend-multiply" />
      <div
        class="absolute inset-0 bg-gradient-to-b from-base-200/40 via-base-200/60 to-base-200/95"
      />
    </div>

    <!-- Foreground content (card stays static; inner content scrolls) -->
    <div class="relative z-10 flex flex-col min-h-full">
      <div
        ref="contentContainer"
        class="relative w-full max-w-4xl mx-auto px-4 pt-6 pb-10"
      >
        <!-- Card / flip area (no fixed height) -->
        <section
          class="relative w-full rounded-3xl border border-black bg-base-100/95 shadow-xl"
        >
          <div class="flip-card w-full">
            <div
              class="flip-card-inner w-full min-h-[60vh]"
              :class="{ 'is-flipped': flipped }"
            >
              <!-- FRONT SIDE: icon background + title-card + ami-chat -->
              <div class="flip-side flip-front">
                <div
                  class="relative flex h-full w-full rounded-2xl border border-base-300 bg-base-100/95 shadow-md overflow-hidden"
                >
                  <!-- Soft icon background (front, normal) -->
                  <div
                    v-if="pageIcon"
                    class="pointer-events-none absolute -top-10 -right-10 sm:-top-14 sm:-right-14 lg:-top-16 lg:-right-16 opacity-20 rotate-6"
                  >
                    <Icon
                      :name="pageIcon"
                      class="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 text-primary"
                    />
                  </div>

                  <!-- Front content -->
                  <div
                    class="relative z-10 flex flex-col w-full h-full p-4 sm:p-5"
                  >
                    <!-- Title area -->
                    <div class="mb-3 sm:mb-4">
                      <title-card />
                    </div>

                    <!-- Chat content: stretch and let ami-chat manage its own scroll -->
                    <div class="flex-1 min-h-0 flex">
                      <ami-chat class="flex-1" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- BACK SIDE: mirrored icon background + smart-panel -->
              <div class="flip-side flip-back">
                <div
                  class="relative w-full h-full rounded-2xl border border-base-300 bg-base-100/95 shadow-md p-4 sm:p-5 overflow-hidden"
                >
                  <!-- Soft icon background (back, mirrored + moved to top-left) -->
                  <div
                    v-if="pageIcon"
                    class="pointer-events-none absolute -top-10 -left-10 sm:-top-14 sm:-left-14 lg:-top-16 lg:-left-16 opacity-20 rotate-6"
                    style="transform: scaleX(-1)"
                  >
                    <Icon
                      :name="pageIcon"
                      class="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 text-primary"
                    />
                  </div>

                  <div class="relative z-10 w-full h-full">
                    <smart-panel />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Flip toggle -->
          <button
            type="button"
            class="absolute top-3 right-4 z-20 inline-flex items-center gap-1 rounded-full border border-base-300 bg-base-100/95 px-3 py-1 text-[0.65rem] sm:text-xs font-semibold shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
            @click="flipped = !flipped"
          >
            <Icon
              v-if="!flipped"
              name="kind-icon:arrow-right"
              class="w-3 h-3"
            />
            <Icon v-else name="kind-icon:arrow-left" class="w-3 h-3" />
            <span class="hidden sm:inline">
              {{ flipped ? 'Details' : 'Browse' }}
            </span>
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/splash-tutorial.vue
import { ref, computed, onMounted } from 'vue'
import { Icon } from '#components'
import { usePageStore } from '@/stores/pageStore'
import { useNavStore } from '@/stores/navStore'

const contentContainer = ref<HTMLElement | null>(null)
const flipped = ref(false)

const navStore = useNavStore()
const pageStore = usePageStore()

onMounted(async () => {
  if (!navStore.isInitialized) {
    await navStore.initialize()
  }
  // Default model type for splash
  navStore.setActiveModelType(null)
})

const fallbackImage = '/images/botcafe.webp'
const image = computed(() => pageStore.page?.image)
const resolvedImage = computed(() => {
  const img = image.value || fallbackImage
  return img.startsWith('/') ? img : `/images/${img}`
})

const pageIcon = computed(() => pageStore.page?.icon)
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
}

.flip-card-inner {
  position: relative;
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
