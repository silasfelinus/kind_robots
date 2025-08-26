<template>
  <div class="h-full w-full grid grid-rows-3">
    <!-- Row 1 -->
    <div class="relative h-full w-full flex items-center justify-center">
      <!-- centered main: edit or cancel -->
      <button
        v-if="!isEditing"
        class="rounded-full aspect-square h-[68%] max-h-[4.5rem] min-h-[1.6rem] flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
        :aria-pressed="isEditing"
        title="Edit Smart Icons"
        @click="activateEditMode"
      >
        <Icon name="kind-icon:settings" class="h-[55%] w-[55%]" />
      </button>

      <button
        v-else
        class="rounded-full aspect-square h-[68%] max-h-[4.5rem] min-h-[1.6rem] flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
        title="Cancel changes"
        @click="revertEdit"
      >
        <Icon name="kind-icon:close" class="h-[55%] w-[55%]" />
      </button>

      <!-- floating confirm, tighter to right -->
      <button
        v-if="isEditing"
        class="absolute top-1/2 -translate-y-1/2 right-[2%] rounded-full aspect-square h-[68%] max-h-[4.5rem] min-h-[1.6rem] flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
        :title="hasChanges ? 'Save order' : 'No changes to save'"
        :disabled="!hasChanges"
        @click="confirmEdit"
      >
        <Icon name="kind-icon:check" class="h-[55%] w-[55%]" />
      </button>
    </div>

    <!-- Row 2 -->
    <div class="h-full w-full flex items-center justify-center">
      <button
        class="rounded-full aspect-square h-[68%] max-h-[4.5rem] min-h-[1.6rem] flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
        :class="[displayStore.showCorner ? 'ring-1 ring-primary/50' : '']"
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
    </div>

    <!-- Row 3 -->
    <div class="h-full w-full flex items-center justify-center">
      <button
        class="rounded-full aspect-square h-[68%] max-h-[4.5rem] min-h-[1.6rem] flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
        :class="[isTutorialOpen ? 'ring-1 ring-primary/50' : '']"
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSmartbarStore, type SmartIcon } from '@/stores/smartbarStore'
import { useDisplayStore } from '@/stores/displayStore'

const smartbarStore = useSmartbarStore()
const displayStore = useDisplayStore()
const { isEditing, editableIcons } = storeToRefs(smartbarStore)

const originalIcons = ref<SmartIcon[]>([])
watch(isEditing, (editing) => {
  if (editing) originalIcons.value = [...editableIcons.value]
})

const getIds = (icons: SmartIcon[]) => icons.map((i) => i.id)
const hasChanges = computed(() => {
  const a = getIds(editableIcons.value),
    b = getIds(originalIcons.value)
  return a.length !== b.length || a.some((id, i) => id !== b[i])
})

function activateEditMode() {
  smartbarStore.isEditing = true
}
function confirmEdit() {
  smartbarStore.setIconOrder(getIds(editableIcons.value))
  smartbarStore.isEditing = false
}
function revertEdit() {
  editableIcons.value = [...originalIcons.value]
  smartbarStore.isEditing = false
}

const isTutorialOpen = computed({
  get: () => displayStore.sidebarRightState === 'open',
  set: (val: boolean) => displayStore.setSidebarRight(val),
})
function toggleTutorial() {
  isTutorialOpen.value = !isTutorialOpen.value
}
</script>
