<!-- /components/content/weird/character-gallery.vue -->
<template>
  <div class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3">
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ title }}
          </h2>

          <p
            v-if="characterStore.selectedCharacter"
            class="truncate text-sm text-base-content/70"
          >
            Selected:
            <span class="font-semibold text-primary">
              {{ characterStore.selectedCharacter.name || 'Unnamed Character' }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ subtitle }}
          </p>
        </div>

        <span v-if="!isLoading" class="badge badge-ghost shrink-0">
          {{ filteredCharacters.length }}
        </span>
      </div>

      <div
        v-if="showControls"
        class="flex flex-col gap-2 lg:flex-row lg:items-center"
      >
        <select
          v-model="selectedUser"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter characters by user"
        >
          <option value="all">All users</option>
          <option value="mine">Mine</option>
          <option
            v-for="user in userStore.users"
            :key="user.id"
            :value="user.id"
          >
            {{ user.username }}
          </option>
        </select>

        <select
          v-model="selectedGenre"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter characters by genre"
        >
          <option value="all">All genres</option>
          <option v-for="genre in characterGenres" :key="genre" :value="genre">
            {{ genre }}
          </option>
        </select>

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search characters..."
          class="input input-bordered input-sm w-full bg-base-100"
          aria-label="Search characters"
        />
      </div>

      <div v-if="showToolbar" class="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingCharacter"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add
        </button>

        <button
          v-if="allowEdit"
          class="btn btn-secondary btn-sm rounded-xl"
          type="button"
          :disabled="!characterStore.selectedCharacter"
          @click="startEditingSelectedCharacter"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
          Edit
        </button>

        <button
          v-if="allowClone"
          class="btn btn-accent btn-sm rounded-xl"
          type="button"
          :disabled="!characterStore.selectedCharacter"
          @click="cloneSelectedCharacter"
        >
          <Icon name="kind-icon:copy" class="h-4 w-4" />
          Clone
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
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading"
          @click="refreshCharacters(true)"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <section
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

      <add-character
        :mode="formMode"
        @saved="handleCharacterSaved"
        @cancel="closeCharacterForm"
      />
    </section>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading || characterStore.loading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div
        v-else-if="characterStore.error"
        class="flex h-full items-center justify-center rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">
          {{ characterStore.error }}
        </p>
      </div>

      <div
        v-else-if="filteredCharacters.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:theater" class="h-12 w-12 text-primary" />

        <div>
          <p class="text-lg font-bold">No characters found.</p>
          <p class="mt-1 text-sm">
            Either the cast list is empty, or the filters are being dramatic.
          </p>
        </div>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingCharacter"
        >
          Make the first weirdo
        </button>
      </div>

      <div v-else-if="variant === 'dropdown'" class="flex flex-col gap-2">
        <select
          class="select select-bordered w-full bg-base-100"
          :value="characterStore.selectedCharacter?.id ?? ''"
          aria-label="Select character"
          @change="selectCharacterFromEvent"
        >
          <option value="">Choose a character</option>

          <option
            v-for="character in filteredCharacters"
            :key="character.id"
            :value="character.id"
          >
            {{ character.name || `Character ${character.id}` }}
          </option>
        </select>
      </div>

      <div v-else :class="layoutClass">
        <character-card
          v-for="character in filteredCharacters"
          :key="character.id"
          :character="character"
          :selected="characterStore.selectedCharacter?.id === character.id"
          :is-selected="characterStore.selectedCharacter?.id === character.id"
          :compact="isCompact"
          :show-image="showImages"
          :show-actions="showCardActions"
          :show-description="showDescriptions"
          :show-meta="showMeta"
          :show-stats="showStats"
          :show-debug="showDebug"
          :allow-edit="allowEdit"
          :allow-clone="allowClone"
          :allow-delete="allowDelete"
          @select="selectCharacter"
          @select-character="selectCharacter"
          @edit="startEditingCharacterById"
          @clone="cloneCharacterById"
          @delete="handleCharacterDeleted"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Character } from '~/prisma/generated/prisma/client'
import { useCharacterStore } from '@/stores/characterStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'

