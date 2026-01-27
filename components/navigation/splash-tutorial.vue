<!-- /components/navigation/splash-tutorial.vue -->
<template>
  <div
    v-if="pageStore.page"
    class="relative w-full h-full rounded-2xl z-20 overflow-hidden"
  >
    <div
      v-if="resolvedImage"
      class="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <NuxtImg
        :src="resolvedImage"
        alt="Room background"
        class="absolute inset-0 w-full h-full object-cover blur-sm sm:blur-md lg:blur-lg"
        :sizes="imageSizes"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-base-200/80 mix-blend-multiply" />
    </div>

    <div class="relative z-10 w-full h-full flex items-center justify-center">
      <section
        class="relative w-full max-w-4xl h-[90%] mx-auto overflow-visible"
      >
        <div
          class="rounded-3xl border-2 border-black shadow-xl bg-base-100/95 overflow-hidden w-full h-full"
        >
          <div class="relative w-full h-full">
            <div
              ref="scrollRef"
              class="smart-scroll-container w-full h-full overflow-y-auto overflow-x-hidden"
              @scroll="updateScrollState"
            >
              <div
                class="flex flex-col w-full min-h-full p-2 md:p-3 lg:p-4 xl:p-5 gap-2 md:gap-3 overflow-x-hidden"
              >
                <div
                  class="w-full mb-1 md:mb-2 lg:mb-3 xl:mb-4 overflow-x-hidden"
                >
                  <title-card />
                </div>

                <div
                  class="w-full mb-1 md:mb-2 lg:mb-3 xl:mb-4 overflow-x-hidden"
                >
                  <smart-panel />
                </div>

                <div v-if="pageImage" class="w-full overflow-x-hidden">
                  <div
                    class="relative w-full rounded-2xl border border-base-300 bg-base-200/70 overflow-hidden aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1]"
                  >
                    <NuxtImg
                      :src="pageImage"
                      alt="Room illustration"
                      class="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div class="flex-1 min-h-[8rem]" />

                <div class="w-full overflow-x-hidden">
                  <ami-chat class="w-full" />
                </div>
              </div>
            </div>

            <button
              v-if="canScrollUp"
              type="button"
              class="absolute right-2 top-2 z-20 rounded-full border border-base-300 bg-base-200/80 px-1 py-[2px] text-base-content/70"
              @click.stop="scrollBy('up')"
            >
              <Icon name="kind-icon:chevron-up" class="w-3 h-3 md:w-4 md:h-4" />
            </button>

            <button
              v-if="canScrollDown"
              type="button"
              class="absolute right-2 bottom-2 z-20 rounded-full border border-base-300 bg-base-200/80 px-1 py-[2px] text-base-content/70"
              @click.stop="scrollBy('down')"
            >
              <Icon
                name="kind-icon:chevron-down"
                class="w-3 h-3 md:w-4 md:h-4"
              />
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/splash-tutorial.vue
import { computed, onMounted, ref } from 'vue'
import { NuxtImg, Icon } from '#components'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const fallbackImage = '/images/botcafe.webp'

const image = computed(() => pageStore.page?.image)

const resolvedImage = computed(() => {
  const img = image.value || fallbackImage
  return img.startsWith('/') ? img : `/images/${img}`
})

const pageImage = computed(() => {
  const img = image.value || ''
  if (!img) return ''
  return img.startsWith('/') ? img : `/images/${img}`
})

const imageSizes = computed(
  () => '(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1024px',
)

const scrollRef = ref<HTMLElement | null>(null)
const canScrollUp = ref(false)
const canScrollDown = ref(false)

const updateScrollState = () => {
  const el = scrollRef.value
  if (!el) return

  canScrollUp.value = el.scrollTop > 2
  canScrollDown.value = el.scrollTop + el.clientHeight < el.scrollHeight - 2
}

const scrollBy = (direction: 'up' | 'down') => {
  const el = scrollRef.value
  if (!el) return

  const delta = el.clientHeight * 0.6 * (direction === 'up' ? -1 : 1)
  el.scrollBy({ top: delta, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollState()
})
</script>

<style scoped>
.smart-scroll-container {
  scrollbar-width: none;
}

.smart-scroll-container::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
