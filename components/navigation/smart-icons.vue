<template>
  <div class="relative flex h-full min-h-10 w-full min-w-0 items-stretch">
    <div class="flex h-full w-full items-stretch gap-1">
      <button
        v-if="canScrollLeft"
        type="button"
        class="shrink-0 flex items-center justify-center h-full aspect-square rounded-2xl hover:bg-base-300/80 border border-base-content/20 shadow-sm transition"
        @click="scrollByStep(-1)"
      >
        <Icon name="kind-icon:chevron-left" class="w-[65%] h-[65%]" />
      </button>

      <div
        ref="scrollContainer"
        class="smart-icons-scroll flex h-full min-h-0 flex-1 min-w-0 items-stretch gap-1 overflow-x-auto overflow-y-hidden transition-all duration-300"
        :class="[
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
          !canScrollLeft && !canScrollRight ? 'justify-center px-2' : '',
        ]"
        @scroll="checkScrollEdgesThrottled"
        @mousedown="handleScrollMouseDown"
        @mousemove="handleScrollMouseMove"
        @mouseup="handleScrollMouseUp"
        @mouseleave="handleScrollMouseUp"
        @touchstart="handleScrollTouchStart"
        @touchmove="handleScrollTouchMove"
        @touchend="handleScrollTouchEnd"
        @wheel.passive="handleWheel"
      >
        <div ref="row" class="flex h-full min-w-max items-stretch gap-1">
          <div
            v-if="rowIcons.length === 0"
            class="flex h-full aspect-square items-center justify-center"
          >
            <button
              type="button"
              class="h-full w-full flex flex-col items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 text-warning"
              @click="activateEditMode"
            >
              <Icon name="kind-icon:alert" class="h-[70%] w-[70%]" />
            </button>
          </div>

          <icon-display
            v-for="icon in rowIcons"
            :key="icon.id"
            :icon="icon"
            :show-title="showTitles"
            class="h-full aspect-square flex"
          />

          <div
            v-if="!isEditing"
            class="flex h-full aspect-square items-center justify-center"
          >
            <button
              type="button"
              class="h-full w-full flex flex-col items-center justify-center rounded-2xl bg-base-200 hover:bg-base-300 border border-base-content/10"
              @click="activateEditMode"
            >
              <Icon name="kind-icon:settings" class="h-[70%] w-[70%]" />
            </button>
          </div>
        </div>
      </div>

      <button
        v-if="canScrollRight"
        type="button"
        class="shrink-0 flex items-center justify-center h-full aspect-square rounded-2xl hover:bg-base-300/80 border border-base-content/20 shadow-sm transition"
        @click="scrollByStep(1)"
      >
        <Icon name="kind-icon:chevron-right" class="w-[65%] h-[65%]" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/navigation/smart-icons.vue
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useSmartbarStore, type SmartIcon } from '@/stores/smartbarStore'
import { useDisplayStore } from '@/stores/displayStore'

const debugTeleport = false

const smartbarStore = useSmartbarStore()
const displayStore = useDisplayStore()
const { activeIcons, isEditing, editableIcons } = storeToRefs(smartbarStore)

const isMounted = ref(false)

const isNav = (icon: SmartIcon) => (icon?.type || '').toLowerCase() === 'nav'

const filteredActive = computed<SmartIcon[]>(() =>
  activeIcons.value.filter(isNav),
)

watch(
  activeIcons,
  () => {
    if (!isEditing.value) editableIcons.value = [...filteredActive.value]
  },
  { immediate: true },
)

const rowIcons = computed<SmartIcon[]>(() =>
  isEditing.value ? editableIcons.value.filter(isNav) : filteredActive.value,
)

const showTitles = computed(() => !isEditing.value && !displayStore.bigMode)

const activeCount = computed(() => activeIcons.value.length)
const filteredCount = computed(() => filteredActive.value.length)
const rowCount = computed(() => rowIcons.value.length)

