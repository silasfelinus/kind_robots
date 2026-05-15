<!-- /components/content/weird/character-gallery.vue -->
<template>
  <section
    class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      v-if="showHeader"
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
              {{ selectedCharacterTitle }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ subtitle }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span
            v-if="!isLoading && !characterStore.loading"
            class="badge badge-ghost"
          >
            {{ filteredCharacters.length }}
          </span>

          <button
            v-if="allowAdd && !isDropdownMode"
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="startAddingCharacter"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            <span class="hidden sm:inline">Add</span>
          </button>

          <button
            v-if="allowRefresh && !isDropdownMode"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isLoading || characterStore.loading"
            @click="refreshCharacters(true)"
          >
            <span
              v-if="isLoading || characterStore.loading"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div
        v-if="showControls && !isDropdownMode"
        class="grid grid-cols-1 gap-2 lg:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
      >
        <label
          v-if="userStore.isAdmin"
          class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-2"
        >
          <span class="label-text font-bold">Show Mature</span>

          <input
            v-model="showMature"
            type="checkbox"
            class="toggle toggle-accent toggle-sm"
          />
        </label>

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

        <button
          class="btn btn-ghost btn-sm rounded-xl lg:w-auto"
          type="button"
          :disabled="!characterStore.selectedCharacter"
          @click="clearSelectedCharacter"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>
      </div>
    </header>

    <section
      v-if="showCharacterForm"
      class="shrink-0 rounded-2xl border border-primary/30 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate text-base font-black text-primary">
            {{ formTitle }}
          </h3>

          <p class="text-sm text-base-content/60">
            {{ formSubtitle }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          @click="closeCharacterForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          <span class="hidden sm:inline">Close</span>
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

      <div v-else-if="isDropdownMode" class="flex flex-col gap-3">
        <div
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-primary/10"
              >
                <Icon name="kind-icon:person" class="h-6 w-6 text-primary" />
              </div>

              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-base-content/50">
                  Current Character
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ selectedCharacterTitle }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  {{ selectedCharacterSubtitle }}
                </p>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <button
                v-if="canCloneSelected"
                class="btn btn-accent btn-sm rounded-xl"
                type="button"
                @click="cloneSelectedCharacter"
              >
                <Icon name="kind-icon:copy" class="h-4 w-4" />
                <span class="hidden sm:inline">Clone</span>
              </button>

              <button
                v-if="canEditSelected"
                class="btn btn-secondary btn-sm rounded-xl"
                type="button"
                @click="startEditingSelectedCharacter"
              >
                <Icon name="kind-icon:pencil" class="h-4 w-4" />
                <span class="hidden sm:inline">Edit</span>
              </button>
            </div>
          </div>

          <select
            class="select select-bordered w-full bg-base-200"
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
              {{ getCharacterTitle(character) }}
            </option>

            <option v-if="allowAdd" disabled>──────────</option>

            <option v-if="allowAdd" value="__add__">Add Character</option>
          </select>

          <div
            v-if="characterStore.selectedCharacter"
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-xs text-base-content/70"
          >
            <p class="line-clamp-3">
              {{ selectedCharacterDescription }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="characterStore.selectedCharacter.isPublic"
                class="badge badge-info badge-sm"
              >
                Public
              </span>

              <span v-else class="badge badge-ghost badge-sm"> Private </span>

              <span
                v-if="characterStore.selectedCharacter.isMature"
                class="badge badge-warning badge-sm"
              >
                Mature
              </span>

              <span
                v-if="characterStore.selectedCharacter.genre"
                class="badge badge-outline badge-sm"
              >
                {{ characterStore.selectedCharacter.genre }}
              </span>

              <span
                v-if="characterStore.selectedCharacter.level"
                class="badge badge-secondary badge-sm"
              >
                Level {{ characterStore.selectedCharacter.level }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="filteredCharacters.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:theater" class="h-12 w-12 text-primary" />

    <p class="text-lg font-bold">No characters found.</p>

<p class="mt-1 text-sm">
  <span v-if="characterStore.characters.length === 0">
    The character store has no loaded characters yet.
  </span>

  <span v-else>
    {{ characterStore.characters.length }} characters loaded, but none match the current filters.
  </span>
</p>m

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingCharacter"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Make the first weirdo
        </button>
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
          @edit="startEditingCharacterById"
          @clone="cloneCharacterById"
          @delete="handleCharacterDeleted"
        />
      </div>
    </section>
  </section>
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
    showHeader?: boolean
    showImages?: boolean
    showControls?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showStats?: boolean
    showDebug?: boolean
    showModeButtons?: boolean
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
    showHeader: true,
    showImages: true,
    showControls: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    showStats: true,
    showDebug: false,
    showModeButtons: false,
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

const selectedGenre = ref('all')
const searchQuery = ref('')
const isLoading = ref(false)
const showCharacterForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const isDropdownMode = computed(() => props.variant === 'dropdown')

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || isDropdownMode.value
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'character-row' : 'character-grid'
})

