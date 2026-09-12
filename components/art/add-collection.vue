<!-- /components/content/art/add-collection.vue -->
<template>
  <section
    class="kr-panel-flat p-3"
    :class="compact ? 'space-y-2' : 'space-y-3'"
  >
    <button
      v-if="!isOpen"
      class="btn btn-outline btn-sm w-full justify-between rounded-2xl"
      type="button"
      :disabled="disabled"
      @click="openForm"
    >
      <span class="flex items-center gap-2">
        <Icon name="kind-icon:plus" class="kr-icon-4" />
        New collection
      </span>

      <Icon name="kind-icon:folder" class="kr-icon-4" />
    </button>

    <form v-else class="grid gap-3" @submit.prevent="createCollection">
      <label class="form-control">
        <span class="kr-label-row">
          <span class="kr-label-bold">New Collection</span>

          <button
            class="kr-btn-ghost-xs"
            type="button"
            :disabled="isSaving"
            @click="closeForm"
          >
            Cancel
          </button>
        </span>

        <input
          v-model="label"
          class="kr-input-rounded-2xl bg-base-200"
          type="text"
          placeholder="Monster Drag Party favorites"
          :disabled="isSaving || disabled"
        />
      </label>

      <div v-if="showFlags" class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label class="kr-toggle-row">
          <span class="kr-label-bold">Public</span>

          <input
            v-model="isPublic"
            type="checkbox"
            class="kr-toggle-success"
            :disabled="isSaving || disabled"
          />
        </label>

        <label class="kr-toggle-row">
          <span class="kr-label-bold">Mature</span>

          <input
            v-model="isMature"
            type="checkbox"
            class="kr-toggle-warning"
            :disabled="isSaving || disabled"
          />
        </label>
      </div>

      <div
        v-if="message"
        class="kr-note p-3"
        :class="messageTone === 'error' ? 'kr-note-error' : 'kr-note-success'"
      >
        {{ message }}
      </div>

      <button
        class="btn btn-primary rounded-2xl text-white"
        type="submit"
        :disabled="isSaving || disabled || !label.trim()"
      >
        <span v-if="isSaving" class="kr-spinner-sm" />
        <Icon v-else name="kind-icon:plus" class="kr-icon-5" />
        Create Collection
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useCollectionStore } from '@/stores/collectionStore'

const props = withDefaults(
  defineProps<{
    compact?: boolean
    disabled?: boolean
    autoSelect?: boolean
    closeOnCreate?: boolean
    showFlags?: boolean
  }>(),
  {
    compact: false,
    disabled: false,
    autoSelect: true,
    closeOnCreate: true,
    showFlags: false,
  },
)

const emit = defineEmits<{
  created: [collection: ArtCollection]
  selected: [collection: ArtCollection]
}>()

const collectionStore = useCollectionStore()

const isOpen = ref(false)
const isSaving = ref(false)
const label = ref('')
const isPublic = ref(true)
const isMature = ref(false)
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')

function openForm() {
  isOpen.value = true
  message.value = ''
}

function closeForm() {
  if (isSaving.value) return

  isOpen.value = false
  message.value = ''
  resetForm()
}

function resetForm() {
  label.value = ''
  isPublic.value = true
  isMature.value = false
}

function setMessage(tone: 'success' | 'error', value: string) {
  messageTone.value = tone
  message.value = value
}

async function createCollection() {
  const cleanLabel = label.value.trim()

  if (!cleanLabel) {
    setMessage(
      'error',
      'Collection needs a name. Folders are powerful, but not psychic.',
    )
    return
  }

  isSaving.value = true
  message.value = ''

  try {
    const collection = await collectionStore.createCollection(
      cleanLabel,
      isPublic.value,
      isMature.value,
    )

    if (props.autoSelect) {
      selectCollection(collection)
    }

    emit('created', collection)

    setMessage('success', 'Collection created.')
    resetForm()

    if (props.closeOnCreate) {
      isOpen.value = false
    }
  } catch (error) {
    setMessage(
      'error',
      error instanceof Error ? error.message : 'Failed to create collection.',
    )
  } finally {
    isSaving.value = false
  }
}

function selectCollection(collection: ArtCollection) {
  collectionStore.setCurrentCollection(collection.id)
  collectionStore.setSelectedCollectionIds([collection.id])
  emit('selected', collection)
}
</script>
