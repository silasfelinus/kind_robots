<!-- /components/content/story/smart-icons.vue -->
<template>
  <div class="relative w-full h-full overflow-hidden">
    <div class="relative w-full h-full flex items-center pr-[4.5rem]">
      <!-- Scrollable Area -->
      <div
        ref="scrollContainer"
        class="overflow-x-auto scrollbar-hide w-full h-full touch-pan-x snap-x snap-mandatory scroll-mx-[4.5rem]"
        @scroll="checkScrollEdges"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
        @touchstart="startTouch"
        @touchmove="onTouchMove"
        @touchend="endDrag"
      >
<!-- Icon Container -->
<div
  v-for="(icon, index) in editableIcons"
  :key="icon.id"
  class="group relative flex flex-col items-center justify-center snap-start"
  :class="{ 'cursor-move': isEditing }"
  draggable="true"
  @dragstart="onDragStart(index)"
  @dragover.prevent
  @drop="onDrop(index)"
>
  <!-- Icon Display (link or component) -->
  <NuxtLink
    v-if="!isEditing && icon.link && icon.type !== 'utility'"
    :to="icon.link"
    class="flex flex-col items-center"
  >
    <Icon
      :name="icon.icon || 'lucide:help-circle'"
      class="hover:scale-110 transition-transform text-3xl w-[3rem] h-[3rem]"
    />
    <span v-if="!bigMode" class="text-xs text-center mt-1">
      {{ icon.label }}
    </span>
  </NuxtLink>

  <div
    v-else-if="icon.type === 'utility'"
    class="flex flex-col items-center justify-center text-3xl w-[3rem] h-[3rem]"
  >
    <component :is="icon.component" />
  </div>

  <div class="flex flex-col items-center">
    <Icon
      v-if="!icon.link && icon.type !== 'utility'"
      :name="icon.icon || 'lucide:help-circle'"
      class="text-3xl w-[3rem] h-[5rem]"
    />
  </div>

  <!-- Floating Remove Button -->
  <button
    v-if="isEditing"
    class="absolute -bottom-3 text-xs bg-red-500 text-white rounded-full px-2 py-0.5 hover:bg-red-600 z-30"
    @click="removeIcon(index)"
  >
    ✕
  </button>
</div>


          <!-- Add Icon -->
          <NuxtLink
            to="/icongallery"
            @click="isEditing && confirmEdit()"
            class="group flex flex-col items-center justify-center text-3xl w-[3rem] h-[3rem] snap-start"
          >
            <Icon name="lucide:plus-circle" class="hover:scale-110 transition-transform" />
            <span
              v-if="bigMode"
              class="text-xs text-center mt-1"
            >
              Add Icon
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- Edit / Confirm / Revert Buttons -->
      <div class="absolute right-0 top-1/2 -translate-y-1/2 z-40">
        <div v-if="!isEditing" class="flex flex-col gap-2 pr-2">
          <button
            class="btn btn-square btn-sm"
            @click="isEditing = true"
            title="Edit"
          >
            <Icon name="kind-icon:settings" />
          </button>
        </div>
        <div v-else class="flex flex-col gap-2 pr-2">
          <button
            v-if="hasChanges"
            class="btn btn-square btn-xs bg-base-200 text-error hover:bg-base-300"
            @click="revertEdit"
            title="Revert"
          >
            <Icon name="lucide:rotate-ccw" />
          </button>
          <button
            class="btn btn-square btn-xs bg-green-500 text-white hover:bg-green-600"
            @click="confirmEdit"
            title="Confirm"
          >
            <Icon name="lucide:check" />
          </button>
        </div>
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
const { bigMode } = storeToRefs(displayStore)
const { activeIcons } = storeToRefs(iconStore)

const isEditing = ref(false)
const editableIcons = ref<SmartIcon[]>([...activeIcons.value])
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

const hasChanges = computed(() => {
  return (
    JSON.stringify(editableIcons.value.map((i) => i.id)) !==
    JSON.stringify(originalIcons.value.map((i) => i.id))
  )
})

let dragIndex = -1
function onDragStart(index: number) {
  dragIndex = index
}
function onDrop(index: number) {
  if (dragIndex < 0 || dragIndex === index) return
  const dragged = editableIcons.value.splice(dragIndex, 1)[0]
  editableIcons.value.splice(index, 0, dragged)
  dragIndex = -1
}
function removeIcon(index: number) {
  const removed = editableIcons.value.splice(index, 1)[0]
  iconStore.removeIconFromSmartBar(removed.id)
}
function confirmEdit() {
  iconStore.setIconOrder(editableIcons.value.map((i) => i.id))
  isEditing.value = false
}
function revertEdit() {
  editableIcons.value = [...originalIcons.value]
  isEditing.value = false
}

// Scroll logic
const scrollContainer = ref<HTMLElement | null>(null)
const showLeft = ref(false)
const showRight = ref(false)
function checkScrollEdges() {
  const el = scrollContainer.value
  if (!el) return
  showLeft.value = el.scrollLeft > 5
  showRight.value = el.scrollWidth - el.clientWidth - el.scrollLeft > 5
}
function scrollBy(px: number) {
  scrollContainer.value?.scrollBy({ left: px, behavior: 'smooth' })
}

// Drag-to-scroll & touch
let isDragging = false
let startX = 0
let scrollStart = 0
function startDrag(event: MouseEvent) {
  isDragging = true
  startX = event.clientX
  scrollStart = scrollContainer.value?.scrollLeft || 0
}
function onDrag(event: MouseEvent) {
  if (!isDragging || !scrollContainer.value) return
  const dx = event.clientX - startX
  scrollContainer.value.scrollLeft = scrollStart - dx
}
function endDrag() {
  isDragging = false
}
function startTouch(e: TouchEvent) {
  isDragging = true
  startX = e.touches[0].clientX
  scrollStart = scrollContainer.value?.scrollLeft || 0
}
function onTouchMove(e: TouchEvent) {
  if (!isDragging || !scrollContainer.value) return
  const dx = e.touches[0].clientX - startX
  scrollContainer.value.scrollLeft = scrollStart - dx
}

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  checkScrollEdges()
  resizeObserver = new ResizeObserver(checkScrollEdges)
  if (scrollContainer.value) resizeObserver.observe(scrollContainer.value)
})
onBeforeUnmount(() => {
  if (resizeObserver && scrollContainer.value) {
    resizeObserver.unobserve(scrollContainer.value)
  }
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
