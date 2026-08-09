<!-- /components/characters/character-gallery.vue -->
<template>
  <section
    class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
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

    <kr-card-flip
      v-model="infoCharacterOpen"
      :label="infoCharacter?.name || 'Character'"
    >
      <template #back="{ close, commit }">
        <kr-card-back
          v-if="infoCharacter"
          v-model:editing="infoCharacterEditing"
          :title="infoCharacter.name || 'Unnamed Character'"
          :subtitle="infoCharacter.honorific || ''"
          :description="infoCharacter.backstory || ''"
          :source="infoCharacter"
          :art-src="infoCharacter.imagePath || ''"
          :badges="infoCharacterBadges"
          :can-interact="true"
          interact-label="Chat"
          @back="commit"
          @interact="interactWithInfoCharacter"
        >
          <template #details>
            <dl class="grid grid-cols-2 gap-2 text-xs">
              <div v-if="infoCharacter.class">
                <dt class="font-black uppercase opacity-55">Class</dt>
                <dd>{{ infoCharacter.class }}</dd>
              </div>
              <div v-if="infoCharacter.genre">
                <dt class="font-black uppercase opacity-55">Genre</dt>
                <dd>{{ infoCharacter.genre }}</dd>
              </div>
              <div v-if="infoCharacter.charm">
                <dt class="font-black uppercase opacity-55">Charm</dt>
                <dd>{{ infoCharacter.charm }}</dd>
              </div>
              <div v-if="infoCharacter.empathy">
                <dt class="font-black uppercase opacity-55">Empathy</dt>
                <dd>{{ infoCharacter.empathy }}</dd>
              </div>
            </dl>
          </template>

          <!--
            REVIEWS LIVE ON THE BACK. Silas, 2026-08-10: "back: the rest of the
            info, image, those buttons, and the review section."

            They were not deleted, they were stranded -- reactable-card gates
            its reaction button on `props.selected`, and since the card back
            landed, clicking a tile sets the info id rather than the store's
            current record, so nothing in a grid is ever "selected". Exactly
            the same gate that hid edit/clone/delete.

            allowReviews is still honoured here: a record that opted out of
            reviews on the tile must not get them back on the back.
          -->
          <template #reviews>
            <reaction-card
              v-if="infoCharacter.allowReviews !== false"
              :target-id="infoCharacter.id"
              target-type="character"
              reaction-category="CHARACTER"
              :target-title="infoCharacter.name || 'Unnamed Character'"
              compact
            />
          </template>
        </kr-card-back>

        <div v-else class="p-6 text-center text-sm opacity-60">
          <p>That Character is no longer available.</p>
          <button
            type="button"
            class="btn btn-ghost btn-sm mt-3 rounded-xl"
            @click="close"
          >
            Close
          </button>
        </div>
      </template>
    </kr-card-flip>

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
        <div class="flex flex-col gap-3 kr-panel-flat p-3">
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
        class="flex h-full flex-col items-center justify-center gap-3 kr-panel-muted text-center text-base-content/60"
      >
        <Icon name="kind-icon:theater" class="h-12 w-12 text-primary" />

        <div class="max-w-2xl">
          <p class="text-lg font-bold">
            {{ emptyStateTitle }}
          </p>

          <div class="mt-3 flex flex-col gap-2 text-sm">
            <p
              v-for="reason in emptyStateDetails"
              :key="reason"
              class="kr-panel-flat px-3 py-2 text-left"
            >
              {{ reason }}
            </p>
          </div>

          <div
            v-if="characterStore.characters.length > 0"
            class="mt-3 flex flex-wrap justify-center gap-2 text-xs"
          >
            <span class="badge badge-ghost">
              Loaded: {{ exclusionSummary.total }}
            </span>

            <span
              v-if="exclusionSummary.hiddenByOwnership"
              class="badge badge-warning"
            >
              Private: {{ exclusionSummary.hiddenByOwnership }}
            </span>

            <span
              v-if="exclusionSummary.hiddenByMature"
              class="badge badge-warning"
            >
              Mature: {{ exclusionSummary.hiddenByMature }}
            </span>

            <span
              v-if="exclusionSummary.hiddenByGenre"
              class="badge badge-info"
            >
              Genre: {{ exclusionSummary.hiddenByGenre }}
            </span>

            <span
              v-if="exclusionSummary.hiddenBySearch"
              class="badge badge-secondary"
            >
              Search: {{ exclusionSummary.hiddenBySearch }}
            </span>
          </div>
        </div>

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

      <!-- Row stays bespoke: a horizontal filmstrip is not one of kr-gallery's
           cards/heroes/icons grids. -->
      <div v-else-if="isRowMode" :class="layoutClass">
        <character-card
          v-for="character in filteredCharacters"
          :key="character.id"
          :character="character"
          :selected="characterStore.selectedCharacter?.id === character.id"
          :is-selected="characterStore.selectedCharacter?.id === character.id"
          :earned-karma="earnedKarmaByCharacterId[character.id]"
          v-bind="characterCardProps"
          @edit="startEditingCharacterById"
          @clone="cloneCharacterById"
          @delete="handleCharacterDeleted"
          @open="openCharacter"
        />
      </div>

      <!-- t-060: the shared shell owns the grid and the Cards/Heroes/Icons bar;
           character-card stays the card. -->
      <kr-gallery
        v-else
        :items="galleryItems"
        :mode="galleryMode"
        empty-label="characters"
        @update:mode="galleryMode = $event"
      >
        <template #item="{ item }">
          <character-card
            v-if="characterById.get(Number(item.id))"
            :character="characterById.get(Number(item.id))!"
            :selected="characterStore.selectedCharacter?.id === item.id"
            :is-selected="characterStore.selectedCharacter?.id === item.id"
            :earned-karma="earnedKarmaByCharacterId[Number(item.id)]"
            :variant="MODE_VARIANT[galleryMode]"
            v-bind="characterCardProps"
            @edit="startEditingCharacterById"
            @clone="cloneCharacterById"
            @delete="handleCharacterDeleted"
            @open="openCharacter"
          />
        </template>
      </kr-gallery>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Character } from '~/prisma/generated/prisma/client'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { MODE_VARIANT, type GalleryMode } from '@/utils/galleryVocabulary'
