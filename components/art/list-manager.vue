<!-- /components/content/art/list-manager.vue -->
<template>
  <div class="space-y-6 w-full max-w-full overflow-x-hidden">
    <!-- Header -->
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
        >
          ➕ Create
        </button>
      </form>
    </div>

    <!-- List Items -->
    <div class="space-y-4 w-full max-w-full">
      <div
        v-for="(list, index) in localLists"
        :key="list.id"
        class="bg-base-100 rounded-xl border shadow p-4 space-y-4"
      >
        <!-- Title + Actions -->
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div class="flex gap-2 items-center flex-1 w-full min-w-0 max-w-full">
            <input
              v-model="list.title"
              @change="save(list)"
              class="input input-sm flex-1 min-w-[120px] max-w-full truncate"
            />
            <button @click="generateMore(list)" class="btn btn-xs btn-info">
              ⚙️ Generate
            </button>
            <button class="btn btn-xs btn-accent" @click="save(list)">
              💾
            </button>
            <button
              class="btn btn-xs btn-error"
              @click="confirmDelete(list.id)"
            >
              🗑️
            </button>
          </div>
        </div>

        <!-- Entry Input -->
        <form @submit.prevent="handleEntry(list)" class="flex gap-2">
          <input
            v-model="list.newEntry"
            class="input input-sm input-bordered flex-1"
            placeholder="Add new item"
          />
          <button
            class="btn btn-sm btn-secondary"
            type="submit"
            :disabled="!list.newEntry?.trim()"
          >
            ➕ Add
          </button>
        </form>

        <!-- List Entries -->
        <ul class="list-disc list-inside text-sm pl-2 text-base-content/80">
          <li
            v-for="(entry, i) in list.entries || []"
            :key="i"
            class="flex justify-between items-center gap-2"
          >
            <span>{{ entry }}</span>
            <button
              class="btn btn-xs btn-outline"
              @click="removeEntry(list, i)"
              title="Remove entry"
            >
              ❌
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/art/list-manager.vue
import { ref, watch } from 'vue'
import { useRandomStore } from '@/stores/randomStore'
import { useUserStore } from '@/stores/userStore'
import { storeToRefs } from 'pinia'
import type { Pitch } from '@prisma/client'

const userStore = useUserStore()
const randomStore = useRandomStore()
const { filteredLists } = storeToRefs(randomStore)

interface EditableList extends Pitch {
  newEntry: string
  entries: string[]
}

const newTitle = ref('')
const isTyping = ref(false)
const localLists = ref<EditableList[]>([])

watch(
  filteredLists,
  (val) => {
    localLists.value = val.map((list) => ({
      ...list,
      newEntry: '',
      entries: list.examples ? JSON.parse(list.examples) : [],
    }))
  },
  { immediate: true },
)

async function handleCreate() {
  if (!newTitle.value.trim()) return
  await randomStore.createList(newTitle.value.trim())
  await randomStore.fetchRandomLists()
  newTitle.value = ''
  isTyping.value = false
}

function save(list: EditableList) {
  list.examples = JSON.stringify(list.entries)
  randomStore.updateList(list)
}

function confirmDelete(id: number) {
  if (confirm('Delete this list?')) {
    randomStore.deleteList(id)
  }
}

function handleEntry(list: EditableList) {
  const text = list.newEntry?.trim()
  if (!text) return
  list.entries = [...(list.entries || []), text]
  list.newEntry = ''
  save(list)
}

function removeEntry(list: EditableList, index: number) {
  list.entries = list.entries?.filter((_, i: number) => i !== index)
  save(list)
}

async function generateMore(list: EditableList) {
  await randomStore.generateListItems(list.id)
  await randomStore.fetchRandomLists()
}
</script>
