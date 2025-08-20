<!-- /components/content/navigation/smart-icons.vue -->
<template>
  <div class="relative w-full h-full leading-none">
    <!-- Icon Row (fixed size/gap; only right padding changes to match toggle size) -->
    <div
      class="flex-1 min-w-0 h-full flex items-center pl-10 md:pl-12"
      :class="bigMode ? 'pr-10 md:pr-12' : 'pr-12 md:pr-16'"
    >
      <div
        ref="scrollContainer"
        class="overflow-x-auto overflow-y-hidden w-full h-full flex items-center gap-1 md:gap-2 snap-x snap-mandatory scroll-px-4 transition-all duration-300"
        :class="[displayStore.showCorner ? 'kr-hide-titles' : '']"
        @scroll="checkScrollEdgesThrottled"
        @mousedown="handleScrollMouseDown"
        @mousemove="handleScrollMouseMove"
        @mouseup="handleScrollMouseUp"
        @mouseleave="handleScrollMouseUp"
        @touchstart="handleScrollTouchStart"
        @touchmove="handleScrollTouchMove"
        @touchend="handleScrollMouseUp"
      >
        <!-- Icons: fixed sizes (no bigMode change) -->
        <icon-display
          v-for="icon in rowIcons"
          :key="icon.id"
          :icon="icon"
          :show-title="showTitles"
          class="snap-start shrink-0 h-full w-full max-w-24"
        />

        <!-- Plus icon (edit mode only), fixed sizes to match row -->
        <NuxtLink
          v-if="isEditing"
          to="/icons"
          class="snap-start shrink-0 flex items-center justify-center rounded-2xl bg-base-200 hover:bg-base-300 border border-base-content/10 transition h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12"
          title="Add or manage icons"
        >
          <Icon name="kind-icon:plus" class="h-[60%] w-[60%]" />
        </NuxtLink>
      </div>
    </div>

    <!-- ABSOLUTE right-side toggle stack (shrinks in bigMode) -->
    <div
      class="pointer-events-none absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-50"
    >
      <div
        class="flex flex-col items-center"
        :class="bigMode ? 'gap-1' : 'gap-2'"
      >
        <div
          class="grid"
          :class="[
            isEditing ? 'grid-cols-2' : 'grid-cols-1',
            bigMode ? 'gap-1' : 'gap-2',
          ]"
        >
          <button
            class="pointer-events-auto rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
            :class="bigMode ? 'h-5 w-5 md:h-6 md:w-6' : 'h-6 w-6 md:h-8 md:w-8'"
            @click="isEditing ? confirmEdit() : activateEditMode()"
            :title="
              isEditing
                ? hasChanges
                  ? 'Save order'
                  : 'No changes to save'
                : 'Edit Smart Icons'
            "
            :disabled="isEditing && !hasChanges"
            :aria-pressed="isEditing"
            aria-label="Toggle edit / confirm"
          >
            <Icon
              :name="isEditing ? 'kind-icon:check' : 'kind-icon:settings'"
              class="h-[55%] w-[55%]"
            />
          </button>

          <button
            v-if="isEditing"
            class="pointer-events-auto rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
            :class="bigMode ? 'h-5 w-5 md:h-6 md:w-6' : 'h-6 w-6 md:h-8 md:w-8'"
            @click="revertEdit"
            title="Cancel changes"
            aria-label="Cancel changes"
          >
            <Icon name="kind-icon:close" class="h-[55%] w-[55%]" />
          </button>
        </div>

        <button
          class="pointer-events-auto rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
          :class="[
            bigMode ? 'h-5 w-5 md:h-6 md:w-6' : 'h-6 w-6 md:h-8 md:w-8',
            displayStore.showCorner ? 'ring-1 ring-primary/50' : '',
          ]"
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
            class="h-[60%] w-[60%]"
          />
        </button>

        <button
          class="pointer-events-auto rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
          :class="[
            bigMode ? 'h-5 w-5 md:h-6 md:w-6' : 'h-6 w-6 md:h-8 md:w-8',
            isTutorialOpen ? 'ring-1 ring-primary/50' : '',
          ]"
          :title="isTutorialOpen ? 'Hide Tutorial' : 'Show Tutorial'"
          :aria-pressed="isTutorialOpen"
          @click="toggleTutorial"
        >
          <Icon
            :name="
              isTutorialOpen ? 'kind-icon:question-glow' : 'kind-icon:question'
            "
            class="h-[60%] w-[60%]"
          />
        </button>
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
const bigMode = computed(() => displayStore.bigMode)

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
  const a = getIds(editableIcons.value),
    b = getIds(originalIcons.value)
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
const showTitles = computed(() => !isEditing.value && !displayStore.bigMode)

const isTutorialOpen = computed({
  get: () => displayStore.sidebarRightState === 'open',
  set: (val: boolean) => displayStore.setSidebarRight(val),
})
function toggleTutorial() {
  isTutorialOpen.value = !isTutorialOpen.value
}

const scrollContainer = ref<HTMLElement | null>(null)
let scrollTick = false
function checkScrollEdges() {}
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

<style scoped>
.kr-hide-titles
  :where(.icon-title, .smart-icon-title, .label, [data-icon-title]) {
  visibility: hidden;
}
.kr-hide-titles [aria-label='icon-title'] {
  visibility: hidden;
}
</style>