import { useCharacterStore } from '@/stores/characterStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'

const props = withDefaults(
  defineProps<{
    /*
     * NO title/subtitle/showHeader. They were declared here with defaults and
     * rendered NOWHERE -- three callers passed strings into a void, most
     * visibly character-interact's "Choose Your Character".
     *
     * Deleted rather than wired up, on Silas's call. /characters is the page he
     * pointed at as closest to ideal ("this just has cards, heroes, icons, and
     * it's a lot closer to ideal"), and that is true BECAUSE the header never
     * rendered. Honouring the props would have added the band every other
     * gallery just spent this stage removing -- so the props were the bug, not
     * the missing markup.
     */
    variant?: GalleryVariant
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
    showImages: true,
    showControls: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    showStats: false,
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
const isRowMode = computed(() => props.variant === 'row')

/** Which of Cards/Heroes/Icons the shared grid is showing. */
const galleryMode = ref<GalleryMode>('cards')

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
    character.achievements ||
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

  if (!userStore.isAdmin && currentUserId.value !== null) {
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

/*
 * interface-vision t-060 — grid renders through the shared kr-gallery shell
 * while character-card stays the card, so the reactions, karma and
 * edit/clone/archive actions from t-064 survive the adoption.
 */
const galleryItems = computed<GalleryItem[]>(() =>
  filteredCharacters.value.map((character) => ({
    id: character.id,
    title: character.name || `Character ${character.id}`,
    source: character,
  })),
)

/** Slot props give back a GalleryItem, so map the id to the real record. */
const characterById = computed(
  () => new Map(filteredCharacters.value.map((c) => [c.id, c])),
)

/**
 * The card's shared props in one place, so the bespoke row layout and the
 * kr-gallery slot cannot drift when one of them gains another.
 */
/*
 * Icons is a browse view: a text-forward row whose art is a 3rem square.
 * Three floating action circles over that is the "cramped displays" Silas
 * photographed -- the buttons were larger than the artwork. Actions stay on
 * Cards and Heroes, where there is room for them.
 */
const characterCardProps = computed(() => ({
  compact: isCompact.value,
  showImage: props.showImages,
  showActions: props.showCardActions && galleryMode.value !== 'icons',
  showDescription: props.showDescriptions,
  showMeta: props.showMeta,
  showStats: props.showStats,
  showDebug: props.showDebug,
  allowEdit: props.allowEdit,
  allowClone: props.allowClone,
  allowDelete: props.allowDelete,
  imageFit: 'contain' as const,
}))

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
      return characterMatchesSearch(character, query)
    })
  }

  return characters
})

// interface-vision/t-066: earned karma for the rendered set, batched through
// the shared composable (see composables/useEarnedKarma.ts). Scoped to
// filteredCharacters — the set the grid actually renders.
const { earnedKarma: earnedKarmaByCharacterId } = useEarnedKarma(
  'character',
  () => filteredCharacters.value.map((character) => character.id),
)

