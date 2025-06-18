<!-- /components/content/art/list-manager.vue -->
<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold">📋 Your Preset Lists</h2>
      <form @submit.prevent="handleCreate" class="flex gap-2">
        <input
          v-model="newTitle"
          class="input input-sm input-bordered"
          placeholder="New list title"
        />
        <button class="btn btn-sm btn-primary" :disabled="!newTitle.trim()">
          ➕ Create
        </button>
      </form>
    </div>

    <!-- List Items -->
    <div class="space-y-4">
      <div
        v-for="(list, index) in localLists"
        :key="list.id"
        class="bg-base-100 rounded-xl border shadow p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <!-- Title + Order -->
        <div class="flex items-center gap-2 flex-1 w-full">
          <button
            @click="moveUp(index)"
            class="btn btn-xs btn-outline"
            :disabled="index === 0"
          >
            ⬆
          </button>
          <button
            @click="moveDown(index)"
            class="btn btn-xs btn-outline"
            :disabled="index === localLists.length - 1"
          >
            ⬇
          </button>
          <input
            v-model="list.title"
            @change="save(list)"
            class="input input-sm flex-1"
          />
        </div>

        <!-- Toggles (owner-only) -->
        <div v-if="userStore.userId === list.userId" class="flex flex-wrap gap-4 items-center justify-start md:justify-center">
          <label class="label cursor-pointer gap-2">
            <span class="label-text">🔓 Public</span>
            <input
              type="checkbox"
              class="toggle toggle-success"
              v-model="list.isPublic"
              @change="save(list)"
            />
          </label>

          <label class="label cursor-pointer gap-2">
            <span class="label-text">🔞 Mature</span>
            <input
              type="checkbox"
              class="toggle toggle-warning"
              v-model="list.isMature"
              @change="save(list)"
            />
          </label>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 justify-end">
          <button class="btn btn-sm btn-accent" @click="save(list)">
            💾 Save
          </button>
          <button
            class="btn btn-sm btn-error"
            @click="confirmDelete(list.id)"
            title="Delete list"
          >
            🗑️
          </button>
        </div>
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

const userStore = useUserStore()
const randomStore = useRandomStore()
const { filteredLists } = storeToRefs(randomStore)

const newTitle = ref('')
const localLists = ref([...filteredLists.value])

watch(filteredLists, (val) => {
  localLists.value = [...val]
})

function handleCreate() {
  if (!newTitle.value.trim()) return
  randomStore.createList(newTitle.value.trim())
  newTitle.value = ''
}

function save(list: any) {
  randomStore.updateList(list)
}

function confirmDelete(id: number) {
  if (confirm('Delete this list?')) {
    randomStore.deleteList(id)
  }
}

function moveUp(index: number) {
  if (index === 0) return
  const item = localLists.value.splice(index, 1)[0]
  localLists.value.splice(index - 1, 0, item)
}

function moveDown(index: number) {
  if (index === localLists.value.length - 1) return
  const item = localLists.value.splice(index, 1)[0]
  localLists.value.splice(index + 1, 0, item)
}
</script>
