<template>
  <div class="relative w-full h-full">
    <!-- Scrollable Row with Sticky Controls -->
    <div class="relative w-full h-full">
      <!-- Scroll Buttons -->
      <button
        v-if="showLeft"
        class="absolute left-0 z-20 h-[3rem] w-[1rem] sm:h-[3.25rem] sm:w-[1.1rem] lg:h-[3.5rem] lg:w-[1.2rem] flex items-center justify-center bg-base-300 bg-opacity-80 rounded-l-xl"
        @click="scrollBy(-100)"
      >
        <Icon name="lucide:chevron-left" class="text-lg" />
      </button>

      <button
        v-if="showRight"
        class="absolute right-[3rem] z-20 h-[3rem] w-[1rem] sm:h-[3.25rem] sm:w-[1.1rem] lg:h-[3.5rem] lg:w-[1.2rem] flex items-center justify-center bg-base-300 bg-opacity-80 rounded-r-xl"
        @click="scrollBy(100)"
      >
        <Icon name="lucide:chevron-right" class="text-lg" />
      </button>

      <!-- Scrollable Area -->
      <div
        ref="scrollContainer"
        class="overflow-x-auto scrollbar-hide w-full h-full touch-pan-x"
        @scroll="checkScrollEdges"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
      >
        <div class="flex items-center gap-2 min-w-fit px-2 h-full select-none">
          <component
            v-for="(icon, index) in editableIcons"
            :key="icon.id"
            :is="renderIconComponent(icon, index)"
          />
        </div>
      </div>

      <!-- Edit / Confirm / Revert Buttons -->
      <div class="absolute right-0 top-1/2 -translate-y-1/2 z-30">
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
            class="btn btn-square btn-xs bg-green-500 text-white hover:bg-green-600"
            @click="confirmEdit"
            title="Confirm"
          >
            <Icon name="lucide:check" />
          </button>
          <button
            v-if="hasChanges"
            class="btn btn-square btn-xs bg-base-200 text-error hover:bg-base-300"
            @click="revertEdit"
            title="Revert"
          >
            <Icon name="lucide:rotate-ccw" />
          </button>
          <div v-else class="invisible btn btn-square btn-xs" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, h } from 'vue'
import { storeToRefs } from 'pinia'
import { useIconStore, type SmartIcon } from '@/stores/iconStore'

const iconStore = useIconStore()
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
  return JSON.stringify(editableIcons.value.map((i) => i.id)) !==
    JSON.stringify(originalIcons.value.map((i) => i.id))
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
  const newIds = editableIcons.value.map((i) => i.id)
  iconStore.setIconOrder(newIds)
  isEditing.value = false
}

function revertEdit() {
  editableIcons.value = [...originalIcons.value]
  isEditing.value = false
}

// Scroll handling
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

// Drag-to-scroll logic
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

// Inline render helper
function renderIconComponent(icon: SmartIcon, index: number) {
  return {
    setup() {
      return () =>
        h(
          'div',
          {
            class: [
              'group relative flex flex-col items-center justify-center',
              isEditing.value ? 'cursor-move' : '',
            ],
            draggable: isEditing.value,
            onDragstart: () => onDragStart(index),
            onDrop: () => onDrop(index),
            onDragover: (e: Event) => e.preventDefault(),
          },
          [
            icon.link && !isEditing.value && icon.type !== 'utility'
              ? h(
                  'NuxtLink',
                  {
                    to: icon.link,
                    class: 'flex flex-col items-center',
                  },
                  [
                    h('Icon', {
                      name: icon.icon || 'lucide:help-circle',
                      class:
                        'hover:scale-110 transition-transform text-3xl w-[3rem] h-[3rem]',
                    }),
                    h(
                      'span',
                      {
                        class:
                          'mt-1 hidden md:block text-center text-sm whitespace-nowrap',
                      },
                      icon.label || icon.title,
                    ),
                  ],
                )
              : icon.type === 'utility'
              ? h(
                  'div',
                  {
                    class:
                      'flex items-center justify-center text-3xl w-[3rem] h-[3rem]',
                  },
                  [h(resolveComponent(icon.component))],
                )
              : h('Icon', {
                  name: icon.icon || 'lucide:help-circle',
                  class: 'text-3xl w-[3rem] h-[3rem]',
                }),

            isEditing.value &&
              h(
                'button',
                {
                  class:
                    'mt-1 text-xs bg-red-500 text-white rounded-full px-2 py-0.5 hover:bg-red-600',
                  onClick: () => removeIcon(index),
                },
                '✕',
              ),
          ],
        )
    },
  }
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