const exclusionSummary = computed(() => {
  const allCharacters = characterStore.characters ?? []
  const currentId = currentUserId.value
  const query = searchQuery.value.trim().toLowerCase()

  const counts = {
    total: allCharacters.length,
    hiddenByOwnership: 0,
    hiddenByMature: 0,
    hiddenByGenre: 0,
    hiddenBySearch: 0,
    visibleBeforeGenreSearch: 0,
  }

  for (const character of allCharacters) {
    const hiddenByOwnership =
      !userStore.isAdmin &&
      currentId !== null &&
      !character.isPublic &&
      character.userId !== currentId

    if (hiddenByOwnership) {
      counts.hiddenByOwnership++
      continue
    }

    const hiddenByMature = !showMature.value && character.isMature

    if (hiddenByMature) {
      counts.hiddenByMature++
      continue
    }

    counts.visibleBeforeGenreSearch++

    const hiddenByGenre =
      selectedGenre.value !== 'all' && character.genre !== selectedGenre.value

    if (hiddenByGenre) {
      counts.hiddenByGenre++
      continue
    }

    if (query && !characterMatchesSearch(character, query)) {
      counts.hiddenBySearch++
    }
  }

  return counts
})

const emptyStateTitle = computed(() => {
  if (characterStore.characters.length === 0) {
    return 'No characters loaded.'
  }

  return `${characterStore.characters.length} characters loaded, but none match this gallery.`
})

const emptyStateDetails = computed(() => {
  const summary = exclusionSummary.value
  const reasons: string[] = []

  if (summary.hiddenByOwnership > 0) {
    reasons.push(
      `${summary.hiddenByOwnership} hidden because they are private and not owned by the current user.`,
    )
  }

  if (summary.hiddenByMature > 0) {
    reasons.push(
      `${summary.hiddenByMature} hidden because mature content is turned off.`,
    )
  }

  if (summary.hiddenByGenre > 0) {
    reasons.push(
      `${summary.hiddenByGenre} hidden by the selected genre filter: ${selectedGenre.value}.`,
    )
  }

  if (summary.hiddenBySearch > 0) {
    reasons.push(
      `${summary.hiddenBySearch} hidden because they do not match the search: "${searchQuery.value.trim()}".`,
    )
  }

  if (!currentUserId.value && !userStore.isAdmin) {
    reasons.push(
      'The current user is not loaded yet, so owned private characters may be unavailable.',
    )
  }

  if (reasons.length === 0 && characterStore.characters.length > 0) {
    reasons.push(
      'Characters are loaded, but the visible list is empty. Check whether the store data uses unexpected values for isPublic, isMature, genre, or userId.',
    )
  }

  return reasons
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshCharacters()
  }
})

function characterMatchesSearch(character: Character, query: string) {
  const haystack = [
    character.name,
    character.honorific,
    character.title,
    character.role,
    character.species,
    character.class,
    character.gender,
    character.presentation,
    character.genre,
    character.alignment,
    character.personality,
    character.backstory,
    character.achievements,
    character.quirks,
    character.drive,
    character.artPrompt,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

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

/*
 * character-card used to call characterStore.selectCharacter() itself. It emits
 * now, so the gallery owns the consequence -- which is what lets a picker
 * variant interpret the same click differently.
 */
function openCharacter(id: number) {
  if (isDropdownMode.value) {
    void characterStore.selectCharacter(id)
    return
  }

  infoCharacterId.value = id
}

/* Interact LEAVES: the chat surface is a working space, not a panel. */
function interactWithInfoCharacter() {
  const id = infoCharacterId.value
  infoCharacterOpen.value = false
  if (id) void characterStore.selectCharacter(id)
}

/*
 * INFO FIRST, INTERACTION AFTER -- the same frame Bots, Resources, Rewards and
 * Scenarios use, and the reason kr-card-back is one component rather than one
 * per gallery.
 *
 * THE DROPDOWN BRANCH COMES FIRST. This gallery is also embedded as a PICKER,
 * where a click has to pick and nothing else. verifyCardActionContract puts
 * that decision in the gallery -- "A card is an entry point. It emits; the
 * gallery decides what that means" -- which is what lets browse and picker
 * disagree about the same click.
 */
const infoCharacterId = ref<number | null>(null)
const infoCharacterEditing = ref(false)

const infoCharacter = computed(
  () =>
    characterStore.characters.find(
      (entry) => entry.id === infoCharacterId.value,
    ) ?? null,
)

const infoCharacterOpen = computed({
  get: () => infoCharacterId.value !== null,
  set: (value: boolean) => {
    if (!value) {
      infoCharacterId.value = null
      infoCharacterEditing.value = false
    }
  },
})

const infoCharacterBadges = computed(() => {
  const character = infoCharacter.value
  if (!character) return []

  return [character.class, character.genre, character.honorific]
    .map((entry) => String(entry ?? '').trim())
    .filter((entry) => entry.length > 0)
})

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
  grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr));
  gap: 0.75rem;
}

.character-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.character-row > * {
  min-width: min(200px, 80vw);
  max-width: 280px;
}
</style>
