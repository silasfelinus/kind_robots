<template>
  <div class="w-full overflow-x-auto">
    <div class="flex items-center gap-2 min-w-fit px-2">
      <!-- Filler if no icons -->
      <div
        v-if="!editableIcons.length"
        class="flex flex-col items-center justify-center"
      >
        <Icon name="kind-icon:portal" class="icon-size opacity-50" />
        <span
          class="label-size mt-1 hidden md:block text-center text-base-content/70"
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
            class="icon-size hover:scale-110 transition-transform"
          />
          <span class="label-size mt-1 hidden md:block text-center">
            {{ icon.label || icon.title }}
          </span>
        </NuxtLink>

        <!-- Edit mode or Utility -->
        <div v-else class="flex flex-col items-center relative">
          <!-- Utility Component -->
          <div
            v-if="icon.type === 'utility'"
            class="icon-size flex items-center justify-center"
          >
            <component :is="icon.component" />
          </div>

          <!-- Standard Icon -->
          <Icon
            v-else
            :name="icon.icon || 'lucide:help-circle'"
            class="icon-size"
          />

          <!-- Label -->
          <span
            v-if="icon.type !== 'utility'"
            class="label-size mt-1 hidden md:block text-center"
          >
            {{ icon.label || icon.title }}
          </span>

          <!-- Additional Info (only in edit mode) -->
          <div
            v-if="icon.type !== 'utility'"
            class="mt-1 text-center text-[10px] text-base-content/70 space-y-0.5"
          >
            <div v-if="icon.description">{{ icon.description }}</div>
            <div v-if="icon.designer">by {{ icon.designer }}</div>
            <div class="capitalize">{{ icon.type }}</div>
          </div>

          <!-- Remove Button (edit mode only) -->
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
        <Icon name="kind-icon:plus" class="icon-size" />
        <span class="label-size mt-1 hidden md:block text-center">Add</span>
      </NuxtLink>

      <!-- Edit / Save Controls -->
      <div class="ml-auto w-[15%] flex justify-end">
        <transition name="fade-slide" mode="out-in">
          <div :key="isEditing ? 'edit-mode' : 'view-mode'">
            <div
              class="flex flex-col items-center gap-2 w-full"
              v-if="isEditing"
            >
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

    <!-- Scrollbar bottom indicator -->
    <div class="h-1 bg-primary rounded mt-1" />
  </div>
</template>

<script setup lang="ts">
// /components/content/story/smart-icons.vue
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useIconStore } from '@/stores/iconStore'

const iconStore = useIconStore()
const { activeIcons } = storeToRefs(iconStore)

const isEditing = ref(false)
const editableIcons = ref([...activeIcons.value])

watch(
  activeIcons,
  (val) => {
    if (!isEditing.value) editableIcons.value = [...val]
  },
  { immediate: true },
)

let dragIndex = -1
function onDragStart(index: number) {
  dragIndex = index
}
function onDrop(index: number) {
  const dragged = editableIcons.value.splice(dragIndex, 1)[0]
  editableIcons.value.splice(index, 0, dragged)
}

function removeIcon(index: number) {
  editableIcons.value.splice(index, 1)
}

async function confirmEdit() {
  const ids = editableIcons.value.map((i) => i.id)
  await iconStore.updateSmartBar(ids)
  isEditing.value = false
  await iconStore.fetchIcons()
  editableIcons.value = [...iconStore.activeIcons]
}

function revertEdit() {
  editableIcons.value = [...activeIcons.value]
  isEditing.value = false
}
</script>

<style scoped>
.icon-size {
  @apply text-3xl lg:text-4xl xl:text-5xl w-[2.5rem] h-[2.5rem] sm:w-[2.75rem] sm:h-[2.75rem] lg:w-[3rem] lg:h-[3rem] xl:w-[3.5rem] xl:h-[3.5rem];
}
.label-size {
  @apply text-sm sm:text-sm md:text-md lg:text-lg xl:text-xl;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
