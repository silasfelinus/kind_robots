<!-- /components/content/navigation/smart-icons.vue -->
<template>
  <div class="w-full h-full flex items-stretch">
    <!-- Icon Row (fills remaining width) -->
    <div
      class="flex-1 min-w-0 h-full flex items-center pl-10 md:pl-12 pr-2 md:pr-3"
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

    <!-- Vertical toggle stack (right edge) -->
    <div class="flex flex-col h-full min-h-0 gap-2 pr-2 shrink-0 items-center">
      <!-- 1) Smart Icons edit/change -->
      <template v-if="isEditing">
        <!-- Editing toolbar: 3 small squares sharing the top third -->
        <div class="flex-1 min-h-0 w-full grid grid-cols-3 gap-2">
          <NuxtLink
            to="/icons"
            @click="confirmEdit"
            title="Add or manage icons"
            class="aspect-square rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
          >
            <Icon name="kind-icon:plus" class="h-[50%] w-[50%]" />
          </NuxtLink>

          <button
            v-if="hasChanges"
            @click="revertEdit"
            title="Revert changes"
            class="aspect-square rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
          >
            <Icon name="kind-icon:rotate" class="h-[50%] w-[50%]" />
          </button>

          <button
            @click="confirmEdit"
            title="Save order"
            class="aspect-square rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
          >
            <Icon name="kind-icon:check" class="h-[50%] w-[50%]" />
          </button>
        </div>
      </template>
      <button
        v-else
        @click="activateEditMode"
        title="Edit Smart Icons"
        class="flex-1 min-h-0 aspect-square rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
      >
        <Icon name="kind-icon:settings" class="h-[50%] w-[50%]" />
      </button>

      <!-- 2) Corner menu toggle -->
      <button
        class="flex-1 min-h-0 aspect-square rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
        :class="displayStore.showCorner ? 'ring-1 ring-primary/50' : ''"
        :title="
          displayStore.showCorner ? 'Hide Corner Menu' : 'Show Corner Menu'
        "
        :aria-pressed="displayStore.showCorner"
        @click="displayStore.toggleCorner()"
      >
        <!-- Swap to question/question-glow if you prefer that visual language -->
        <Icon
          :name="
            displayStore.showCorner
              ? 'kind-icon:panel-right'
              : 'kind-icon:panel-right-close'
          "
          class="h-[78%] w-[78%]"
        />
      </button>

      <!-- 3) Tutorial toggle (question / question-glow) -->
      <button
        class="flex-1 min-h-0 aspect-square rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
        :class="isTutorialOpen ? 'ring-1 ring-primary/50' : ''"
        :title="isTutorialOpen ? 'Hide Tutorial' : 'Show Tutorial'"
        :aria-pressed="isTutorialOpen"
        @click="toggleTutorial"
      >
        <Icon
          :name="
            isTutorialOpen ? 'kind-icon:question-glow' : 'kind-icon:question'
          "
          class="h-[78%] w-[78%]"
        />
      </button>
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

/** keep editableIcons synced when NOT editing; freeze snapshot on edit */
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

/** Row icons: editing shows editable set (replaces normal row) */
const rowIcons = computed(() =>
  isEditing.value ? editableIcons.value : activeIcons.value,
)

/** Show titles: hide whenever corner panel is visible */
const showTitles = computed(() => {
  if (displayStore.showCorner) return false
  return !isEditing.value && !displayStore.bigMode
})

/** Tutorial toggle state */
const isTutorialOpen = computed({
  get: () => displayStore.sidebarRightState === 'open',
  set: (val: boolean) => displayStore.setSidebarRight(val),
})
function toggleTutorial() {
  isTutorialOpen.value = !isTutorialOpen.value
}

/* scroll/drag code */
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
