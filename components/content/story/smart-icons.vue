<template>
  <div class="w-full overflow-x-auto">
    <div class="flex items-center gap-2 min-w-fit px-2">
      <!-- Filler if no icons -->
      <div
        v-if="!editableIcons.length"
        class="flex flex-col items-center justify-center"
      >
        <Icon name="kind-icon:portal" class="text-4xl opacity-50" />
        <span class="text-xs mt-1 hidden md:block text-center text-base-content/70">
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
        <!-- Non-edit mode: Link-based nav icons -->
        <NuxtLink
          v-if="!isEditing && icon.link && icon.type !== 'utility'"
          :to="icon.link"
          class="flex flex-col items-center"
        >
          <Icon
            :name="icon.icon || 'lucide:help-circle'"
            class="text-3xl lg:text-4xl xl:text-5xl hover:scale-110 transition-transform"
          />
          <span class="text-xs mt-1 hidden md:block text-center">
            {{ icon.label || icon.title }}
          </span>
        </NuxtLink>

        <!-- Edit mode or utility: Display component or editable icon -->
        <div v-else class="flex flex-col items-center relative">
          <!-- Use dynamic component if utility -->
          <component
            v-if="icon.type === 'utility'"
            :is="icon.component"
            class="w-full"
          />
          <!-- Otherwise, show the icon -->
          <Icon
            v-else
            :name="icon.icon || 'lucide:help-circle'"
            class="text-3xl lg:text-4xl xl:text-5xl"
          />

          <!-- Label -->
          <span 
v-if="icon.type !== 'utility'"
class="text-xs mt-1 hidden md:block text-center">
            {{ icon.label || icon.title }}
          </span>

          <!-- Remove button: stable layout, edit mode only -->
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

      <!-- Add icon (edit mode only) -->
      <NuxtLink
        v-if="isEditing"
        to="/icongallery"
        class="flex flex-col items-center justify-center hover:scale-110 transition-transform"
      >
        <Icon name="kind-icon:plus" class="text-3xl lg:text-4xl xl:text-5xl" />
        <span class="text-xs mt-1 hidden md:block text-center">Add</span>
      </NuxtLink>

<!-- Edit/Save Controls -->
<div class="ml-auto w-[15%] flex justify-end">
  <transition name="fade-slide" mode="out-in">
    <div :key="isEditing ? 'edit-mode' : 'view-mode'">
      <!-- Edit Mode: Stack Confirm + Revert -->
      <div class="flex flex-col items-center gap-2 w-full" v-if="isEditing">
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

      <!-- View Mode: Gear Icon -->
      <div v-else class="flex justify-end">
        <button
          class="btn btn-square btn-sm"
          @click="isEditing = true"
          title="Edit icons"
        >
          <Icon name="kind-icon:gear" class="text-xl" />
        </button>
      </div>
    </div>
  </transition>
</div>


    </div>

    <!-- Optional scrollbar bar at bottom -->
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
  { immediate: true }
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
}

function revertEdit() {
  editableIcons.value = [...activeIcons.value]
  isEditing.value = false
}

function handleEditToggle() {
  if (!isEditing.value) {
    confirmEdit()
  }
}
</script>

<style scoped>
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
