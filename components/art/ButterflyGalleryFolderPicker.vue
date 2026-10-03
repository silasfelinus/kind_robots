<template>
  <form class="folder-picker" @submit.prevent="submit">
    <Icon name="kind-icon:folder" class="kr-icon-3 shrink-0 opacity-70" />
    <input
      v-model="draft"
      type="text"
      class="kr-input-sm folder-picker-input"
      :list="listId"
      :placeholder="placeholder || 'Move to folder…'"
      :disabled="disabled"
      :aria-label="placeholder || 'Move to folder'"
      spellcheck="false"
    />
    <datalist :id="listId">
      <option
        v-for="folder in folderOptions"
        :key="folder.value"
        :value="folder.value"
      >
        {{ folder.count }}
      </option>
    </datalist>
    <button
      type="submit"
      class="kr-btn btn-primary btn-xs"
      :disabled="disabled || !canSubmit"
    >
      {{ actionLabel || 'Move' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useButterflyGalleryStore } from '@/stores/butterflyGalleryStore'

const props = defineProps<{
  current?: string | null
  disabled?: boolean
  placeholder?: string
  actionLabel?: string
}>()

const emit = defineEmits<{ move: [folder: string] }>()

const gallery = useButterflyGalleryStore()
const draft = ref('')
const listId = `butterfly-folders-${useId()}`

const folderOptions = computed(() =>
  gallery.folderSummaries.filter((folder) => folder.value),
)

const normalizedDraft = computed(() =>
  draft.value
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/'),
)

const canSubmit = computed(
  () =>
    normalizedDraft.value.length > 0 &&
    normalizedDraft.value !== (props.current ?? ''),
)

function submit(): void {
  if (!canSubmit.value) return
  emit('move', normalizedDraft.value)
  draft.value = ''
}
</script>

<style scoped>
.folder-picker {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
}

.folder-picker-input {
  min-width: 0;
  flex: 1;
}
</style>
