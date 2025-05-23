<!-- /components/content/icons/icon-bar.vue -->
<template>
  <div class="relative w-full h-full overflow-hidden">
    <!-- Scroll Arrows -->
    <ScrollArrowLeft v-if="showLeft" @scroll="startContinuousScroll(-1)" />
    <ScrollArrowRight v-if="showRight" @scroll="startContinuousScroll(1)" />

    <!-- Edit/Add/Confirm/Revert Buttons -->
    <div class="absolute right-0 top-1/2 -translate-y-1/2 z-50">
      <div class="flex flex-col gap-2 pr-2">
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
        <button v-else class="btn btn-square btn-sm" @click="activateEditMode">
          <Icon name="kind-icon:settings" />
        </button>
      </div>
    </div>

    <!-- Icon Row -->
    <div class="relative w-full h-full flex items-center pl-[4.5rem] pr-[9rem] scroll-fade-left scroll-fade-right">
      <div
        ref="scrollContainer"
        class="overflow-x-auto scrollbar-hide w-full h-full flex gap-2 snap-x snap-mandatory"
        @scroll="checkScrollEdges"
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
      return ${milestoneStore.milestoneCountForUser || 0} /11
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

