<!-- /components/content/navigation/smart-icons.vue -->
<template>
  <!-- Fill the column by default -->
  <div class="relative h-full w-full leading-none flex-1 min-w-0">
    <div class="h-full w-full flex items-stretch min-w-0">
      <div
        ref="scrollContainer"
        class="h-full w-full flex-1 min-w-0 overflow-x-auto overflow-y-hidden flex items-stretch snap-x snap-mandatory transition-all duration-300 gap-[2px] pr-0 [scrollbar-gutter:stable]"
        :class="[
          displayStore.showCorner
            ? '[&_.icon-title]:invisible [&_.smart-icon-title]:invisible [&_.label]:invisible [&_[data-icon-title]]:invisible [&_[aria-label=icon-title]]:invisible'
            : '',
          // strip vertical gaps so icons hug top/label
          '[&_*]:!mt-0 [&_*]:!mb-0 [&_*]:!pt-0 [&_*]:!pb-0',
          // strip any horizontal margins inner tiles might add
          '[&_*]:!ms-0 [&_*]:!me-0',
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
        <!-- Icons -->
        <icon-display
          v-for="icon in rowIcons"
          :key="icon.id"
          :icon="icon"
          :show-title="showTitles"
          class="snap-start shrink-0 h-full flex basis-[18%] max-w-[18%]"
        />

        <!-- Plus tile (edit mode only) -->
        <div
          v-if="isEditing"
          class="snap-start shrink-0 h-full flex basis-[18%] max-w-[18%]"
        >
          <NuxtLink
            to="/icons"
            class="group relative h-full w-full flex flex-col items-center justify-center rounded-2xl bg-base-200 hover:bg-base-300 border border-base-content/10 transition outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            title="Add or manage icons"
            aria-label="Add or manage icons"
          >
            <Icon
              name="kind-icon:plus"
              class="pointer-events-none h-[60%] w-[60%]"
            />
            <span class="icon-title mt-[0.15em] text-xs opacity-80 select-none">
              Add
            </span>
          </NuxtLink>
        </div>

        <!-- Spacer to eliminate tiny trailing dead-zone from rounding -->
        <div aria-hidden="true" class="shrink-0 h-full w-px"></div>
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

// keep editable list in sync when not editing
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

// scroll helpers
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

let isDragging = false
let startX = 0
let scrollStart = 0
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
