<!-- /components/content/navigation/smart-icons.vue -->
<template>
  <div class="relative w-full h-full leading-none">
    <div class="flex-1 min-w-0 h-full flex items-stretch w-full">
      <div
        ref="scrollContainer"
        class="overflow-x-auto overflow-y-hidden w-full h-full flex items-stretch snap-x snap-mandatory transition-all duration-300 gap-[1%] pr-[12%]"
        :class="[
          // hide titles when corner is open
          displayStore.showCorner
            ? '[&_.icon-title]:invisible [&_.smart-icon-title]:invisible [&_.label]:invisible [&_[data-icon-title]]:invisible [&_[aria-label=icon-title]]:invisible'
            : '',
          // strip vertical padding/margins from children so icons hug top & labels
          '[&_*]:!mt-0 [&_*]:!mb-0 [&_*]:!pt-0 [&_*]:!pb-0',
          // ensure children stretch vertically to container
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
        <!-- Icons: bigger caps, full height, no top/bottom pad -->
        <icon-display
          v-for="icon in rowIcons"
          :key="icon.id"
          :icon="icon"
          :show-title="showTitles"
          class="snap-start shrink-0 h-full w-auto max-w-[16%] flex"
        />

        <!-- Plus (edit only), matches tile sizing -->
        <NuxtLink
          v-if="isEditing"
          to="/icons"
          class="snap-start shrink-0 h-full max-w-[16%] w-auto flex items-center justify-center rounded-2xl bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
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

// sync editable list when not editing
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

// drag-to-scroll + edge-check
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
