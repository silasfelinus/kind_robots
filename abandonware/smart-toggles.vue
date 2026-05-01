<!-- /components/content/navigation/smart-toggles.vue -->
<template>
  <div class="flex h-full items-center">
    <div class="flex select-none flex-col items-end justify-center gap-1">
      <div class="flex items-center justify-end gap-1">
        <button
          v-if="isEditing"
          type="button"
          :class="[
            'flex aspect-square items-center justify-center rounded-full border border-base-content/10 bg-base-200 transition hover:bg-base-300 disabled:cursor-not-allowed disabled:opacity-40',
            isCompactHeader ? 'h-[52%] min-h-6' : 'h-[70%] min-h-8',
          ]"
          :title="hasChanges ? 'Save order' : 'No changes to save'"
          :disabled="!hasChanges"
          @click="confirmEdit"
        >
          <Icon
            name="kind-icon:check"
            :class="[isCompactHeader ? 'h-[60%] w-[60%]' : 'h-[65%] w-[65%]']"
          />
        </button>

        <div
          v-else
          :class="[
            'pointer-events-none aspect-square rounded-full opacity-0',
            isCompactHeader ? 'h-[52%] min-h-6' : 'h-[70%] min-h-8',
          ]"
        />

        <button
          v-if="!isEditing"
          type="button"
          :class="[
            'flex aspect-square items-center justify-center rounded-full border border-base-content/10 bg-base-200 transition hover:bg-base-300',
            isCompactHeader ? 'h-[60%] min-h-6' : 'h-[86%] min-h-8',
          ]"
          :aria-pressed="isEditing"
          title="Edit Smart Icons"
          @click="activateEditMode"
        >
          <Icon
            name="kind-icon:settings"
            :class="[isCompactHeader ? 'h-[60%] w-[60%]' : 'h-[72%] w-[72%]']"
          />
        </button>

        <button
          v-else
          type="button"
          :class="[
            'flex aspect-square items-center justify-center rounded-full border border-base-content/10 bg-base-200 transition hover:bg-base-300',
            isCompactHeader ? 'h-[60%] min-h-6' : 'h-[86%] min-h-8',
          ]"
          title="Cancel changes"
          @click="revertEdit"
        >
          <Icon
            name="kind-icon:close"
            :class="[isCompactHeader ? 'h-[60%] w-[60%]' : 'h-[72%] w-[72%]']"
          />
        </button>
      </div>

      <div class="flex items-center justify-end">
        <button
          type="button"
          :class="[
            'flex aspect-square items-center justify-center rounded-full border border-base-content/10 bg-base-200 transition hover:bg-base-300',
            isCompactHeader ? 'h-[60%] min-h-6' : 'h-[86%] min-h-8',
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
            :class="[isCompactHeader ? 'h-[60%] w-[60%]' : 'h-[74%] w-[74%]']"
          />
        </button>
      </div>

      <div class="flex items-center justify-end">
        <button
          type="button"
          :class="[
            'flex aspect-square items-center justify-center rounded-full border border-base-content/10 bg-base-200 transition hover:bg-base-300',
            isCompactHeader ? 'h-[60%] min-h-6' : 'h-[86%] min-h-8',
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
            :class="[isCompactHeader ? 'h-[60%] w-[60%]' : 'h-[74%] w-[74%]']"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/navigation/smart-toggles.vue
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSmartbarStore, type SmartIcon } from '@/stores/smartbarStore'
import { useDisplayStore } from '@/stores/displayStore'

const smartbarStore = useSmartbarStore()
const displayStore = useDisplayStore()
const { isEditing, editableIcons } = storeToRefs(smartbarStore)

const isCompactHeader = computed(() => displayStore.headerState === 'compact')

const originalIcons = ref<SmartIcon[]>([])

watch(isEditing, (editing) => {
  if (editing) originalIcons.value = [...editableIcons.value]
})

const getIds = (icons: SmartIcon[]) => icons.map((i) => i.id)

const hasChanges = computed(() => {
  const a = getIds(editableIcons.value)
  const b = getIds(originalIcons.value)
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
