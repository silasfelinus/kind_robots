<!-- /components/navigation/smart-front.vue -->
<template>
  <div class="relative flex flex-col w-full h-full bg-base-100/95">
    <div v-if="pageIcon" class="corner-icon corner-icon-tl">
      <Icon :name="pageIcon" class="corner-icon-inner text-primary" />
    </div>

    <div v-if="pageIcon" class="corner-icon corner-icon-tr">
      <Icon :name="pageIcon" class="corner-icon-inner text-primary" />
    </div>

    <div v-if="pageIcon" class="corner-icon corner-icon-bl">
      <Icon :name="pageIcon" class="corner-icon-inner text-primary" />
    </div>

    <div v-if="pageIcon" class="corner-icon corner-icon-br">
      <Icon :name="pageIcon" class="corner-icon-inner text-primary" />
    </div>

    <div class="relative z-10 flex-1 min-h-0">
      <div
        ref="scrollRef"
        class="smart-scroll-container w-full h-full overflow-y-auto"
        @scroll="updateScrollState"
      >
        <div
          class="flex flex-col w-full min-h-full p-2 md:p-3 lg:p-4 xl:p-5 gap-2 md:gap-3"
        >
          <div
            class="flex items-center justify-between gap-2 mb-1 md:mb-2 lg:mb-3 xl:mb-4"
          >
            <h2
              class="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-base-content/90 truncate"
            >
              {{ title }}
            </h2>

            <div class="flex items-center gap-1 md:gap-2">
              <button
                v-if="!flipped"
                type="button"
                class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs flex items-center gap-1"
                @click="setAmiSide"
              >
                <Icon
                  name="kind-icon:butterfly"
                  class="w-3 h-3 md:w-4 md:h-4"
                />
                <span class="hidden sm:inline">Ami</span>
              </button>
            </div>
          </div>

          <div class="w-full mb-1 md:mb-2 lg:mb-3 xl:mb-4">
            <smart-icons />
          </div>

          <div class="flex flex-col gap-2 md:gap-3">
            <div class="w-full">
              <smart-image />
            </div>

            <div class="w-full">
              <smart-buttons />
            </div>

            <div class="w-full">
              <smart-panel />
            </div>
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
        <Icon name="kind-icon:chevron-down" class="w-3 h-3 md:w-4 md:h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/smart-front.vue
import { ref, computed, onMounted } from 'vue'
import { Icon } from '#components'
import { usePageStore } from '@/stores/pageStore'
import { useDisplayStore } from '@/stores/displayStore'

const scrollRef = ref<HTMLElement | null>(null)
const canScrollUp = ref(false)
const canScrollDown = ref(false)

const pageStore = usePageStore()
const displayStore = useDisplayStore()

const flipped = computed(() => displayStore.SmartState === 'ami')

const pageIcon = computed(() => pageStore.page?.icon)
const title = computed(
  () => pageStore.page?.title || pageStore.page?.room || 'Kind Room',
)

const setAmiSide = () => {
  displayStore.SmartState = 'ami'
}

const updateScrollState = () => {
  const el = scrollRef.value
  if (!el) return

  const up = el.scrollTop > 2
  const down = el.scrollTop + el.clientHeight < el.scrollHeight - 2

  canScrollUp.value = up
  canScrollDown.value = down
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

.corner-icon {
  position: absolute;
  width: clamp(4rem, 7vw, 6rem);
  height: clamp(4rem, 7vw, 6rem);
  opacity: 0.4;
  pointer-events: none;
}

.corner-icon-inner {
  width: 100%;
  height: 100%;
}

.corner-icon-tl {
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
}

.corner-icon-tr {
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
}

.corner-icon-bl {
  bottom: 0;
  left: 0;
  transform: translate(-50%, 50%);
}

.corner-icon-br {
  bottom: 0;
  right: 0;
  transform: translate(50%, 50%);
}

.corner-icon-bl .corner-icon-inner {
  transform: rotate(6deg);
}

.corner-icon-br .corner-icon-inner {
  transform: rotate(-6deg);
}
</style>
