<template>
  <div class="relative h-full w-auto leading-none">
    <div class="h-full w-auto max-w-full flex items-stretch">
      <div
        ref="scrollContainer"
        class="h-full w-auto max-w-full overflow-x-auto overflow-y-hidden flex items-stretch snap-x snap-mandatory transition-all duration-300 gap-[0.5%]"
        :class="[
          displayStore.showCorner
            ? '[&_.icon-title]:invisible [&_.smart-icon-title]:invisible [&_.label]:invisible [&_[data-icon-title]]:invisible [&_[aria-label=icon-title]]:invisible'
            : '',
          // strip vertical gaps so icons hug top/label
          '[&_*]:!mt-0 [&_*]:!mb-0 [&_*]:!pt-0 [&_*]:!pb-0',
          // direct children fill height
          '[&>*]:h-full',
        ]"
        @scroll="checkScrollEdgesThrottled"
        @mousedown="handleScrollMouseDown"
        @mousemove="handleScrollMouseMove"
        @mouseup="handleScrollMouseUp"
        @mouseleave="handleScrollMouseUp"
        @touchstart="handleScrollTouchStart"
        @touchmove="handleScrollTouchMove"
        @touchend="handleScrollMouseUp"
      >
        <!-- Larger tiles; adjust cap as desired -->
        <icon-display
          v-for="icon in rowIcons"
          :key="icon.id"
          :icon="icon"
          :show-title="showTitles"
          class="snap-start shrink-0 h-full w-auto max-w-[18%] flex"
        />

        <NuxtLink
          v-if="isEditing"
          to="/icons"
          class="snap-start shrink-0 h-full max-w-[18%] w-auto flex items-center justify-center rounded-2xl bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
          title="Add or manage icons"
        >
          <Icon class="h-[60%] w-[60%]" name="kind-icon:plus" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSmartbarStore, type SmartIcon } from '@/stores/smartbarStore'
import { useDisplayStore } from '@/stores/displayStore'

const smartbarStore = useSmartbarStore()
const displayStore = useDisplayStore()
const { activeIcons, isEditing, editableIcons } = storeToRefs(smartbarStore)

watch(
  activeIcons,
  (val) => {
    if (!isEditing.value) editableIcons.value = [...val]
  },
  { immediate: true },
)
const rowIcons = computed(() =>
  isEditing.value ? editableIcons.value : activeIcons.value,
)
const showTitles = computed(() => !isEditing.value && !displayStore.bigMode)

const scrollContainer = ref<HTMLElement | null>(null)
let scrollTick = false
function checkScrollEdges() {}
function checkScrollEdgesThrottled() {
  if (scrollTick) return
  scrollTick = true
  requestAnimationFrame(() => {
    checkScrollEdges()
    scrollTick = false
  })
}
let isDragging = false,
  startX = 0,
  scrollStart = 0
function handleScrollMouseDown(e: MouseEvent) {
  isDragging = true
  startX = e.clientX
  scrollStart = scrollContainer.value?.scrollLeft || 0
}
function handleScrollMouseMove(e: MouseEvent) {
  if (!isDragging || !scrollContainer.value) return
  scrollContainer.value.scrollLeft = scrollStart - (e.clientX - startX)
}
function handleScrollMouseUp() {
  isDragging = false
}
function handleScrollTouchStart(e: TouchEvent) {
  isDragging = true
  startX = e.touches[0].clientX
  scrollStart = scrollContainer.value?.scrollLeft || 0
}
function handleScrollTouchMove(e: TouchEvent) {
  if (!isDragging || !scrollContainer.value) return
  scrollContainer.value.scrollLeft =
    scrollStart - (e.touches[0].clientX - startX)
}

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  resizeObserver = new ResizeObserver(checkScrollEdgesThrottled)
  if (scrollContainer.value) resizeObserver.observe(scrollContainer.value)
})
onBeforeUnmount(() => {
  if (resizeObserver && scrollContainer.value)
    resizeObserver.unobserve(scrollContainer.value)
})
</script>
