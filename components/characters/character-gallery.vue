<!-- /components/content/weird/character-gallery.vue -->
<template>
  <div class="flex w-full flex-col gap-3 bg-base-300 p-3">
    <div class="flex shrink-0 items-center justify-between gap-2">
      <div class="min-w-0">
        <h2
          class="truncate text-base font-bold leading-tight text-base-content"
        >
          Characters
        </h2>

        <p
          v-if="characterStore.selectedCharacter"
          class="truncate text-xs text-base-content/60"
        >
          Selected:
          <span class="font-semibold text-primary">
            {{ characterStore.selectedCharacter.name }}
          </span>
        </p>
      </div>

      <span v-if="!isLoading" class="badge badge-ghost badge-sm shrink-0">
        {{ filteredCharacters.length }}
      </span>
    </div>

    <div class="flex shrink-0 flex-col gap-2">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          v-model="selectedUser"
          class="select select-bordered select-sm w-full bg-base-200 text-base-content sm:w-auto"
          aria-label="Filter by user"
        >
          <option value="all">All users</option>
          <option
            v-for="user in userStore.users"
            :key="user.id"
            :value="user.id"
          >
            {{ user.username }}
          </option>
        </select>

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search characters…"
          class="input input-bordered input-sm w-full bg-base-200 text-base-content"
          aria-label="Search characters by name"
        />
      </div>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingCharacter"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add
        </button>

        <button
          class="btn btn-secondary btn-sm rounded-xl"
          type="button"
          :disabled="!characterStore.selectedCharacter"
          @click="startEditingSelectedCharacter"
        >
          <Icon name="kind-icon:edit" class="h-4 w-4" />
          Edit
        </button>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="!characterStore.selectedCharacter"
          @click="clearSelectedCharacter"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading"
          @click="refreshCharacters"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </div>

    <div
      v-if="showCharacterForm"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-bold text-base-content">
          {{ formTitle }}
        </h3>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          @click="closeCharacterForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <add-character :mode="formMode" @saved="handleCharacterSaved" />
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <div
      v-else-if="filteredCharacters.length === 0"
      class="flex flex-col items-center justify-center gap-2 py-10 text-base-content/50"
    >
      <span class="text-3xl">🎭</span>
      <p class="text-sm font-medium">No characters found</p>

      <button
        class="btn btn-primary btn-sm mt-2 rounded-xl"
        type="button"
        @click="startAddingCharacter"
      >
        Make the first weirdo
      </button>
    </div>

    <div v-else class="character-grid">
      <CharacterCard
        v-for="character in filteredCharacters"
        :key="character.id"
        :character="character"
        :is-selected="characterStore.selectedCharacter?.id === character.id"
        @select-character="handleSelectCharacter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Character } from '~/prisma/generated/prisma/client'
import { useCharacterStore } from '@/stores/characterStore'
import { useUserStore } from '@/stores/userStore'

const characterStore = useCharacterStore()
const userStore = useUserStore()

const selectedUser = ref<string | number>('all')
const searchQuery = ref('')
const isLoading = ref(true)
const showCharacterForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const formTitle = computed(() =>
  formMode.value === 'edit' ? 'Edit Character' : 'Add Character',
)

async function handleCharacterSaved() {
  showCharacterForm.value = false
  await refreshCharacters()
}

const filteredCharacters = computed<Character[]>(() => {
  let characters = characterStore.characters

  if (selectedUser.value !== 'all') {
    characters = characters.filter(
      (character) => character.userId === Number(selectedUser.value),
    )
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()

    characters = characters.filter((character) =>
      character.name.toLowerCase().includes(query),
    )
  }

  return characters
})

onMounted(async () => {
  await refreshCharacters()
})

async function refreshCharacters() {
  isLoading.value = true

  try {
    await characterStore.initialize({
      fetchRemote: true,
      createDefaultForm: true,
    })
  } catch (error) {
    console.error('Error fetching characters:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleSelectCharacter(characterId: number) {
  await characterStore.selectCharacter(characterId)
}

function startAddingCharacter() {
  characterStore.deselectCharacter()
  characterStore.characterForm = characterStore.generateDefaultCharacter()
  formMode.value = 'add'
  showCharacterForm.value = true
}

function startEditingSelectedCharacter() {
  if (!characterStore.selectedCharacter) return

  characterStore.characterForm = {
    ...characterStore.selectedCharacter,
  }

  formMode.value = 'edit'
  showCharacterForm.value = true
}

function clearSelectedCharacter() {
  characterStore.deselectCharacter()
  showCharacterForm.value = false
}

function closeCharacterForm() {
  showCharacterForm.value = false
}
</script>

<style scoped>
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr));
  gap: 0.75rem;
}
</style>
