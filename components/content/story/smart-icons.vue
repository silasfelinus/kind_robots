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
        <NuxtLink
          v-if="!isEditing && icon.link"
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

        <!-- Edit Mode View -->
        <div v-else class="relative flex flex-col items-center">
          <Icon
            :name="icon.icon || 'lucide:help-circle'"
            class="text-3xl lg:text-4xl xl:text-5xl"
          />
          <span class="text-xs mt-1 hidden md:block text-center">
            {{ icon.label || icon.title }}
          </span>
          <button
            class="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white text-xs"
            @click="removeIcon(index)"
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Add icon: only visible in edit mode -->
      <NuxtLink
        v-if="isEditing"
        to="/icongallery"
        class="flex flex-col items-center justify-center hover:scale-110 transition-transform"
      >
        <Icon name="kind-icon:plus" class="text-3xl lg:text-4xl xl:text-5xl" />
        <span class="text-xs mt-1 hidden md:block text-center">Add</span>
      </NuxtLink>

      <!-- Edit Toggle / Save -->
      <div class="ml-4">
        <label class="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            v-model="isEditing"
            @change="handleEditToggle"
          />
          <span class="text-xs md:text-sm">Edit</span>
        </label>
      </div>
    </div>

    <!-- Optional scrollbar bar at bottom -->
    <div class="h-1 bg-primary rounded mt-1" />
  </div>
</template>


<script setup lang="ts">
// /components/content/story/smart-icons.vue
import { ref, computed, watch } from 'vue'
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

async function handleEditToggle() {
  if (!isEditing.value) {
    const ids = editableIcons.value.map((i) => i.id)
    await iconStore.updateSmartBar(ids)
  }
}
</script>
