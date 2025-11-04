<!-- /components/content/navigation/smart-icons.vue -->
<template>
  <!-- Fill the column by default -->
  <div class="relative h-full w-full leading-none flex-1 min-w-0">
    <div class="h-full w-full flex items-stretch min-w-0">
      <div
        ref="scrollContainer"
        class="h-full w-full flex-1 min-w-0 flex items-stretch snap-x snap-mandatory transition-all duration-300 gap-[2px] overflow-x-auto overflow-y-hidden smart-icons-scroll select-none"
        :class="[
          // When the corner panel is open, hide labels/titles so the header stays minimal
          displayStore.showCorner
            ? '[&_.icon-title]:invisible [&_.smart-icon-title]:invisible [&_.label]:invisible [&_[data-icon-title]]:invisible [&_[aria-label=icon-title]]:invisible'
            : '',
          // Strip vertical gaps so icons hug the header height
          '[&_*]:!mt-0 [&_*]:!mb-0 [&_*]:!pt-0 [&_*]:!pb-0',
          // Strip any horizontal margins inner tiles might add
          '[&_*]:!ms-0 [&_*]:!me-0',
          // Direct children fill height of the row
          '[&>*]:h-full',
          // Safe zones for chevron arrows so icons never sit under them
          'pl-6 pr-6 sm:pl-8 sm:pr-8',
          // Drag cursor feedback
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        ]"
        @scroll="checkScrollEdgesThrottled"
        @mousedown="handleScrollMouseDown"
        @mousemove="handleScrollMouseMove"
        @mouseup="handleScrollMouseUp"
        @mouseleave="handleScrollMouseUp"
        @touchstart="handleScrollTouchStart"
        @touchmove="handleScrollTouchMove"
        @touchend="handleScrollTouchEnd"
      >
        <!-- Icons (square tiles, sized by row height) -->
        <icon-display
          v-for="icon in rowIcons"
          :key="icon.id"
          :icon="icon"
          :show-title="showTitles"
          class="snap-start shrink-0 h-full aspect-square flex"
        />

        <!-- Plus tile (edit mode only) — same square sizing -->
        <div
          v-if="isEditing"
          class="snap-start shrink-0 h-full aspect-square flex"
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
        <div aria-hidden="true" class="shrink-0 h-full w-px" />
      </div>
    </div>

    <!-- Scroll hint arrows (no visible scrollbars) -->
    <button
      v-if="canScrollLeft"
      type="button"
      class="pointer-events-auto absolute left-1 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center rounded-full border border-base-content/30 bg-base-300/80 hover:bg-base-200/90 shadow-sm text-base-content/80 w-6 h-6 lg:w-7 lg:h-7"
      @click="scrollByStep(-1)"
    >
      <Icon name="kind-icon:chevron-left" class="w-3 h-3 lg:w-4 lg:h-4" />
    </button>

    <button
      v-if="canScrollRight"
      type="button"
      class="pointer-events-auto absolute right-1 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center rounded-full border border-base-content/30 bg-base-300/80 hover:bg-base-200/90 shadow-sm text-base-content/80 w-6 h-6 lg:w-7 lg:h-7"
      @click="scrollByStep(1)"
    >
      <Icon name="kind-icon:chevron-right" class="w-3 h-3 lg:w-4 lg:h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
// /components/content/navigation/smart-icons.vue
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

const rowIcons = computed<SmartIcon[]>(() =>
  isEditing.value ? editableIcons.value : activeIcons.value,
)

// In bigMode we stay very slim, so hide titles; in normal mode, show them.
const showTitles = computed(() => !isEditing.value && !displayStore.bigMode)

// scroll + drag helpers
const scrollContainer = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

let scrollTick = false
let startX = 0
let scrollStart = 0

function updateScrollFlags() {
  const el = scrollContainer.value
  if (!el) return
  const maxScrollLeft = el.scrollWidth - el.clientWidth - 1
  canScrollLeft.value = el.scrollLeft > 1
  canScrollRight.value = el.scrollLeft < maxScrollLeft
}

function checkScrollEdges() {
  updateScrollFlags()
}

function checkScrollEdgesThrottled() {
  if (scrollTick) return
  scrollTick = true
  requestAnimationFrame(() => {
    checkScrollEdges()
    scrollTick = false
  })
}

function getTileWidth(): number {
  const el = scrollContainer.value
  if (!el || !el.children.length) return 0
  const firstTile = el.children[0] as HTMLElement
  return firstTile?.offsetWidth || 0
}

function snapToNearestTile() {
  const el = scrollContainer.value
  if (!el) return
  const tileWidth = getTileWidth()
  if (!tileWidth) {
    updateScrollFlags()
    return
  }
  const current = el.scrollLeft
  const index = Math.round(current / tileWidth)
  const target = index * tileWidth
  el.scrollTo({ left: target, behavior: 'smooth' })
}

function scrollByStep(direction: -1 | 1) {
  const el = scrollContainer.value
  if (!el) return
  const tileWidth = getTileWidth()
  const step = tileWidth || el.clientWidth / 3
  const target = el.scrollLeft + direction * step
  el.scrollTo({ left: target, behavior: 'smooth' })
}

// Mouse drag
function handleScrollMouseDown(e: MouseEvent) {
  if (!scrollContainer.value) return
  isDragging.value = true
  startX = e.clientX
  scrollStart = scrollContainer.value.scrollLeft
  e.preventDefault()
}

function handleScrollMouseMove(e: MouseEvent) {
  if (!isDragging.value || !scrollContainer.value) return
  const delta = e.clientX - startX
  scrollContainer.value.scrollLeft = scrollStart - delta
}

function handleScrollMouseUp() {
  if (!isDragging.value) return
  isDragging.value = false
  snapToNearestTile()
}

// Touch drag
function handleScrollTouchStart(e: TouchEvent) {
  if (!scrollContainer.value) return
  isDragging.value = true
  startX = e.touches[0].clientX
  scrollStart = scrollContainer.value.scrollLeft
}

function handleScrollTouchMove(e: TouchEvent) {
  if (!isDragging.value || !scrollContainer.value) return
  const delta = e.touches[0].clientX - startX
  scrollContainer.value.scrollLeft = scrollStart - delta
}

function handleScrollTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  snapToNearestTile()
}

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  resizeObserver = new ResizeObserver(checkScrollEdgesThrottled)
  if (scrollContainer.value) resizeObserver.observe(scrollContainer.value)
  // Initial state
  requestAnimationFrame(updateScrollFlags)
})
onBeforeUnmount(() => {
  if (resizeObserver && scrollContainer.value)
    resizeObserver.unobserve(scrollContainer.value)
})
</script>

<style scoped>
/* Hide scrollbars while keeping horizontal scroll behavior */
.smart-icons-scroll {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/old Edge */
}

.smart-icons-scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
