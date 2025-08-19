<!-- /components/content/navigation/smart-icons.vue -->
<template>
  <div class="w-full h-full">
    <!-- Vertical control stack on the right -->
    <div class="absolute right-0 top-1/2 -translate-y-1/2 z-50 pr-2">
      <div class="flex flex-col gap-2 items-stretch">
        <!-- 1) Smart Icon edit/change (top) -->
        <template v-if="isEditing">
          <NuxtLink
            to="/icons"
            class="btn btn-square btn-sm"
            @click="confirmEdit"
            title="Add or manage icons"
          >
            <Icon name="kind-icon:plus" />
          </NuxtLink>

          <button
            v-if="hasChanges"
            class="btn btn-square btn-sm text-error"
            @click="revertEdit"
            title="Revert changes"
          >
            <Icon name="kind-icon:rotate" />
          </button>

          <button
            class="btn btn-square btn-sm bg-green-500 text-white"
            @click="confirmEdit"
            title="Save order"
          >
            <Icon name="kind-icon:check" />
          </button>
        </template>
        <button
          v-else
          class="btn btn-square btn-sm"
          @click="activateEditMode"
          title="Edit Smart Icons"
        >
          <Icon name="kind-icon:settings" />
        </button>

        <!-- 2) Corner menu toggle (middle) -->
        <button
          class="btn btn-square btn-sm"
          :class="displayStore.showCorner ? 'btn-primary' : ''"
          :title="
            displayStore.showCorner ? 'Hide Corner Menu' : 'Show Corner Menu'
          "
          :aria-pressed="displayStore.showCorner"
          @click="displayStore.toggleCorner()"
        >
          <Icon
            :name="
              displayStore.showCorner
                ? 'kind-icon:question-glow'
                : 'kind-icon:question'
            "
          />
        </button>

        <!-- 3) Tutorial toggle (bottom) -->
        <button
          class="btn btn-square btn-sm"
          :class="isTutorialOpen ? 'btn-primary' : ''"
          :title="isTutorialOpen ? 'Hide Tutorial' : 'Show Tutorial'"
          :aria-pressed="isTutorialOpen"
          @click="toggleTutorial"
        >
          <Icon
            :name="
              isTutorialOpen ? 'kind-icon:question-glow' : 'kind-icon:question'
            "
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

/** Swap row icons: when editing, show editableIcons (replaces normal row) */
const rowIcons = computed(() =>
  isEditing.value ? editableIcons.value : activeIcons.value,
)

/** Show titles only if not bigMode and not showCorner, and never during edit */
const showTitles = computed(
  () => !isEditing.value && !displayStore.bigMode && !displayStore.showCorner,
)

/** Tutorial toggle logic (was right-toggle.vue) */
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
