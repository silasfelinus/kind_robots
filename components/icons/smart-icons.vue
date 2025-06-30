<!-- /components/content/icons/smart-icons.vue -->
<template>
  <div class="icon-bar relative w-full h-full overflow-hidden">
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
    <div
      class="relative w-full h-full flex items-center pl-10 md:pl-12 pr-20 md:pr-24 group"
    >
      <div
        ref="scrollContainer"
        class="scroll-container overflow-x-auto overflow-y-hidden w-full h-full flex items-center gap-1 md:gap-2 snap-x snap-mandatory scroll-px-4 transition-all duration-300"
        @scroll="checkScrollEdgesThrottled"
        @mousedown="handleScrollMouseDown"
        @mousemove="handleScrollMouseMove"
        @mouseup="handleScrollMouseUp"
        @mouseleave="handleScrollMouseUp"
        @touchstart="handleScrollTouchStart"
        @touchmove="handleScrollTouchMove"
        @touchend="handleScrollMouseUp"
      >
        <icon-display
          v-for="(icon, index) in editableIcons"
          :key="icon.id"
          :icon="icon"
          class="snap-start shrink-0"
        />
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
const { activeIcons, isEditing } = storeToRefs(smartbarStore)
const { editableIcons } = storeToRefs(smartbarStore)

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
  smartbarStore.isEditing = true
  displayStore.bigMode = false
}

const hasChanges = computed(() => {
  const a = getIds(editableIcons.value)
  const b = getIds(originalIcons.value)
  return a.length !== b.length || a.some((id, i) => id !== b[i])
})

function confirmEdit() {
  smartbarStore.setIconOrder(getIds(editableIcons.value))
  smartbarStore.isEditing = false
}

function revertEdit() {
  editableIcons.value = [...originalIcons.value]
  smartbarStore.isEditing = false
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

// Throttle scroll edge checks with rAF
let scrollTick = false
function checkScrollEdgesThrottled() {
  if (scrollTick) return
  scrollTick = true
  requestAnimationFrame(() => {
    checkScrollEdges()
    scrollTick = false
  })
}

// Drag-scroll
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
  const dx = e.clientX - startX
  scrollContainer.value.scrollLeft = scrollStart - dx
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
  const dx = e.touches[0].clientX - startX
  scrollContainer.value.scrollLeft = scrollStart - dx
}

// Resize check
let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  checkScrollEdges()
  resizeObserver = new ResizeObserver(checkScrollEdgesThrottled)
  if (scrollContainer.value) resizeObserver.observe(scrollContainer.value)
})
onBeforeUnmount(() => {
  if (resizeObserver && scrollContainer.value)
    resizeObserver.unobserve(scrollContainer.value)
})
</script>

<style>
.icon-bar .scroll-container::-webkit-scrollbar {
  height: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.icon-bar:hover .scroll-container::-webkit-scrollbar,
.icon-bar:focus-within .scroll-container::-webkit-scrollbar {
  opacity: 1;
  pointer-events: auto;
}

.icon-bar .scroll-container {
  scrollbar-width: thin;
  scrollbar-color: var(--tw-prose-body) transparent;
}
</style>
