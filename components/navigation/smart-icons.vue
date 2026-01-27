<!-- /components/content/navigation/smart-icons.vue -->
<template>
  <div
    class="relative w-full flex-1 min-w-0 leading-none h-full min-h-[2.25rem] rounded-2xl border border-base-content/10 bg-base-100/30"
  >
    <div
      class="absolute left-1 top-1 z-50 rounded-md bg-base-300/90 px-2 py-1 text-[10px] font-semibold leading-none"
    >
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1">
          <span
            class="inline-block w-2 h-2 rounded-full bg-success"
            v-if="isMounted"
          />
          <span class="inline-block w-2 h-2 rounded-full bg-warning" v-else />
          smart-icons
        </span>
        <span class="opacity-70">
          a:{{ activeCount }} f:{{ filteredCount }} r:{{ rowCount }}
        </span>
        <span class="opacity-70">
          edit:{{ isEditing ? '1' : '0' }} big:{{
            displayStore.bigMode ? '1' : '0'
          }}
          corner:{{ displayStore.showCorner ? '1' : '0' }}
        </span>
      </div>
    </div>

    <div class="h-full w-full flex items-stretch min-w-0 gap-[2px]">
      <div
        ref="scrollContainer"
        class="h-full min-h-0 flex-1 min-w-0 flex items-stretch snap-x snap-mandatory transition-all duration-300 gap-[2px] overflow-x-auto overflow-y-hidden smart-icons-scroll select-none px-10 sm:px-12 pt-6"
        :class="[
          displayStore.showCorner
            ? '[&_.icon-title]:invisible [&_.smart-icon-title]:invisible [&_.label]:invisible [&_[data-icon-title]]:invisible [&_[aria-label=icon-title]]:invisible'
            : '',
          '[&_*]:!mt-0 [&_*]:!mb-0 [&_*]:!pt-0 [&_*]:!pb-0',
          '[&_*]:!ms-0 [&_*]:!me-0',
          '[&>*]:h-full',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        ]"
        @scroll="checkScrollEdgesThrottled"
        @mousedown="handleScrollMouseDown"
        @mousemove="handleScrollMouseMove"
        @mouseup="handleScrollMouseUp"
        @mouseleave="handleScrollMouseUp"
        @touchstart="handleScrollTouchStart"
        @touchmove="handleScrollTouchMove"
        @touchend="handleScrollTouchEnd"
        @wheel.passive="handleWheel"
        tabindex="0"
        @keydown.left.prevent="scrollByStep(-1)"
        @keydown.right.prevent="scrollByStep(1)"
        aria-label="Smart icons"
      >
        <div
          ref="row"
          class="h-full min-h-0 flex items-stretch gap-[2px] min-w-max"
        >
          <div
            aria-hidden="true"
            class="shrink-0 h-full w-3 sm:w-4 md:w-6 lg:w-8"
          />

          <div
            v-if="rowIcons.length === 0"
            class="snap-start shrink-0 h-full aspect-square flex items-center justify-center"
          >
            <button
              type="button"
              class="group relative h-[85%] w-[85%] flex flex-col items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 text-warning transition outline-none focus-visible:ring-2 focus-visible:ring-warning/50"
              title="No nav icons found"
              aria-label="No nav icons found"
              @click="activateEditMode"
            >
              <Icon
                name="kind-icon:alert"
                class="pointer-events-none h-[60%] w-[60%]"
              />
              <span
                class="icon-title mt-[0.15em] text-[10px] opacity-90 select-none"
              >
                No icons
              </span>
            </button>
          </div>

          <icon-display
            v-for="icon in rowIcons"
            :key="icon.id"
            :icon="icon"
            :show-title="showTitles"
            class="snap-start shrink-0 h-full aspect-square flex"
          />

          <div
            v-if="isEditing"
            class="snap-start shrink-0 h-full aspect-square flex items-center justify-center"
          >
            <NuxtLink
              to="/icons"
              class="group relative h-[85%] w-[85%] flex flex-col items-center justify-center rounded-2xl bg-base-200 hover:bg-base-300 border border-base-content/10 transition outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              title="Add or manage icons"
              aria-label="Add or manage icons"
            >
              <Icon
                name="kind-icon:plus"
                class="pointer-events-none h-[60%] w-[60%]"
              />
              <span
                class="icon-title mt-[0.15em] text-xs opacity-80 select-none"
              >
                Add
              </span>
            </NuxtLink>
          </div>

          <div
            v-if="!isEditing"
            class="snap-start shrink-0 h-full aspect-square flex items-center justify-center"
          >
            <button
              type="button"
              class="group relative h-[85%] w-[85%] flex flex-col items-center justify-center rounded-2xl bg-base-200 hover:bg-base-300 border border-base-content/10 transition outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              title="Edit Smart Icons"
              aria-label="Edit Smart Icons"
              @click="activateEditMode"
            >
              <Icon
                name="kind-icon:settings"
                class="pointer-events-none h-[60%] w-[60%]"
              />
              <span
                v-if="showTitles"
                class="icon-title mt-[0.15em] text-xs opacity-80 select-none"
              >
                Edit
              </span>
            </button>
          </div>

          <div
            v-if="isEditing"
            class="snap-start shrink-0 h-full aspect-square flex items-center justify-center"
          >
            <button
              type="button"
              class="group relative h-[85%] w-[85%] flex flex-col items-center justify-center rounded-2xl border border-base-content/10 transition outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              :class="
                hasChanges
                  ? 'bg-base-200 hover:bg-base-300'
                  : 'bg-base-200/60 cursor-not-allowed opacity-60'
              "
              :title="hasChanges ? 'Save icon order' : 'No changes to save'"
              aria-label="Save icon order"
              :disabled="!hasChanges"
              @click="hasChanges && confirmEdit()"
            >
              <Icon
                name="kind-icon:check"
                class="pointer-events-none h-[60%] w-[60%]"
              />
              <span
                v-if="showTitles"
                class="icon-title mt-[0.15em] text-xs opacity-80 select-none"
              >
                Save
              </span>
            </button>
          </div>

          <div
            v-if="isEditing"
            class="snap-start shrink-0 h-full aspect-square flex items-center justify-center"
          >
            <button
              type="button"
              class="group relative h-[85%] w-[85%] flex flex-col items-center justify-center rounded-2xl bg-base-200 hover:bg-base-300 border border-base-content/10 transition outline-none focus-visible:ring-2 focus-visible:ring-error/60"
              title="Cancel icon changes"
              aria-label="Cancel icon changes"
              @click="revertEdit"
            >
              <Icon
                name="kind-icon:close"
                class="pointer-events-none h-[60%] w-[60%]"
              />
              <span
                v-if="showTitles"
                class="icon-title mt-[0.15em] text-xs opacity-80 select-none"
              >
                Cancel
              </span>
            </button>
          </div>

          <div
            aria-hidden="true"
            class="shrink-0 h-full w-3 sm:w-4 md:w-6 lg:w-8"
          />
        </div>
      </div>

      <div class="pointer-events-none absolute inset-y-0 left-0 right-0 z-30">
        <div
          v-show="canScrollLeft"
          class="absolute left-0 top-0 h-full w-10 sm:w-12 bg-gradient-to-r from-base-100/80 to-transparent"
        />
        <div
          v-show="canScrollRight"
          class="absolute right-0 top-0 h-full w-10 sm:w-12 bg-gradient-to-l from-base-100/80 to-transparent"
        />

        <button
          v-if="canScrollLeft"
          type="button"
          class="pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-base-200/80 hover:bg-base-200 shadow-sm border border-base-300 text-base-content/80 w-6 h-6 lg:w-7 lg:h-7"
          @click="scrollByStep(-1)"
          aria-label="Scroll left"
          title="Scroll left"
        >
          <Icon name="kind-icon:chevron-left" class="w-3 h-3 lg:w-4 lg:h-4" />
        </button>

        <button
          v-if="canScrollRight"
          type="button"
          class="pointer-events-auto absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-base-200/80 hover:bg-base-200 shadow-sm border border-base-300 text-base-content/80 w-6 h-6 lg:w-7 lg:h-7"
          @click="scrollByStep(1)"
          aria-label="Scroll right"
          title="Scroll right"
        >
          <Icon name="kind-icon:chevron-right" class="w-3 h-3 lg:w-4 lg:h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/navigation/smart-icons.vue
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useSmartbarStore, type SmartIcon } from '@/stores/smartbarStore'
import { useDisplayStore } from '@/stores/displayStore'