const currentUserId = computed(() => {
  return userStore.userId ?? userStore.user?.id ?? null
})

const showMature = computed({
  get: () => userStore.user?.showMature ?? userStore.showMature ?? false,
  set: async (value: boolean) => {
    if (!userStore.user) return

    await userStore.updateUser({ showMature: value })
  },
})

const selectedCharacter = computed(() => {
  return characterStore.selectedCharacter
})

const selectedCharacterTitle = computed(() => {
  return selectedCharacter.value
    ? getCharacterTitle(selectedCharacter.value)
    : 'No character selected'
})

const selectedCharacterSubtitle = computed(() => {
  const character = selectedCharacter.value

  if (!character) return 'Choose a character or add a new one.'

  return (
    [character.species, character.class, character.honorific, character.genre]
      .filter(Boolean)
      .join(' / ') || 'Character selected.'
  )
})

const selectedCharacterDescription = computed(() => {
  const character = selectedCharacter.value

  if (!character) return 'No character selected.'

  return (
    character.backstory ||
    character.personality ||
    character.drive ||
    character.quirks ||
    character.skills ||
    'No character description yet.'
  )
})

const formTitle = computed(() => {
  return formMode.value === 'edit' ? 'Edit Character' : 'Add Character'
})

const formSubtitle = computed(() => {
  return formMode.value === 'edit'
    ? 'Tune this cast member before they steal the whole scene.'
    : 'Create a new cast member for stories, dreams, and chaos.'
})

const canEditSelected = computed(() => {
  const character = selectedCharacter.value

  if (!props.allowEdit || !character?.id) return false
  if (userStore.isAdmin) return true

  return character.userId === currentUserId.value
})

const canCloneSelected = computed(() => {
  return Boolean(props.allowClone && selectedCharacter.value?.id)
})

const galleryCharacters = computed<Character[]>(() => {
  let characters = characterStore.characters ?? []

  if (!userStore.isAdmin && currentUserId.value) {
    characters = characters.filter((character) => {
      return character.isPublic || character.userId === currentUserId.value
    })
  }

  if (!showMature.value) {
    characters = characters.filter((character) => !character.isMature)
  }

  return characters
})

const characterGenres = computed(() => {
  const set = new Set<string>()

  for (const character of galleryCharacters.value) {
    const genre = character.genre?.trim()

    if (genre) {
      set.add(genre)
    }
  }

  return Array.from(set).sort()
})

const filteredCharacters = computed<Character[]>(() => {
  let characters = galleryCharacters.value

  if (selectedGenre.value !== 'all') {
    characters = characters.filter((character) => {
      return character.genre === selectedGenre.value
    })
  }

  const query = searchQuery.value.trim().toLowerCase()

  if (query) {
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
        character.drive,
        character.artPrompt,
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

function getCharacterTitle(character: Character) {
  if (character.name && character.honorific) {
    return `${character.name} the ${character.honorific}`
  }

  return character.name || character.honorific || `Character ${character.id}`
}

async function refreshCharacters(force = false) {
  isLoading.value = true

  try {
    const shouldForceFetch = force || characterStore.characters.length === 0

    await characterStore.initialize({
      force: shouldForceFetch,
      fetchRemote: true,
      createDefaultForm: true,
    })
  } finally {
    isLoading.value = false
  }
}
function selectCharacterFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement

  if (target.value === '__add__') {
    startAddingCharacter()
    return
  }

  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    clearSelectedCharacter()
    return
  }

  void characterStore.selectCharacter(id)
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
