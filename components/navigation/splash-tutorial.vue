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
        <div class="flex flex-col w-full h-full">
          <div
            class="stage rounded-3xl border-2 border-black shadow-xl bg-base-100/95 overflow-hidden"
          >
            <div class="absolute inset-0 flex flex-col">
              <div class="flex-1 min-h-0 border-b border-base-300">
                <div class="relative w-full h-full">
                  <div
                    ref="dashScrollRef"
                    class="smart-scroll-container w-full h-full overflow-y-auto"
                    @scroll="updateDashScrollState"
                  >
                    <div
                      class="flex flex-col w-full min-h-full p-2 md:p-3 lg:p-4 xl:p-5 gap-3 md:gap-4"
                    >
                      <p class="text-sm md:text-base text-base-content/80">
                        This side is your Kind dashboard sandbox. Soon it can
                        host stats, shortcuts, and smart-style controls.
                      </p>

                      <div class="w-full">
                        <corner-panel />
                      </div>
                    </div>
                  </div>

                  <button
                    v-if="dashCanScrollUp"
                    type="button"
                    class="absolute right-2 top-2 z-20 rounded-full border border-base-300 bg-base-200/80 px-1 py-[2px] text-base-content/70"
                    @click.stop="dashScrollBy('up')"
                  >
                    <Icon
                      name="kind-icon:chevron-up"
                      class="w-3 h-3 md:w-4 md:h-4"
                    />
                  </button>

                  <button
                    v-if="dashCanScrollDown"
                    type="button"
                    class="absolute right-2 bottom-2 z-20 rounded-full border border-base-300 bg-base-200/80 px-1 py-[2px] text-base-content/70"
                    @click.stop="dashScrollBy('down')"
                  >
                    <Icon
                      name="kind-icon:chevron-down"
                      class="w-3 h-3 md:w-4 md:h-4"
                    />
                  </button>
                </div>
              </div>

              <div class="flex-1 min-h-0">
                <div class="relative w-full h-full">
                  <div
                    ref="chatScrollRef"
                    class="smart-scroll-container w-full h-full overflow-y-auto"
                    @scroll="updateChatScrollState"
                  >
                    <div
                      class="flex flex-col w-full min-h-full p-2 md:p-3 lg:p-4 xl:p-5 gap-2 md:gap-3"
                    >
                      <div class="flex-1 min-h-[8rem]">
                        <ami-chat class="w-full h-full" />
                      </div>
                    </div>
                  </div>

                  <button
                    v-if="chatCanScrollUp"
                    type="button"
                    class="absolute right-2 top-2 z-20 rounded-full border border-base-300 bg-base-200/80 px-1 py-[2px] text-base-content/70"
                    @click.stop="chatScrollBy('up')"
                  >
                    <Icon
                      name="kind-icon:chevron-up"
                      class="w-3 h-3 md:w-4 md:h-4"
                    />
                  </button>

                  <button
                    v-if="chatCanScrollDown"
                    type="button"
                    class="absolute right-2 bottom-2 z-20 rounded-full border border-base-300 bg-base-200/80 px-1 py-[2px] text-base-content/70"
                    @click.stop="chatScrollBy('down')"
                  >
                    <Icon
                      name="kind-icon:chevron-down"
                      class="w-3 h-3 md:w-4 md:h-4"
                    />
                  </button>
                </div>
              </div>
            </div>
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

const imageSizes = computed(
  () => '(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1024px',
)

const dashScrollRef = ref<HTMLElement | null>(null)
const dashCanScrollUp = ref(false)
const dashCanScrollDown = ref(false)

const chatScrollRef = ref<HTMLElement | null>(null)
const chatCanScrollUp = ref(false)
const chatCanScrollDown = ref(false)

const updateScrollState = (
  el: HTMLElement | null,
  up: { value: boolean },
  down: { value: boolean },
) => {
  if (!el) return
  up.value = el.scrollTop > 2
  down.value = el.scrollTop + el.clientHeight < el.scrollHeight - 2
}

const updateDashScrollState = () =>
  updateScrollState(dashScrollRef.value, dashCanScrollUp, dashCanScrollDown)

const updateChatScrollState = () =>
  updateScrollState(chatScrollRef.value, chatCanScrollUp, chatCanScrollDown)

const scrollBy = (el: HTMLElement | null, direction: 'up' | 'down') => {
  if (!el) return
  const delta = el.clientHeight * 0.6 * (direction === 'up' ? -1 : 1)
  el.scrollBy({ top: delta, behavior: 'smooth' })
}

const dashScrollBy = (direction: 'up' | 'down') =>
  scrollBy(dashScrollRef.value, direction)

const chatScrollBy = (direction: 'up' | 'down') =>
  scrollBy(chatScrollRef.value, direction)

onMounted(() => {
  updateDashScrollState()
  updateChatScrollState()
})
</script>

<style scoped>
.stage {
  position: relative;
  width: 100%;
  height: 100%;
}

.smart-scroll-container {
  scrollbar-width: none;
}

.smart-scroll-container::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
