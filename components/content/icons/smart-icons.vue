<template>
  <div class="relative w-full h-full">
    <!-- Scrollable Icon Row -->
    <div
      ref="scrollContainer"
      class="w-full h-full overflow-x-auto scrollbar-hide"
      @scroll="checkScrollEdges"
    >
      <div class="flex items-center gap-2 min-w-fit px-2 h-full">
        <!-- Filler if no icons -->
        <div
          v-if="!editableIcons.length"
          class="flex flex-col items-center justify-center"
        >
          <Icon
            name="kind-icon:portal"
            class="opacity-50 text-3xl lg:text-4xl xl:text-5xl w-[2.5rem] h-[2.5rem] sm:w-[2.75rem] sm:h-[2.75rem] lg:w-[3rem] lg:h-[3rem] xl:w-[3.5rem] xl:h-[3.5rem]"
          />
          <span
            class="mt-1 hidden md:block text-center text-base-content/70 text-sm sm:text-sm md:text-md lg:text-lg xl:text-xl"
          >
            No icons
          </span>
        </div>

        <!-- Icon List -->
        <div
          v-for="(icon, index) in editableIcons"
          :key="icon.id"
          class="group relative flex flex-col items-center justify-center"
          :class="{ 'cursor-move': isEditing }"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover.prevent
          @drop="onDrop(index)"
        >
          <!-- Nav Icon -->
          <NuxtLink
            v-if="!isEditing && icon.link && icon.type !== 'utility'"
            :to="icon.link"
            class="flex flex-col items-center"
          >
            <Icon
              :name="icon.icon || 'lucide:help-circle'"
              class="hover:scale-110 transition-transform text-3xl lg:text-4xl xl:text-5xl w-[2.5rem] h-[2.5rem] sm:w-[2.75rem] sm:h-[2.75rem] lg:w-[3rem] lg:h-[3rem] xl:w-[3.5rem] xl:h-[3.5rem]"
            />
            <span
              class="mt-1 hidden md:block text-center text-sm sm:text-sm md:text-md lg:text-lg xl:text-xl"
            >
              {{ icon.label || icon.title }}
            </span>
          </NuxtLink>

          <!-- Edit mode or Utility -->
          <div v-else class="flex flex-col items-center relative">
            <!-- Utility Component -->
            <div
              v-if="icon.type === 'utility'"
              class="flex items-center justify-center text-3xl lg:text-4xl xl:text-5xl w-[2.5rem] h-[2.5rem] sm:w-[2.75rem] sm:h-[2.75rem] lg:w-[3rem] lg:h-[3rem] xl:w-[3.5rem] xl:h-[3.5rem]"
            >
              <component :is="icon.component" />
            </div>

            <!-- Standard Icon -->
            <Icon
              v-else
              :name="icon.icon || 'lucide:help-circle'"
              class="text-3xl lg:text-4xl xl:text-5xl w-[2.5rem] h-[2.5rem] sm:w-[2.75rem] sm:h-[2.75rem] lg:w-[3rem] lg:h-[3rem] xl:w-[3.5rem] xl:h-[3.5rem]"
            />

            <!-- Label -->
            <span
              v-if="icon.type !== 'utility'"
              class="mt-1 text-center text-xs sm:text-sm md:text-md lg:text-lg xl:text-xl opacity-0 group-hover:opacity-100 absolute top-full left-1/2 -translate-x-1/2 bg-base-200 px-2 py-0.5 rounded shadow-md z-10 whitespace-nowrap transition-opacity duration-200"
            >
              {{ icon.label || icon.title }}
            </span>

            <!-- Additional Info (edit mode only) -->
            <div
              v-if="icon.type !== 'utility'"
              class="mt-1 text-center text-[10px] text-base-content/70 space-y-0.5"
            >
              <div v-if="icon.description">{{ icon.description }}</div>
              <div v-if="icon.designer">by {{ icon.designer }}</div>
              <div class="capitalize">{{ icon.type }}</div>
            </div>

            <!-- Remove Button -->
            <button
              v-if="isEditing"
              class="mt-1 text-xs bg-red-500 text-white rounded-full px-2 py-0.5 leading-tight transition hover:bg-red-600"
              @click="removeIcon(index)"
              title="Remove"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Add icon -->
        <NuxtLink
          v-if="isEditing"
          to="/icongallery"
          class="flex flex-col items-center justify-center hover:scale-110 transition-transform"
        >
          <Icon
            name="kind-icon:plus"
            class="text-3xl lg:text-4xl xl:text-5xl w-[2.5rem] h-[2.5rem] sm:w-[2.75rem] sm:h-[2.75rem] lg:w-[3rem] lg:h-[3rem] xl:w-[3.5rem] xl:h-[3.5rem]"
          />
          <span class="mt-1 hidden md:block text-center text-sm">Add</span>
        </NuxtLink>

        <!-- Edit / Save Controls -->
        <div class="ml-auto w-[15%] flex justify-end">
          <transition
            enter-active-class="transition-all duration-200 ease-out"
            leave-active-class="transition-all duration-200 ease-in"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
            mode="out-in"
          >
            <div :key="isEditing ? 'edit-mode' : 'view-mode'">
              <div v-if="isEditing" class="flex flex-col items-center gap-2 w-full">
                <button
                  class="btn btn-xs btn-success w-full sm:w-auto"
                  @click="confirmEdit"
                  title="Save"
                >
                  Confirm
                </button>
                <button
                  class="btn btn-xs btn-outline w-full sm:w-auto"
                  @click="revertEdit"
                  title="Cancel"
                >
                  Revert
                </button>
              </div>
              <div v-else class="flex justify-end">
                <button
                  class="btn btn-square btn-sm"
                  @click="isEditing = true"
                  title="Edit icons"
                >
                  <Icon name="kind-icon:settings" class="text-xl" />
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Scroll Indicators -->
    <div
      v-show="showLeft"
      class="pointer-events-none absolute top-0 left-0 h-full w-6 bg-gradient-to-r from-base-300 to-transparent z-10"
    />
    <div
      v-show="showRight"
      class="pointer-events-none absolute top-0 right-0 h-full w-6 bg-gradient-to-l from-base-300 to-transparent z-10"
    />
  </div>
</template>

<script setup lang="ts">
// /components/content/story/smart-icons.vue
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useIconStore, type SmartIcon } from '@/stores/iconStore'

const iconStore = useIconStore()
const { activeIcons } = storeToRefs(iconStore)

const isEditing = ref(false)
const editableIcons = ref([...activeIcons.value])
const originalIcons = ref<SmartIcon[]>([])

watch(
  activeIcons,
  (val) => {
    if (!isEditing.value) editableIcons.value = [...val]
  },
  { immediate: true },
)

watch(isEditing, (editing) => {
  if (editing) {
    originalIcons.value = [...editableIcons.value]
  }
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

async function confirmEdit() {
  const newIds = editableIcons.value.map((i) => i.id)
  iconStore.setIconOrder(newIds)
  isEditing.value = false
}

function revertEdit() {
  editableIcons.value = [...originalIcons.value]
  isEditing.value = false
}

// Scroll awareness
const scrollContainer = ref<HTMLElement | null>(null)
const showLeft = ref(false)
const showRight = ref(false)

function checkScrollEdges() {
  const el = scrollContainer.value
  if (!el) return

  showLeft.value = el.scrollLeft > 0
  showRight.value = el.scrollWidth > el.clientWidth + el.scrollLeft + 1
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
