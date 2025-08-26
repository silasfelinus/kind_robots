<!-- /components/content/navigation/smart-icons.vue -->
<template>
  <div class="relative w-full h-full leading-none">
    <!-- Row uses only % + 1vh vertical padding; no hard numbers -->
    <div class="flex-1 min-w-0 h-full flex items-center w-full">
      <div
        ref="scrollContainer"
        class="overflow-x-auto overflow-y-hidden w-full h-full flex items-center snap-x snap-mandatory transition-all duration-300 py-[1vh] px-[1%]"
        :class="[
          displayStore.showCorner ? 'kr-hide-titles' : '',
          'gap-[1%]', // percent gap so it scales with width
        ]"
        @scroll="checkScrollEdgesThrottled"
        @mousedown="handleScrollMouseDown"
        @mousemove="handleScrollMouseMove"
        @mouseup="handleScrollMouseUp"
        @mouseleave="handleScrollMouseUp"
        @touchstart="handleScrollTouchStart"
        @touchmove="handleScrollTouchMove"
        @touchend="handleScrollMouseUp"
      >
        <!-- Icons auto-size to the row height; width constrained by max-% to keep titles visible -->
        <icon-display
          v-for="icon in rowIcons"
          :key="icon.id"
          :icon="icon"
          :show-title="showTitles"
          class="snap-start shrink-0 h-full"
          :style="{
            // let each icon block be up to 12% wide; adjust if you want more/less density
            maxWidth: '12%',
            width: 'auto',
          }"
        />

        <!-- Plus icon (edit mode only), matches icon sizing logic -->
        <NuxtLink
          v-if="isEditing"
          to="/icons"
          class="snap-start shrink-0 flex items-center justify-center rounded-2xl bg-base-200 hover:bg-base-300 border border-base-content/10 transition h-full"
          :style="{ maxWidth: '12%' }"
          title="Add or manage icons"
        >
          <Icon class="h-[60%] w-[60%]" name="kind-icon:plus" />
        </NuxtLink>
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

const rowIcons = computed(() =>
  isEditing.value ? editableIcons.value : activeIcons.value,
)
const showTitles = computed(() => !isEditing.value && !displayStore.bigMode)

// drag-to-scroll + edge checking
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
