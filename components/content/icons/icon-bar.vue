<!-- /components/content/icons/icon-bar.vue -->
<template>
  <div class="relative w-full h-full overflow-hidden">
    <!-- Left Scroll Button -->
    <div
      class="absolute left-0 top-0 bottom-0 w-[4.5rem] z-40 flex items-center justify-center"
    >
      <button
        v-show="showLeft"
        class="bg-base-200/70 hover:bg-base-300 rounded-full w-8 h-8 flex items-center justify-center"
        @mousedown.prevent="startContinuousScroll(-1)"
        @mouseup="stopContinuousScroll"
        @mouseleave="stopContinuousScroll"
      >
        <Icon name="kind-icon:chevron-left" />
      </button>
    </div>

    <!-- Right Scroll Button -->
    <div
      class="absolute right-[4.5rem] top-0 bottom-0 w-[4.5rem] z-40 flex items-center justify-center"
    >
      <button
        v-show="showRight"
        class="bg-base-200/70 hover:bg-base-300 rounded-full w-8 h-8 flex items-center justify-center"
        @mousedown.prevent="startContinuousScroll(1)"
        @mouseup="stopContinuousScroll"
        @mouseleave="stopContinuousScroll"
      >
        <Icon name="kind-icon:chevron-right" />
      </button>
    </div>

    <!-- Right Control Panel -->
    <div class="absolute right-0 top-1/2 -translate-y-1/2 z-50 pr-2">
      <div class="flex flex-col gap-2">
        <template v-if="isEditing">
          <NuxtLink to="/icons" class="btn btn-square btn-sm" @click="confirmEdit">
            <Icon name="kind-icon:plus" />
          </NuxtLink>
          <button
            v-if="hasChanges"
            class="btn btn-square btn-sm text-error"
            @click="revertEdit"
          >
            <Icon name="kind-icon:rotate" />
          </button>
          <button
            class="btn btn-square btn-sm bg-green-500 text-white"
            @click="confirmEdit"
          >
            <Icon name="kind-icon:check" />
          </button>
        </template>
        <button
          v-else
          class="btn btn-square btn-sm"
          @click="activateEditMode"
          title="Edit"
        >
          <Icon name="kind-icon:settings" />
        </button>
      </div>
    </div>

    <!-- Icon Row -->
    <div
      class="relative w-full h-full flex items-center pl-[4.5rem] pr-[9rem]"
    >
      <div
        ref="scrollContainer"
        class="overflow-x-auto overflow-y-hidden scrollbar-hide w-full h-full flex items-center gap-4 snap-x snap-mandatory"
        @scroll="checkScrollEdges"
        @mousedown="handleScrollMouseDown"
        @mousemove="handleScrollMouseMove"
        @mouseup="handleScrollMouseUp"
        @mouseleave="handleScrollMouseUp"
        @touchstart="handleScrollTouchStart"
        @touchmove="handleScrollTouchMove"
        @touchend="handleScrollMouseUp"
        @wheel="handleWheelScroll"
      >
        <icon-display
          v-for="(icon, index) in editableIcons"
          :key="icon.id"
          :icon="icon"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useIconStore, type SmartIcon } from '@/stores/iconStore'
import { useDisplayStore } from '@/stores/displayStore'

const iconStore = useIconStore()
const displayStore = useDisplayStore()
const { activeIcons, isEditing } = storeToRefs(iconStore)

const editableIcons = ref<SmartIcon[]>([...activeIcons.value])
const originalIcons = ref<SmartIcon[]>([])

watch(activeIcons, (val) => {
  if (!isEditing.value) editableIcons.value = [...val]
}, { immediate: true })

watch(isEditing, (editing) => {
  if (editing) originalIcons.value = [...editableIcons.value]
})

const hasChanges = computed(() =>
  JSON.stringify(editableIcons.value.map(i => i.id)) !==
  JSON.stringify(originalIcons.value.map(i => i.id))
)

function activateEditMode() {
  iconStore.isEditing = true
  displayStore.bigMode = false
}

function confirmEdit() {
  iconStore.setIconOrder(editableIcons.value.map(i => i.id))
  iconStore.isEditing = false
}

function revertEdit() {
  editableIcons.value = [...originalIcons.value]
  iconStore.isEditing = false
}

// Scroll behavior
const scrollContainer = ref<HTMLElement | null>(null)
const showLeft = ref(false)
const showRight = ref(false)

function checkScrollEdges() {
  const el = scrollContainer.value
  if (!el) return
  const scrollLeft = el.scrollLeft
  const scrollRight = el.scrollWidth - el.clientWidth - scrollLeft
  showLeft.value = scrollLeft > 68
  showRight.value = scrollRight > 68
}

function scrollBy(px: number) {
  scrollContainer.value?.scrollBy({ left: px, behavior: 'smooth' })
}

let scrollInterval: number | null = null
function startContinuousScroll(direction: 1 | -1) {
  scrollBy(direction * 45)
  scrollInterval = window.setInterval(() => {
    scrollBy(direction * 45)
  }, 50)
}
function stopContinuousScroll() {
  if (scrollInterval !== null) {
    clearInterval(scrollInterval)
    scrollInterval = null
  }
}

// Mouse wheel to horizontal scroll
function handleWheelScroll(e: WheelEvent) {
  const el = scrollContainer.value
  if (!el) return
  if (e.shiftKey) return // preserve shift+scroll
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    e.preventDefault()
    el.scrollLeft += e.deltaY
  }
}

// Drag-scroll
let isDragging = false
let isScrollDragging = false
let startX = 0
let scrollStart = 0

function handleScrollMouseDown(e: MouseEvent) {
  isDragging = true
  isScrollDragging = false
  startX = e.clientX
  scrollStart = scrollContainer.value?.scrollLeft || 0
}
function handleScrollMouseMove(e: MouseEvent) {
  if (!isDragging || !scrollContainer.value) return
  const dx = e.clientX - startX
  if (Math.abs(dx) > 5) isScrollDragging = true
  scrollContainer.value.scrollLeft = scrollStart - dx
}
function handleScrollMouseUp() {
  isDragging = false
  setTimeout(() => (isScrollDragging = false), 100)
}
function handleScrollTouchStart(e: TouchEvent) {
  isDragging = true
  isScrollDragging = false
  startX = e.touches[0].clientX
  scrollStart = scrollContainer.value?.scrollLeft || 0
}
function handleScrollTouchMove(e: TouchEvent) {
  if (!isDragging || !scrollContainer.value) return
  const dx = e.touches[0].clientX - startX
  if (Math.abs(dx) > 5) isScrollDragging = true
  scrollContainer.value.scrollLeft = scrollStart - dx
}

// Resize check
let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  checkScrollEdges()
  resizeObserver = new ResizeObserver(checkScrollEdges)
  if (scrollContainer.value) resizeObserver.observe(scrollContainer.value)
})
onBeforeUnmount(() => {
  if (resizeObserver && scrollContainer.value)
    resizeObserver.unobserve(scrollContainer.value)
})
</script>