const smartbarStore = useSmartbarStore()
const displayStore = useDisplayStore()
const { activeIcons, isEditing, editableIcons } = storeToRefs(smartbarStore)

const isMounted = ref(false)

const isNav = (icon: SmartIcon) => (icon?.type || '').toLowerCase() === 'nav'

const filteredActive = computed<SmartIcon[]>(() =>
  activeIcons.value.filter(isNav),
)

watch(
  activeIcons,
  () => {
    if (!isEditing.value) editableIcons.value = [...filteredActive.value]
  },
  { immediate: true },
)

const rowIcons = computed<SmartIcon[]>(() =>
  isEditing.value ? editableIcons.value.filter(isNav) : filteredActive.value,
)

const showTitles = computed(() => !isEditing.value && !displayStore.bigMode)

const activeCount = computed(() => activeIcons.value.length)
const filteredCount = computed(() => filteredActive.value.length)
const rowCount = computed(() => rowIcons.value.length)

const originalIcons = ref<SmartIcon[]>([])

watch(isEditing, (editing) => {
  if (editing) originalIcons.value = [...editableIcons.value.filter(isNav)]
})

const getIds = (icons: SmartIcon[]) => icons.map((i) => i.id)

const hasChanges = computed(() => {
  const a = getIds(editableIcons.value.filter(isNav))
  const b = getIds(originalIcons.value.filter(isNav))
  if (a.length !== b.length) return true
  return a.some((id, i) => id !== b[i])
})

