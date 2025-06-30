<!-- /components/content/random/random-gallery.vue -->
<template>
  <div class="space-y-4">
    <!-- Create List -->
    <form @submit.prevent="createNewList" class="flex gap-2">
      <input
        v-model="newTitle"
        class="input input-bordered w-full"
        placeholder="New List Title"
      />
      <button class="btn btn-primary">➕ Add List</button>
    </form>

    <!-- List of RandomLists -->
    <div v-if="randomStore.filteredLists.length">
      <div
        v-for="list in randomStore.filteredLists"
        :key="list.id"
        class="p-4 rounded-xl shadow bg-base-100 space-y-2"
      >
        <div class="flex justify-between items-center">
          <h3 class="font-bold text-lg truncate">
            {{ list.title || 'Untitled' }}
          </h3>
          <div class="flex gap-2">
            <button
              v-if="list.userId === userStore.userId"
              class="btn btn-sm btn-outline"
              @click="editList(list)"
            >
              ✏️
            </button>
            <button
              v-if="list.userId === userStore.userId"
              class="btn btn-sm btn-error"
              @click="randomStore.deleteList(list.id)"
            >
              🗑️
            </button>
          </div>
        </div>
        <p class="text-sm text-base-content whitespace-pre-line">
          {{ list.pitch }}
        </p>
      </div>
    </div>
    <div v-else class="text-center text-base-content">No lists found.</div>

    <!-- Modal for Editing -->
    <dialog ref="editorRef" class="modal modal-open" v-if="editingList">
      <form method="dialog" class="modal-box space-y-4">
        <h3 class="font-bold text-lg">Edit List</h3>
        <input
          v-model="editingList.title"
          class="input input-bordered w-full"
          placeholder="List Title"
        />
        <textarea
          v-model="editingList.pitch"
          class="textarea textarea-bordered w-full h-32"
          placeholder="List Content"
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
          <button class="btn" @click="saveEdit">💾 Save</button>
          <button class="btn btn-ghost" @click="cancelEdit">Cancel</button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRandomStore } from '@/stores/randomStore'
import { useUserStore } from '@/stores/userStore'
import type { Pitch } from '@prisma/client'

const randomStore = useRandomStore()
const userStore = useUserStore()

const newTitle = ref('')
const editingList = ref<Pitch | null>(null)
const editorRef = ref<HTMLDialogElement | null>(null)

onMounted(() => randomStore.fetchRandomLists())

async function createNewList() {
  if (!newTitle.value.trim()) return
  await randomStore.createList(newTitle.value.trim())
  newTitle.value = ''
}

function editList(list: Pitch) {
  // Shallow copy to avoid mutating directly in case of cancel
  editingList.value = { ...list }
}

function cancelEdit() {
  editingList.value = null
}

async function saveEdit() {
  if (editingList.value) {
    await randomStore.updateList(editingList.value)
    editingList.value = null
  }
}
</script>
