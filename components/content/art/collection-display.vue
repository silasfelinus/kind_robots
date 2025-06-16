<template>
  <div class="w-full max-w-full space-y-6 overflow-x-hidden">
    <!-- Checkpoint Selector -->
    <div class="flex flex-col gap-2">
      <label class="label-text font-semibold">📌 Checkpoint</label>
      <select v-model="selectedId" class="select select-bordered w-full">
        <option value="">🚫 None (do not auto-save)</option>
        <option
          v-for="c in checkpointStore.visibleCheckpoints"
          :key="c.name"
          :value="c.name"
        >
          {{ c.customLabel || c.name }}
        </option>
        <option value="__new__">➕ Create new checkpoint...</option>
      </select>

      <!-- New Checkpoint Placeholder -->
      <div v-if="selectedId === '__new__'" class="text-sm text-warning">
        ⚠️ Checkpoint creation not yet implemented.
      </div>

      <!-- Editable Name + Author -->
      <div v-if="selectedCheckpoint" class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div v-if="canEdit">
          <input
            v-model="editableLabel"
            class="input input-sm input-bordered w-full sm:w-64"
            placeholder="Checkpoint Label"
            @change="updateCheckpointLabel"
          />
        </div>
        <div v-else class="text-sm opacity-60">
          Created by <strong>{{ selectedCheckpoint.creator?.username || 'Unknown' }}</strong>
        </div>
      </div>
    </div>

    <!-- Gallery -->
    <div
      v-if="selectedCheckpoint?.name"
      class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
    >
      <div
        v-for="art in selectedCheckpointArt"
        :key="art.id"
        class="border rounded-xl p-4 space-y-2 bg-base-100"
      >
        <ArtCard :art="art" />

        <div class="flex justify-between items-center">
          <!-- Visibility Toggles -->
          <div class="flex gap-4 items-center">
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                class="checkbox checkbox-xs"
                :checked="art.isPublic"
                @change="toggleFlag(art, 'isPublic')"
                :disabled="!isOwner(art)"
              />
              Public
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                class="checkbox checkbox-xs"
                :checked="art.isMature"
                @change="toggleFlag(art, 'isMature')"
                :disabled="!isOwner(art)"
              />
              Mature
            </label>
          </div>

          <!-- Remove Button -->
          <button
            class="btn btn-xs btn-outline btn-error"
            @click="removeArt(art.id)"
            :disabled="!isOwner(art)"
          >
            ❌ Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/utils/api'
import ArtCard from './art-card.vue'

const checkpointStore = useCheckpointStore()
const artStore = useArtStore()
const userStore = useUserStore()

const selectedId = ref<string>('') // checkpoint name, '', or '__new__'
const editableLabel = ref('')

const selectedCheckpoint = computed(() =>
  checkpointStore.findCheckpointByName(selectedId.value),
)

const selectedCheckpointArt = computed(() => {
  const path = selectedCheckpoint.value?.localPath
  const userId = userStore.user?.id ?? 10
  return artStore.art.filter((a) =>
    a.checkpoint === path && (a.isPublic || a.userId === userId)
  )
})

const canEdit = computed(() =>
  selectedCheckpoint.value?.userId === userStore.userId,
)

function isOwner(art: Art) {
  return art.userId === userStore.userId
}

async function updateCheckpointLabel() {
  const checkpoint = selectedCheckpoint.value
  const label = editableLabel.value.trim()
  if (!checkpoint?.name || !label) return

  await checkpointStore.updateCheckpointLabel(checkpoint.name, label)
  checkpointStore.refreshVisibleCheckpoints()
}

async function toggleFlag(art: Art, field: 'isPublic' | 'isMature') {
  if (!isOwner(art)) return
  const updated = { ...art, [field]: !art[field] }

  const response = await performFetch(`/api/art/${art.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ [field]: updated[field] }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.success) {
    artStore.updateArtLocal(art.id, { [field]: updated[field] })
  }
}

async function removeArt(id: number) {
  const checkpoint = selectedCheckpoint.value
  if (!checkpoint?.id) return

  const response = await performFetch(`/api/art/collection/${checkpoint.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ removeIds: [id] }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.success) {
    artStore.removeArtFromCheckpoint(checkpoint.localPath!, id)
  }
}

onMounted(async () => {
  if (!checkpointStore.visibleCheckpoints.length) {
    await checkpointStore.fetchCheckpoints()
  }

  const defaultName = checkpointStore.selectedCheckpoint?.name
  if (defaultName) {
    selectedId.value = defaultName
    editableLabel.value = checkpointStore.selectedCheckpoint?.customLabel || ''
  }
})

watch(selectedId, (val) => {
  const found = checkpointStore.findCheckpointByName(val)
  checkpointStore.selectedCheckpoint = found || null
  editableLabel.value = found?.customLabel || ''
})
</script>
