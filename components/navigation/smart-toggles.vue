<!-- /components/content/navigation/smart-toggles.vue -->
<template>
  <div
    class="pointer-events-none absolute z-50"
    :style="{
      right: '1%',
      top: '50%',
      transform: 'translateY(-50%)',
      maxHeight: '96%',
    }"
  >
    <!-- percent gap fixes crowding on short headers -->
    <div class="flex flex-col items-center" :style="{ gap: '1.5%' }">
      <div
        class="grid pointer-events-auto"
        :style="{ gridAutoFlow: 'column', gap: isEditing ? '1.5%' : '0' }"
      >
        <!-- Edit / Confirm -->
        <button
          class="rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
          :style="btnStyle"
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

        <!-- Cancel -->
        <button
          v-if="isEditing"
          class="rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
          :style="btnStyle"
          @click="revertEdit"
          title="Cancel changes"
          aria-label="Cancel changes"
        >
          <Icon name="kind-icon:close" class="h-[55%] w-[55%]" />
        </button>
      </div>

      <!-- Corner menu -->
      <button
        class="pointer-events-auto rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
        :class="[displayStore.showCorner ? 'ring-1 ring-primary/50' : '']"
        :style="btnStyle"
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

      <!-- Tutorial -->
      <button
        class="pointer-events-auto rounded-2xl flex items-center justify-center bg-base-200 hover:bg-base-300 border border-base-content/10 transition"
        :class="[isTutorialOpen ? 'ring-1 ring-primary/50' : '']"
        :style="btnStyle"
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

// button size as % of header height; clamped via CSS for very tall/short headers
const btnStyle = computed(() => ({
  height: '12%', // each button ≈12% of header height
  width: '12%',
  maxHeight: '4.5rem', // soft clamp for giant headers
  maxWidth: '4.5rem',
  minHeight: '1.75rem', // soft clamp for tiny headers
  minWidth: '1.75rem',
}))

const getIds = (icons: SmartIcon[]) => icons.map((i) => i.id)
const hasChanges = computed(() => {
  const a = getIds(editableIcons.value)
  const b = getIds(originalIcons.value)
  return a.length !== b.length || a.some((id, i) => id !== b[i])
})

function activateEditMode() {
  smartbarStore.isEditing = true
  displayStore.bigMode = false
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
