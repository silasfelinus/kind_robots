// /components/content/icons/icon-header.vue
<template>
  <div class="relative w-full h-full overflow-hidden">
    <div
      class="absolute left-0 top-0 bottom-0 w-10 z-40 flex items-center justify-center"
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

    <div class="absolute right-0 top-1/2 -translate-y-1/2 z-50">
      <div class="flex flex-col gap-2 pr-2">
        <template v-if="!iconStore.isEditing">
          <button class="btn btn-square btn-sm" @click="iconStore.startEdit()">
            <Icon name="kind-icon:settings" />
          </button>
        </template>
        <template v-else>
          <button
            v-if="iconStore.hasChanges"
            class="btn btn-square btn-xs bg-base-200 text-error hover:bg-base-300"
            @click="iconStore.revertEdit()"
          >
            <Icon name="kind-icon:rotate" />
          </button>
          <button
            class="btn btn-square btn-xs bg-green-500 text-white hover:bg-green-600"
            @click="iconStore.confirmEdit()"
          >
            <Icon name="kind-icon:check" />
          </button>
        </template>
      </div>
    </div>

    <div
      class="relative w-full h-full flex items-center pl-10 pr-14 scroll-fade-left scroll-fade-right"
    >
      <div
        ref="scrollContainer"
        class="overflow-x-auto scrollbar-hide w-full h-full touch-pan-x snap-x snap-mandatory cursor-grab active:cursor-grabbing"
        @scroll="checkScrollEdges"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleMouseUp"
      >
        <div class="flex items-center gap-2 min-w-fit h-full select-none px-2">
          <icon-shell
            v-for="(icon, index) in iconStore.editableIcons"
            :key="icon.id"
            :icon="icon"
            :index="index"
          />

          <icon-shell :isAddIcon="true" />
        </div>
      </div>

      <div
        class="absolute right-12 top-0 bottom-0 w-10 z-40 flex items-center justify-center"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useIconStore } from '@/stores/iconStore'
const iconStore = useIconStore()

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
function startContinuousScroll(dir: 1 | -1) {
  scrollBy(dir * 45)
  scrollInterval = window.setInterval(() => scrollBy(dir * 45), 50)
}
function stopContinuousScroll() {
  if (scrollInterval) clearInterval(scrollInterval)
  scrollInterval = null
}

let isDragging = false
let startX = 0
let scrollStart = 0

function handleMouseDown(e: MouseEvent) {
  isDragging = true
  startX = e.clientX
  scrollStart = scrollContainer.value?.scrollLeft || 0
}
function handleMouseMove(e: MouseEvent) {
  if (!isDragging || !scrollContainer.value) return
  scrollContainer.value.scrollLeft = scrollStart - (e.clientX - startX)
}
function handleMouseUp() {
  isDragging = false
}
function handleTouchStart(e: TouchEvent) {
  isDragging = true
  startX = e.touches[0].clientX
  scrollStart = scrollContainer.value?.scrollLeft || 0
}
function handleTouchMove(e: TouchEvent) {
  if (!isDragging || !scrollContainer.value) return
  scrollContainer.value.scrollLeft =
    scrollStart - (e.touches[0].clientX - startX)
}

onMounted(() => {
  checkScrollEdges()
  const resizeObserver = new ResizeObserver(checkScrollEdges)
  if (scrollContainer.value) resizeObserver.observe(scrollContainer.value)
  onBeforeUnmount(() => resizeObserver.disconnect())
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroll-fade-left::before,
.scroll-fade-right::after {
  content: '';
  position: absolute;
  top: 0;
  width: 4.5rem;
  height: 100%;
  z-index: 30;
  pointer-events: none;
}
.scroll-fade-left::before {
  left: 0;
  background: linear-gradient(to right, var(--tw-bg-base-200), transparent);
}
.scroll-fade-right::after {
  right: 0;
  background: linear-gradient(to left, var(--tw-bg-base-200), transparent);
}
</style>
