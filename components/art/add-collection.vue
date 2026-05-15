<!-- /components/content/art/add-collection.vue -->
<template>
  <section
    class="rounded-2xl border border-base-300 bg-base-100 p-3"
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
        <Icon name="kind-icon:plus" class="h-4 w-4" />
        New collection
      </span>

      <Icon name="kind-icon:folder" class="h-4 w-4" />
    </button>

    <form v-else class="grid gap-3" @submit.prevent="createCollection">
      <label class="form-control">
        <span class="label py-1">
          <span class="label-text font-bold">New Collection</span>

          <button
            class="btn btn-ghost btn-xs rounded-xl"
            type="button"
            :disabled="isSaving"
            @click="closeForm"
          >
            Cancel
          </button>
        </span>

        <input
          v-model="label"
          class="input input-bordered rounded-2xl bg-base-200"
          type="text"
          placeholder="Monster Drag Party favorites"
          :disabled="isSaving || disabled"
        />
      </label>

      <div v-if="showFlags" class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label
          class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
        >
          <span class="label-text font-bold">Public</span>

          <input
            v-model="isPublic"
            type="checkbox"
            class="toggle toggle-success"
            :disabled="isSaving || disabled"
          />
        </label>

        <label
          class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
        >
          <span class="label-text font-bold">Mature</span>

          <input
            v-model="isMature"
            type="checkbox"
            class="toggle toggle-warning"
            :disabled="isSaving || disabled"
          />
        </label>
      </div>

      <div
        v-if="message"
        class="rounded-2xl border p-3 text-sm font-semibold"
        :class="
          messageTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        {{ message }}
      </div>

      <button
        class="btn btn-primary rounded-2xl text-white"
        type="submit"
        :disabled="isSaving || disabled || !label.trim() || !resolvedUserId"
      >
        <span v-if="isSaving" class="loading loading-spinner loading-sm" />
        <Icon v-else name="kind-icon:plus" class="h-5 w-5" />
        Create Collection
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'

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
const userStore = useUserStore()

const isOpen = ref(false)
const isSaving = ref(false)
const label = ref('')
const isPublic = ref(true)
const isMature = ref(false)
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')

const resolvedUserId = computed(() => {
  return userStore.userId || userStore.user?.id || 0
})

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
  const userId = resolvedUserId.value

  if (!cleanLabel) {
    setMessage(
      'error',
      'Collection needs a name. Folders are powerful, but not psychic.',
    )
    return
  }

  if (!userId) {
    setMessage('error', 'You need a user before creating a collection.')
    return
  }

  isSaving.value = true
  message.value = ''

  try {
    const collection = await collectionStore.createCollection(
      cleanLabel,
      userId,
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
