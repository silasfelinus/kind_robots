<template>
  <div class="space-y-6 w-full max-w-full overflow-x-hidden">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h2 class="text-xl font-bold shrink-0">📋 Your Preset Lists</h2>
      <form @submit.prevent="handleCreate" class="flex flex-wrap gap-2 w-full md:w-auto">
        <input
          v-model="newTitle"
          class="input input-sm input-bordered flex-1 min-w-[150px] max-w-full"
          placeholder="New list title"
        />
        <button class="btn btn-sm btn-primary" :disabled="!newTitle.trim()">
          ➕ Create
        </button>
      </form>
    </div>

    <!-- List Items -->
    <div class="space-y-4 w-full max-w-full">
      <div
        v-for="(list, index) in localLists"
        :key="list.id"
        class="bg-base-100 rounded-xl border shadow p-4 space-y-4 md:space-y-0 flex flex-col md:flex-row md:items-center md:justify-between w-full max-w-full overflow-hidden"
      >
        <!-- Title + Order -->
        <div class="flex flex-wrap items-center gap-2 flex-1 w-full min-w-0 max-w-full">
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
            class="input input-sm flex-1 min-w-[120px] max-w-full truncate"
          />
        </div>

        <!-- Toggles -->
        <div
          v-if="userStore.userId === list.userId"
          class="flex flex-wrap gap-4 items-center w-full md:w-auto justify-start md:justify-center max-w-full overflow-hidden"
        >
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
        <div class="flex gap-2 justify-end w-full md:w-auto max-w-full overflow-hidden">
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

async function handleCreate() {
  if (!newTitle.value.trim()) return
  await randomStore.createList(newTitle.value.trim())
  await randomStore.fetchRandomLists()
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
