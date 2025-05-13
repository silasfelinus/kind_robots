<!-- /components/content/icons/smart-icons.vue -->
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
        <Icon name="lucide:chevron-left" />
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
        <Icon name="lucide:chevron-right" />
      </button>
    </div>

    <!-- Edit Button (after right scroll) -->
    <div class="absolute right-0 top-1/2 -translate-y-1/2 z-50">
      <div v-if="!isEditing" class="flex flex-col gap-2 pr-2">
        <button
          class="btn btn-square btn-sm"
          @click="activateEditMode"
          title="Edit"
        >
          <Icon name="kind-icon:settings" />
        </button>
      </div>
    </div>

    <!-- Scrollable Area with Fade Overlays -->
    <div
      class="relative w-full h-full flex items-center pl-[4.5rem] pr-[9rem] scroll-fade-left scroll-fade-right"
    >
      <div
        ref="scrollContainer"
        class="overflow-x-auto scrollbar-hide w-full h-full touch-pan-x snap-x snap-mandatory"
        @scroll="checkScrollEdges"
        @mousedown="handleScrollMouseDown"
        @mousemove="handleScrollMouseMove"
        @mouseup="handleScrollMouseUp"
        @mouseleave="handleScrollMouseUp"
        @touchstart="handleScrollTouchStart"
        @touchmove="handleScrollTouchMove"
        @touchend="handleScrollMouseUp"
      >
        <!-- Icon Row -->
        <div
          class="flex items-center gap-1 md:gap-2 lg:gap-4 xl:gap-6 min-w-fit h-full select-none px-2"
        >
          <icon-shell v-for="(icon, index) in editableIcons" :key="icon.id">
            <template #icon>
              <div
                v-if="isEditing"
                class="w-full h-full flex items-center justify-center"
                draggable
                @dragstart="!isScrollDragging && onDragStart(index)"
                @drop="onDrop(index)"
              >
                <Icon
                  :name="icon.icon || 'lucide:help-circle'"
                  class="text-3xl max-w-[3rem] max-h-[3rem]"
                />
              </div>
              <NuxtLink
                v-else-if="icon.link && icon.type !== 'utility'"
                :to="icon.link"
                class="w-full h-full flex items-center justify-center transition-transform hover:scale-110"
              >
                <Icon
                  :name="icon.icon || 'lucide:help-circle'"
                  :class="[
                    'text-3xl max-w-[3rem] max-h-[3rem]',
                    { glow: icon.link && route.path.startsWith(icon.link) },
                  ]"
                />
              </NuxtLink>
              <div
                v-else-if="icon.type === 'utility'"
                class="w-full h-full flex items-center justify-center"
              >
                <component :is="icon.component" />
              </div>
              <Icon
                v-else
                :name="icon.icon || 'lucide:help-circle'"
                class="text-3xl max-w-[3rem] max-h-[3rem]"
              />
            </template>
            <template #label>
              <span
                v-if="!isEditing && !bigMode"
                class="text-xs text-center leading-none"
              >
                {{
                  icon.type === 'utility' && icon.component
                    ? getUtilityLabelFromName(icon.component)
                    : icon.label
                }}
              </span>
              <button
                v-else-if="isEditing"
                class="text-xs bg-red-500 text-white rounded-full z-50 px-2 py-0.5 hover:bg-red-600 pointer-events-auto"
                @click="removeIcon(index)"
              >
                ✕
              </button>
            </template>
          </icon-shell>

          <!-- Plus Icon -->
          <icon-shell>
            <template #icon>
              <NuxtLink
                to="/icongallery"
                @click="isEditing && confirmEdit()"
                class="flex items-center justify-center w-full h-full transition-transform hover:scale-110"
              >
                <Icon
                  name="lucide:plus-circle"
                  class="text-3xl w-full h-full"
                />
              </NuxtLink>
            </template>
            <template #label>
              <span v-if="bigMode" class="text-xs text-center leading-none">
                Add Icon
              </span>
            </template>
          </icon-shell>

          <!-- Confirm / Revert Buttons (during edit) -->
          <div v-if="isEditing" class="flex items-center gap-2">
            <button
              v-if="hasChanges"
              class="btn btn-square btn-xs bg-base-200 text-error hover:bg-base-300"
              @click="revertEdit"
            >
              <Icon name="lucide:rotate-ccw" />
            </button>
            <button
              class="btn btn-square btn-xs bg-green-500 text-white hover:bg-green-600"
              @click="confirmEdit"
            >
              <Icon name="lucide:check" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

// /components/content/icons/smart-icons.vue
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useIconStore, type SmartIcon } from '@/stores/iconStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useThemeStore } from '@/stores/themeStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const iconStore = useIconStore()
const displayStore = useDisplayStore()
const themeStore = useThemeStore()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()

const { bigMode } = storeToRefs(displayStore)
const { activeIcons, isEditing } = storeToRefs(iconStore)

const editableIcons = ref<SmartIcon[]>([...activeIcons.value])
const originalIcons = ref<SmartIcon[]>([])

function activateEditMode() {
  iconStore.isEditing = true
  displayStore.bigMode = false
}

const showSwarm = computed(() => iconStore.showSwarm)
const swarmMessage = computed(() => iconStore.swarmMessage)

function getUtilityLabelFromName(name: string): string {
  switch (name) {
    case 'theme-icon':
      return themeStore.currentTheme
    case 'login-icon':
      return userStore.isLoggedIn
        ? userStore.user?.username || 'User'
        : 'Login?'
    case 'jellybean-icon':
      return `${milestoneStore.milestoneCountForUser || 0} /11`
    case 'swarm-icon':
      return showSwarm.value ? swarmMessage.value : 'Swarm'
    default:
      return '…'
  }
}

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

  // 👇 Adjust threshold based on known padding (4.5rem = 72px)
  showLeft.value = scrollLeft > 72 - 4 // add a tiny buffer
  showRight.value = scrollRight > 72 - 4
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

// Scroll dragging
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
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
  transition: box-shadow 0.3s ease-in-out;
}
.scroll-fade-left::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4.5rem;
  height: 100%;
  background: linear-gradient(to right, var(--tw-bg-base-200), transparent);
  z-index: 30;
  pointer-events: none;
}

.scroll-fade-right::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4.5rem;
  height: 100%;
  background: linear-gradient(to left, var(--tw-bg-base-200), transparent);
  z-index: 30;
  pointer-events: none;
}
</style>
