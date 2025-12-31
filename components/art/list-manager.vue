<!-- /components/content/art/list-manager.vue -->
<template>
  <div class="space-y-6 w-full max-w-full overflow-x-hidden">
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
    >
      <h2 class="text-xl font-bold shrink-0">📋 Your Preset Lists</h2>

      <form @submit.prevent="handleCreate" class="flex gap-2 w-full md:w-auto">
        <input
          v-model="newTitle"
          class="input input-sm input-bordered flex-1 min-w-[150px] max-w-full"
          placeholder="New list title"
          @input="isTyping = true"
        />
        <button
          v-if="isTyping && newTitle.trim().length"
          class="btn btn-sm btn-primary"
          type="submit"
          :disabled="isCreating"
        >
          ➕ Create
        </button>
      </form>
    </div>

    <div class="space-y-4 w-full max-w-full">
      <div
        v-for="list in localLists"
        :key="list.key"
        class="bg-base-100 rounded-2xl border border-base-300 shadow p-4 space-y-4"
      >
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
        >
          <div class="flex gap-2 items-center flex-1 w-full min-w-0 max-w-full">
            <input
              v-model="list.title"
              class="input input-sm input-bordered flex-1 min-w-[120px] max-w-full truncate"
              :disabled="list.source !== 'user'"
              @change="save(list)"
            />

            <button
              class="btn btn-xs btn-info"
              type="button"
              :disabled="list.source !== 'user' || list.isBusy"
              @click="generateMore(list)"
            >
              ⚙️ Generate
            </button>

            <button
              class="btn btn-xs btn-accent"
              type="button"
              :disabled="list.source !== 'user' || list.isBusy"
              @click="save(list)"
              title="Save"
            >
              💾
            </button>

            <button
              class="btn btn-xs btn-error"
              type="button"
              :disabled="list.source !== 'user' || list.isBusy"
              @click="confirmDelete(list)"
              title="Delete"
            >
              🗑️
            </button>
          </div>

          <div class="flex items-center gap-2 text-xs opacity-70 shrink-0">
            <span v-if="list.source === 'preset'" class="badge badge-outline"
              >preset</span
            >
            <span v-else class="badge badge-outline">yours</span>
            <span class="badge badge-ghost">{{ list.entries.length }}</span>
          </div>
        </div>

        <form @submit.prevent="handleEntry(list)" class="flex gap-2 w-full">
          <input
            v-model="list.newEntry"
            class="input input-sm input-bordered flex-1"
            placeholder="Add new item"
            :disabled="list.source !== 'user' || list.isBusy"
          />
          <button
            class="btn btn-sm btn-secondary"
            type="submit"
            :disabled="
              list.source !== 'user' || list.isBusy || !list.newEntry.trim()
            "
          >
            ➕ Add
          </button>
        </form>

        <ul
          class="list-disc list-inside text-sm pl-2 text-base-content/80 space-y-1"
        >
          <li
            v-for="(entry, i) in list.entries"
            :key="`${list.key}-entry-${i}`"
            class="flex justify-between items-center gap-2"
          >
            <span class="break-words">{{ entry }}</span>
            <button
              class="btn btn-xs btn-outline"
              type="button"
              :disabled="list.source !== 'user' || list.isBusy"
              @click="removeEntry(list, i)"
              title="Remove entry"
            >
              ❌
            </button>
          </li>
        </ul>

        <div v-if="list.errorMessage" class="text-sm text-error">
          {{ list.errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/art/list-manager.vue
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRandomStore } from '@/stores/randomStore'
import type { RandomListItem } from '@/stores/helpers/randomHelper'

type EditableList = RandomListItem & {
  key: string
  newEntry: string
  entries: string[]
  isBusy: boolean
  errorMessage: string
}

const randomStore = useRandomStore()
const { filteredLists } = storeToRefs(randomStore)

const newTitle = ref('')
const isTyping = ref(false)
const isCreating = ref(false)

const localLists = ref<EditableList[]>([])

function safeParseExamplesJson(value: unknown): string[] {
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
  } catch {
    return []
  }
}

function toKey(list: RandomListItem): string {
  const prefix = list.source === 'preset' ? 'preset' : 'user'
  return `${prefix}:${list.id}:${list.title}`
}

function hydrate(val: RandomListItem[]): EditableList[] {
  return (Array.isArray(val) ? val : []).map((list: RandomListItem) => {
    const entries = safeParseExamplesJson(list.examplesJson)
    return {
      ...list,
      key: toKey(list),
      newEntry: '',
      entries,
      isBusy: false,
      errorMessage: '',
    }
  })
}

watch(
  filteredLists,
  (val: RandomListItem[]) => {
    const next = hydrate(val)

    const prevById = new Map<string, EditableList>()
    for (const prev of localLists.value) {
      prevById.set(`${prev.source}:${prev.id}`, prev)
    }

    localLists.value = next.map((n) => {
      const prev = prevById.get(`${n.source}:${n.id}`)
      if (!prev) return n
      return {
        ...n,
        newEntry: prev.newEntry,
        isBusy: prev.isBusy,
        errorMessage: prev.errorMessage,
      }
    })
  },
  { immediate: true },
)

async function handleCreate() {
  const title = newTitle.value.trim()
  if (!title) return
  if (isCreating.value) return

  isCreating.value = true
  try {
    await randomStore.createList(title)
    await randomStore.fetchRandomLists()
    newTitle.value = ''
    isTyping.value = false
  } finally {
    isCreating.value = false
  }
}

function serializeEntries(entries: string[]): string {
  const cleaned = Array.isArray(entries)
    ? entries
        .filter((v) => typeof v === 'string')
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
    : []
  return JSON.stringify(cleaned)
}

async function save(list: EditableList) {
  list.errorMessage = ''
  if (list.source !== 'user') return
  if (list.isBusy) return

  list.isBusy = true
  try {
    list.examplesJson = serializeEntries(list.entries)
    await randomStore.updateListItem(list)
    await randomStore.fetchRandomLists()
  } catch (e: unknown) {
    list.errorMessage = e instanceof Error ? e.message : 'Failed to save.'
  } finally {
    list.isBusy = false
  }
}

function confirmDelete(list: EditableList) {
  if (list.source !== 'user') return
  if (list.isBusy) return

  const ok = confirm('Delete this list?')
  if (!ok) return

  list.isBusy = true
  list.errorMessage = ''
  randomStore
    .deleteList(list.id)
    .then(() => randomStore.fetchRandomLists())
    .catch((e: unknown) => {
      list.errorMessage = e instanceof Error ? e.message : 'Failed to delete.'
    })
    .finally(() => {
      list.isBusy = false
    })
}

function handleEntry(list: EditableList) {
  if (list.source !== 'user') return
  if (list.isBusy) return

  const text = list.newEntry.trim()
  if (!text) return

  list.entries = [...(list.entries || []), text]
  list.newEntry = ''
  void save(list)
}

function removeEntry(list: EditableList, index: number) {
  if (list.source !== 'user') return
  if (list.isBusy) return

  list.entries = (list.entries || []).filter((_, i: number) => i !== index)
  void save(list)
}

async function generateMore(list: EditableList) {
  list.errorMessage = ''
  if (list.source !== 'user') return
  if (list.isBusy) return

  list.isBusy = true
  try {
    await randomStore.generateListItems(list.id)
    await randomStore.fetchRandomLists()
  } catch (e: unknown) {
    list.errorMessage = e instanceof Error ? e.message : 'Failed to generate.'
  } finally {
    list.isBusy = false
  }
}
</script>