function activateEditMode() {
  smartbarStore.isEditing = true
}

function confirmEdit() {
  smartbarStore.setIconOrder(getIds(editableIcons.value.filter(isNav)))
  smartbarStore.isEditing = false
}

function revertEdit() {
  editableIcons.value = [...originalIcons.value]
  smartbarStore.isEditing = false
}

const scrollContainer = ref<HTMLElement | null>(null)
const row = ref<HTMLElement | null>(null)

const isDragging = ref(false)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

let scrollTick = false
let startX = 0
let scrollStart = 0
const EPSILON = 2

function updateScrollFlags() {
  const el = scrollContainer.value
  if (!el) return
  if (el.scrollWidth <= el.clientWidth + 1) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  const maxScrollLeft = el.scrollWidth - el.clientWidth
  canScrollLeft.value = el.scrollLeft > EPSILON
  canScrollRight.value = maxScrollLeft - el.scrollLeft > EPSILON
}

function checkScrollEdges() {
  updateScrollFlags()
}

function checkScrollEdgesThrottled() {
  if (scrollTick) return
  scrollTick = true
  requestAnimationFrame(() => {
    checkScrollEdges()
    scrollTick = false
  })
}

function scrollByStep(direction: -1 | 1) {
  const el = scrollContainer.value
  if (!el) return
  const step = Math.max(160, el.clientWidth * 0.8)
  el.scrollBy({ left: direction * step, behavior: 'smooth' })
}

function handleScrollMouseDown(e: MouseEvent) {
  if (!scrollContainer.value) return
  isDragging.value = true
  startX = e.clientX
  scrollStart = scrollContainer.value.scrollLeft
  e.preventDefault()
}

function handleScrollMouseMove(e: MouseEvent) {
  if (!isDragging.value || !scrollContainer.value) return
  const delta = e.clientX - startX
  scrollContainer.value.scrollLeft = scrollStart - delta
}

function handleScrollMouseUp() {
  if (!isDragging.value) return
  isDragging.value = false
  requestAnimationFrame(updateScrollFlags)
}

function handleScrollTouchStart(e: TouchEvent) {
  if (!scrollContainer.value) return
  isDragging.value = true
  startX = e.touches[0].clientX
  scrollStart = scrollContainer.value.scrollLeft
}

function handleScrollTouchMove(e: TouchEvent) {
  if (!isDragging.value || !scrollContainer.value) return
  const delta = e.touches[0].clientX - startX
  scrollContainer.value.scrollLeft = scrollStart - delta
}

function handleScrollTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  requestAnimationFrame(updateScrollFlags)
}

function handleWheel(e: WheelEvent) {
  const el = scrollContainer.value
  if (!el) return
  if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
    el.scrollBy({ left: e.deltaY, behavior: 'auto' })
  }
}

watch(
  () => rowIcons.value.length,
  () => {
    syncAfterLayout()
  },
)

watch(
  () => [
    displayStore.bigMode,
    displayStore.viewportSize,
    displayStore.headerState,
    displayStore.sidebarRightState,
    displayStore.showCorner,
  ],
  () => {
    syncAfterLayout()
  },
  { flush: 'post' },
)

function syncAfterLayout() {
  nextTick(() => {
    requestAnimationFrame(() => {
      updateScrollFlags()
    })
  })
}

let resizeObserver: ResizeObserver | null = null
let rowResizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null

onMounted(() => {
  isMounted.value = true

  const el = scrollContainer.value
  const content = row.value
  if (!el || !content) return

  resizeObserver = new ResizeObserver(checkScrollEdgesThrottled)
  rowResizeObserver = new ResizeObserver(checkScrollEdgesThrottled)
  mutationObserver = new MutationObserver(checkScrollEdgesThrottled)

  resizeObserver?.observe(el)
  rowResizeObserver?.observe(content)
  mutationObserver?.observe(content, { childList: true })

  syncAfterLayout()
})

onBeforeUnmount(() => {
  const el = scrollContainer.value
  const content = row.value
  if (resizeObserver && el) resizeObserver.unobserve(el)
  if (rowResizeObserver && content) rowResizeObserver.unobserve(content)
  if (mutationObserver) mutationObserver.disconnect()
})
</script>

<style scoped>
.smart-icons-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.smart-icons-scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