const props = withDefaults(
  defineProps<{
    variant?: GalleryVariant
    title?: string
    subtitle?: string
    showImages?: boolean
    showControls?: boolean
    showToolbar?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showStats?: boolean
    showDebug?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowClone?: boolean
    allowDelete?: boolean
    allowRefresh?: boolean
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    variant: 'dashboard',
    title: 'Characters',
    subtitle: 'Browse, select, add, edit, or clone the cast.',
    showImages: true,
    showControls: true,
    showToolbar: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    showStats: true,
    showDebug: false,
    allowAdd: true,
    allowEdit: true,
    allowClone: true,
    allowDelete: true,
    allowRefresh: true,
    compact: false,
    autoLoad: true,
  },
)

const characterStore = useCharacterStore()
const userStore = useUserStore()

const selectedUser = ref<string | number>('all')
const selectedGenre = ref('all')
const searchQuery = ref('')
const isLoading = ref(false)
const showCharacterForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const isCompact = computed(
  () =>
    props.compact || props.variant === 'row' || props.variant === 'dropdown',
)

const formTitle = computed(() =>
  formMode.value === 'edit' ? 'Edit Character' : 'Add Character',
)

const layoutClass = computed(() =>
  props.variant === 'row' ? 'character-row' : 'character-grid',
)

const characterGenres = computed(() => {
  const set = new Set<string>()

  for (const character of characterStore.characters) {
    const genre = character.genre?.trim()

    if (genre) {
      set.add(genre)
    }
  }

  return Array.from(set).sort()
})

const filteredCharacters = computed<Character[]>(() => {
  let characters = characterStore.characters

  if (selectedUser.value === 'mine') {
    characters = characters.filter(
      (character) => character.userId === userStore.userId,
    )
  } else if (selectedUser.value !== 'all') {
    characters = characters.filter(
      (character) => character.userId === Number(selectedUser.value),
    )
  }

  if (selectedGenre.value !== 'all') {
    characters = characters.filter(
      (character) => character.genre === selectedGenre.value,
    )
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()

    characters = characters.filter((character) => {
      const haystack = [
        character.name,
        character.honorific,
        character.species,
        character.class,
        character.genre,
        character.personality,
        character.backstory,
        character.quirks,
        character.inventory,
        character.skills,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }

  return characters
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshCharacters()
  }
})

async function refreshCharacters(force = false) {
  isLoading.value = true

  try {
    await characterStore.initialize({
      force,
      fetchRemote: true,
      createDefaultForm: true,
    })
  } finally {
    isLoading.value = false
  }
}

async function selectCharacter(id: number) {
  await characterStore.selectCharacter(id)
}

function selectCharacterFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement
  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    clearSelectedCharacter()
    return
  }

  void selectCharacter(id)
}

function startAddingCharacter() {
  characterStore.startAddingCharacter()
  formMode.value = 'add'
  showCharacterForm.value = true
}

async function startEditingSelectedCharacter() {
  const id = characterStore.selectedCharacter?.id

  if (!id) return

  await startEditingCharacterById(id)
}

async function startEditingCharacterById(id: number) {
  const character = await characterStore.startEditingCharacter(id)

  if (!character) return

  formMode.value = 'edit'
  showCharacterForm.value = true
}

function cloneSelectedCharacter() {
  const id = characterStore.selectedCharacter?.id

  if (!id) return

  void cloneCharacterById(id)
}

async function cloneCharacterById(id: number) {
  const character = await characterStore.startCloningCharacter(id)

  if (!character) return

  formMode.value = 'add'
  showCharacterForm.value = true
}

function clearSelectedCharacter() {
  characterStore.deselectCharacter()
  showCharacterForm.value = false
}

function closeCharacterForm() {
  showCharacterForm.value = false
}

async function handleCharacterSaved() {
  showCharacterForm.value = false
  await refreshCharacters(true)
}

function handleCharacterDeleted(id: number) {
  if (characterStore.selectedCharacter?.id === id) {
    characterStore.deselectCharacter()
  }
}
</script>

<style scoped>
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: 1rem;
}

.character-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.character-row > * {
  min-width: min(240px, 85vw);
  max-width: 360px;
}
</style>