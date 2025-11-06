<!-- /components/content/icons/splash-tutorial.vue (wrapper) -->
<template>
  <div
    v-if="pageStore.page"
    class="relative w-full h-full overflow-y-auto rounded-2xl border-2 border-black z-20 bg-base-200/80"
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

    <!-- Foreground content -->
    <div class="relative z-10 flex flex-col min-h-full">
      <div
        ref="contentContainer"
        class="relative w-full max-w-4xl mx-auto px-4 py-6"
      >
        <section
          class="relative overflow-hidden rounded-3xl border border-black bg-base-100/95 shadow-xl p-3 sm:p-4"
        >
          <div class="flip-card w-full h-full">
            <div
              class="flip-card-inner w-full h-full"
              :class="{ 'is-flipped': flipped }"
            >
              <!-- FRONT SIDE: title-card + ami-chat as two separate cards -->
              <div class="flip-side flip-front">
                <div class="space-y-3 sm:space-y-4">
                  <div
                    class="rounded-2xl border border-base-300 bg-base-100/95 shadow-md p-4 sm:p-5"
                  >
                    <title-card />
                  </div>

                  <div
                    class="rounded-2xl border border-base-300 bg-base-100 shadow-md p-4 sm:p-5"
                  >
                    <ami-chat />
                  </div>
                </div>
              </div>

              <!-- BACK SIDE: smart-panel in a matching card frame -->
              <div class="flip-side flip-back">
                <div
                  class="w-full h-full rounded-2xl border border-base-300 bg-base-100/95 shadow-md p-4 sm:p-5 overflow-y-auto"
                >
                  <smart-panel />
                </div>
              </div>
            </div>
          </div>

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
onMounted(async () => {
  if (!navStore.isInitialized) {
    await navStore.initialize()
  }
  navStore.setActiveModelType(null)
})

const pageStore = usePageStore()

const fallbackImage = '/images/botcafe.webp'
const image = computed(() => pageStore.page?.image)
const resolvedImage = computed(() => {
  const img = image.value || fallbackImage
  return img.startsWith('/') ? img : `/images/${img}`
})
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
