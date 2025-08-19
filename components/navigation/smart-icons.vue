<!-- /components/content/navigation/smart-icons.vue -->
<template>
  <div class="w-full h-full">
    <!-- Vertical control stack on the right: fills parent height, 3 equal rows -->
    <div class="absolute inset-y-0 right-0 my-1 pr-2 z-50">
      <div class="grid grid-rows-3 h-full gap-2">
        <!-- 1) Smart Icon edit/change (top row) -->
        <div class="h-full">
          <div v-if="isEditing" class="flex h-full gap-2">
            <NuxtLink
              to="/icons"
              @click="confirmEdit"
              title="Add or manage icons"
              class="h-full w-full rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
            >
              <Icon name="kind-icon:plus" class="h-[78%] w-[78%]" />
            </NuxtLink>

            <button
              v-if="hasChanges"
              @click="revertEdit"
              title="Revert changes"
              class="h-full w-full rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
            >
              <Icon name="kind-icon:rotate" class="h-[78%] w-[78%]" />
            </button>

            <button
              @click="confirmEdit"
              title="Save order"
              class="h-full w-full rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
            >
              <Icon name="kind-icon:check" class="h-[78%] w-[78%]" />
            </button>
          </div>

          <button
            v-else
            @click="activateEditMode"
            title="Edit Smart Icons"
            class="h-full w-full rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
          >
            <Icon name="kind-icon:settings" class="h-[78%] w-[78%]" />
          </button>
        </div>

        <!-- 2) Corner menu toggle (middle row) -->
        <button
          class="h-full w-full rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
          :class="displayStore.showCorner ? 'ring-1 ring-primary/50' : ''"
          :title="
            displayStore.showCorner ? 'Hide Corner Menu' : 'Show Corner Menu'
          "
          :aria-pressed="displayStore.showCorner"
          @click="displayStore.toggleCorner()"
        >
          <Icon
            :name="
              displayStore.showCorner
                ? 'kind-icon:panel-right'
                : 'kind-icon:panel-right-close'
            "
            class="h-[78%] w-[78%]"
          />
        </button>

        <!-- 3) Tutorial toggle (bottom row) -->
        <button
          class="h-full w-full rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
          :class="isTutorialOpen ? 'ring-1 ring-primary/50' : ''"
          :title="isTutorialOpen ? 'Hide Tutorial' : 'Show Tutorial'"
          :aria-pressed="isTutorialOpen"
          @click="toggleTutorial"
        >
          <Icon
            :name="
              isTutorialOpen ? 'kind-icon:tutorial-glow' : 'kind-icon:tutorial'
            "
            class="h-[78%] w-[78%]"
          />
        </button>
      </div>
    </div>

    <!-- Icon Row -->
    <div
      class="relative w-full h-full flex items-center pl-10 md:pl-12 pr-20 md:pr-24"
    >
      <div
        ref="scrollContainer"
        class="overflow-x-auto overflow-y-hidden w-full h-full flex items-center gap-1 md:gap-2 snap-x snap-mandatory scroll-px-4 transition-all duration-300"
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
          v-for="icon in rowIcons"
          :key="icon.id"
          :icon="icon"
          :show-title="showTitles"
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
const { activeIcons, isEditing, editableIcons } = storeToRefs(smartbarStore)

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

const rowIcons = computed(() =>
  isEditing.value ? editableIcons.value : activeIcons.value,
)

const showTitles = computed(() => {
  if (displayStore.showCorner) return false
  return !isEditing.value && !displayStore.bigMode
})

/** Tutorial toggle */
const isTutorialOpen = computed({
  get: () => displayStore.sidebarRightState === 'open',
  set: (val: boolean) => displayStore.setSidebarRight(val),
})
function toggleTutorial() {
  isTutorialOpen.value = !isTutorialOpen.value
}

/* scroll/drag */
const scrollContainer = ref<HTMLElement | null>(null)
let scrollTick = false
function checkScrollEdges() {
  const el = scrollContainer.value
  if (!el) return
}
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