const originalIcons = ref<SmartIcon[]>([])
watch(isEditing, (editing) => {
  if (editing) originalIcons.value = [...editableIcons.value.filter(isNav)]
})

const getIds = (icons: SmartIcon[]) => icons.map((i) => i.id)
const hasChanges = computed(() => {
  const a = getIds(editableIcons.value.filter(isNav))
  const b = getIds(originalIcons.value.filter(isNav))
  if (a.length !== b.length) return true
  return a.some((id, i) => id !== b[i])
})

function activateEditMode() {
  smartbarStore.isEditing = true
}
function confirmEdit() {
  smartbarStore.setIconOrder(getIds(editableIcons.value.filter(isNav)))
  smartbarStore.isEditing = false
}
function revertEdit() {
  editableIcons.value = [...originalIcons.value]
  smartbarStore.isEditing = false
}

const scrollContainer = ref<HTMLElement | null>(null)
const row = ref<HTMLElement | null>(null)

const isDragging = ref(false)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

let scrollTick = false
let startX = 0
let scrollStart = 0
const EPSILON = 2

function updateScrollFlags() {
  const el = scrollContainer.value
  if (!el) return
  if (el.scrollWidth <= el.clientWidth + 1) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  const maxScrollLeft = el.scrollWidth - el.clientWidth
  canScrollLeft.value = el.scrollLeft > EPSILON
  canScrollRight.value = maxScrollLeft - el.scrollLeft > EPSILON
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
function scrollByStep(direction: -1 | 1) {
  const el = scrollContainer.value
  if (!el) return
  const step = Math.max(160, el.clientWidth * 0.8)
  el.scrollBy({ left: direction * step, behavior: 'smooth' })
}
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
  requestAnimationFrame(updateScrollFlags)
}
function handleScrollTouchStart(e: TouchEvent) {
  if (!scrollContainer.value) return
  const touch = e.touches[0]
  if (!touch) return

  isDragging.value = true
  startX = touch.clientX
  scrollStart = scrollContainer.value.scrollLeft
}

function handleScrollTouchMove(e: TouchEvent) {
  if (!isDragging.value || !scrollContainer.value) return
  const touch = e.touches[0]
  if (!touch) return

  const delta = touch.clientX - startX
  scrollContainer.value.scrollLeft = scrollStart - delta
}
function handleScrollTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  requestAnimationFrame(updateScrollFlags)
}
function handleWheel(e: WheelEvent) {
  const el = scrollContainer.value
  if (!el) return
  if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
    el.scrollBy({ left: e.deltaY, behavior: 'auto' })
  }
}

watch(
  () => rowIcons.value.length,
  () => {
    syncAfterLayout()
  },
)

watch(
  () => [
    displayStore.bigMode,
    displayStore.viewportSize,
    displayStore.headerState,
    displayStore.sidebarRightState,
    displayStore.showCorner,
  ],
  () => {
    syncAfterLayout()
  },
  { flush: 'post' },
)

function syncAfterLayout() {
  nextTick(() => {
    requestAnimationFrame(() => {
      updateScrollFlags()
    })
  })
}

let resizeObserver: ResizeObserver | null = null
let rowResizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null

onMounted(() => {
  isMounted.value = true

  const el = scrollContainer.value
  const content = row.value
  if (!el || !content) return

  resizeObserver = new ResizeObserver(checkScrollEdgesThrottled)
  rowResizeObserver = new ResizeObserver(checkScrollEdgesThrottled)
  mutationObserver = new MutationObserver(checkScrollEdgesThrottled)

  resizeObserver?.observe(el)
  rowResizeObserver?.observe(content)
  mutationObserver?.observe(content, { childList: true })

  syncAfterLayout()
})

onBeforeUnmount(() => {
  const el = scrollContainer.value
  const content = row.value
  if (resizeObserver && el) resizeObserver.unobserve(el)
  if (rowResizeObserver && content) rowResizeObserver.unobserve(content)
  if (mutationObserver) mutationObserver.disconnect()
})
</script>

<style scoped>
.smart-icons-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.smart-icons-scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
