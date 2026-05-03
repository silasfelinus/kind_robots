<!-- /components/content/random/random-gallery.vue -->
<template>
  <div class="space-y-4">
    <form @submit.prevent="createNewList" class="flex gap-2">
      <input
        v-model="newTitle"
        class="input input-bordered w-full"
        placeholder="New List Title"
      />
      <button class="btn btn-primary">➕ Add List</button>
    </form>

    <div v-if="lists.length">
      <div
        v-for="list in lists"
        :key="list.id"
        class="p-4 rounded-2xl border border-base-300 shadow bg-base-100 space-y-2"
      >
        <div class="flex justify-between items-center gap-3">
          <h3 class="font-bold text-lg truncate">
            {{ list.title || 'Untitled' }}
          </h3>

          <div class="flex gap-2 shrink-0">
            <button
              v-if="canEdit(list)"
              class="btn btn-sm btn-outline"
              @click="editList(list)"
              type="button"
            >
              ✏️
            </button>
            <button
              v-if="canEdit(list)"
              class="btn btn-sm btn-error"
              @click="confirmDelete(list)"
              type="button"
            >
              🗑️
            </button>
          </div>
        </div>

        <div class="text-sm text-base-content/80 whitespace-pre-line">
          <template v-if="previewLines(list).length">
            <ul class="list-disc list-inside">
              <li v-for="(line, i) in previewLines(list)" :key="i">
                {{ line }}
              </li>
            </ul>
          </template>
          <template v-else>
            <div class="opacity-70">No items yet.</div>
          </template>
        </div>

        <div class="flex items-center justify-between text-xs opacity-70">
          <div>
            <span v-if="list.source === 'preset'">Preset</span>
            <span v-else>Yours</span>
          </div>
          <div class="flex gap-2">
            <span v-if="list.isPublic">Public</span>
            <span v-else>Private</span>
            <span v-if="list.isMature">Mature</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-base-content">No lists found.</div>

    <dialog ref="editorRef" class="modal modal-open" v-if="editingList">
      <form method="dialog" class="modal-box space-y-4" @submit.prevent>
        <h3 class="font-bold text-lg">Edit List</h3>

        <input
          v-model="editingList.title"
          class="input input-bordered w-full"
          placeholder="List Title"
        />

        <textarea
          v-model="editingRaw"
          class="textarea textarea-bordered w-full h-40"
          placeholder="One item per line"
        />

        <div class="flex justify-between items-center">
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="editingList.isPublic"
              class="checkbox"
            />
            <span class="label-text">Public</span>
          </label>

          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="editingList.isMature"
              class="checkbox"
            />
            <span class="label-text">Mature</span>
          </label>
        </div>

        <div class="modal-action">
          <button class="btn" type="button" @click="saveEdit">💾 Save</button>
          <button class="btn btn-ghost" type="button" @click="cancelEdit">
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
// /components/content/random/random-gallery.vue
import { computed, onMounted, ref } from 'vue'
import { useRandomStore } from '@/stores/randomStore'
import { useUserStore } from '@/stores/userStore'
import type { RandomListItem } from '@/stores/helpers/randomHelper'

const randomStore = useRandomStore()
const userStore = useUserStore()

const newTitle = ref('')
const editingList = ref<RandomListItem | null>(null)
const editorRef = ref<HTMLDialogElement | null>(null)
const editingRaw = ref('')

const lists = computed<RandomListItem[]>(() =>
  Array.isArray(randomStore.filteredLists) ? randomStore.filteredLists : [],
)

onMounted(async () => {
  await randomStore.fetchRandomLists()
})

function canEdit(list: RandomListItem): boolean {
  return list.source === 'user' && (list.userId ?? -1) === userStore.userId
}

function parseLinesToJson(linesRaw: string): string {
  const lines = linesRaw
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  return JSON.stringify(lines)
}

function safeParseExamplesJson(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v): v is string => typeof v === 'string' && v.trim().length > 0,
    )
  } catch {
    return []
  }
}

function previewLines(list: RandomListItem): string[] {
  const items = safeParseExamplesJson(list.examplesJson || '[]')
  return items.slice(0, 6)
}

async function createNewList() {
  if (!newTitle.value.trim()) return
  await randomStore.createList(newTitle.value.trim())
  await randomStore.fetchRandomLists()
  newTitle.value = ''
}

function editList(list: RandomListItem) {
  if (!canEdit(list)) return
  editingList.value = { ...list }
  const items = safeParseExamplesJson(list.examplesJson || '[]')
  editingRaw.value = items.join('\n')
}

function cancelEdit() {
  editingList.value = null
  editingRaw.value = ''
}

async function saveEdit() {
  if (!editingList.value) return
  if (!canEdit(editingList.value)) {
    cancelEdit()
    return
  }

  editingList.value.examplesJson = parseLinesToJson(editingRaw.value)
  await randomStore.updateListItem(editingList.value)
  await randomStore.fetchRandomLists()
  cancelEdit()
}

function confirmDelete(list: RandomListItem) {
  if (!canEdit(list)) return
  if (confirm('Delete this list?')) {
    randomStore.deleteList(list.id)
  }
}
</script>
