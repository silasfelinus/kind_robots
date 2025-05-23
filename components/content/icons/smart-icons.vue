<!-- /components/content/icons/icon-bar.vue -->
<template>
  <div class="relative w-full h-full overflow-hidden">
    <!-- Right Control Panel -->
    <div class="absolute right-0 top-1/2 -translate-y-1/2 z-50 pr-2">
      <div class="flex flex-col gap-2">
        <template v-if="isEditing">
          <NuxtLink
            to="/icons"
            class="btn btn-square btn-sm"
            @click="confirmEdit"
          >
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
    <!-- Around scroll container -->
    <div
      class="relative w-full h-full flex items-center pl-10 md:pl-12 pr-20 md:pr-24 group"
    >
      <div
        ref="scrollContainer"
        class="scroll-container overflow-x-auto overflow-y-hidden w-full h-full flex items-center gap-1 md:gap-2 snap-x snap-mandatory transition-all duration-300 scrollbar-thin scrollbar-thumb-base-content/60 scrollbar-track-transparent"
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

const { editableIcons } = storeToRefs(iconStore)

const originalIcons = ref<SmartIcon[]>([])

watch(
  activeIcons,
  (val) => {
    if (!isEditing.value) editableIcons.value = [...val]
  },
  { immediate: true },
)

watch(isEditing, (editing) => {
  if (editing) originalIcons.value = [...editableIcons.value]
})

const getIds = (icons: SmartIcon[]) => icons.map((i) => i.id)

function activateEditMode() {
  iconStore.isEditing = true
  displayStore.bigMode = false
}

const hasChanges = computed(
  () =>
    JSON.stringify(getIds(editableIcons.value)) !==
    JSON.stringify(getIds(originalIcons.value)),
)

function confirmEdit() {
  iconStore.setIconOrder(getIds(editableIcons.value))
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

<style scoped>
.scroll-container::-webkit-scrollbar {
  height: 8px;
  transition: opacity 0.3s ease;
  opacity: 0;
  pointer-events: none;
}
.group:hover .scroll-container::-webkit-scrollbar,
.group:focus-within .scroll-container::-webkit-scrollbar {
  opacity: 1;
  pointer-events: auto;
}

.scroll-container {
  scrollbar-width: thin;
  scrollbar-color: var(--tw-prose-body) transparent;
}
</style>
