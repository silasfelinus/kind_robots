<!-- /components/navigation/splash-tutorial.vue -->
<template>
  <div
    v-if="pageStore.page"
    class="relative z-20 flex h-full w-full items-center justify-center overflow-hidden rounded-2xl"
  >
    <section
      class="relative mx-auto h-[90%] w-full max-w-4xl overflow-hidden rounded-3xl border-2 border-black bg-base-100/95 shadow-xl"
    >
      <div class="relative h-full w-full">
        <div
          v-if="resolvedImage"
          class="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <NuxtImg
            :src="resolvedImage"
            alt="Splash background"
            :sizes="imageSizes"
            class="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-base-200/80 mix-blend-multiply" />
          <div class="absolute inset-0 bg-base-100/55" />
        </div>

        <div class="relative z-10 h-full w-full">
          <div
            ref="scrollRef"
            class="smart-scroll-container h-full w-full overflow-y-auto overflow-x-hidden"
            @scroll="updateScrollState"
          >
            <div
              class="flex min-h-full w-full flex-col gap-2 overflow-x-hidden p-2 md:gap-3 md:p-3 lg:p-4 xl:p-5"
            >
              <div
                class="mb-1 w-full overflow-x-hidden md:mb-2 lg:mb-3 xl:mb-4"
              >
                <title-card />
              </div>

              <div
                class="mb-1 w-full overflow-x-hidden md:mb-2 lg:mb-3 xl:mb-4"
              >
                <smart-panel />
              </div>

              <div v-if="pageImage" class="w-full overflow-x-hidden">
                <div
                  class="relative aspect-video w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200/70 md:aspect-21/9 lg:aspect-3/1"
                >
                  <NuxtImg
                    :src="pageImage"
                    alt="Room illustration"
                    :sizes="imageSizes"
                    class="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>

              <div class="flex-1 min-h-32" />

              <div class="w-full overflow-x-hidden">
                <ami-chat class="w-full" />
              </div>
            </div>
          </div>

          <button
            v-if="canScrollUp"
            type="button"
            class="absolute right-2 top-2 z-20 rounded-full border border-base-300 bg-base-200/80 px-1 py-0.5 text-base-content/70"
            @click.stop="scrollBy('up')"
          >
            <Icon name="kind-icon:chevron-up" class="h-3 w-3 md:h-4 md:w-4" />
          </button>

          <button
            v-if="canScrollDown"
            type="button"
            class="absolute right-2 bottom-2 z-20 rounded-full border border-base-300 bg-base-200/80 px-1 py-0.5 text-base-content/70"
            @click.stop="scrollBy('down')"
          >
            <Icon name="kind-icon:chevron-down" class="h-3 w-3 md:h-4 md:w-4" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/splash-tutorial.vue
import { computed, onMounted, ref } from 'vue'
import { Icon, NuxtImg } from '#components'
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
