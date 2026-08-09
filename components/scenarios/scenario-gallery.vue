<!-- /components/scenarios/scenario-gallery.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3">
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-2 kr-panel-flat px-3 py-2"
    >
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-base font-black text-base-content">
            {{ title }}
          </h2>

          <p class="truncate text-sm text-base-content/60">
            <span class="hidden md:inline">{{ subtitle }}</span>
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span v-if="!isLoading" class="badge badge-ghost">
            {{ filteredScenarios.length }}
          </span>

          <button
            v-if="allowAdd && !isDropdownMode"
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="startAddingScenario"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            <span class="hidden sm:inline">Add</span>
          </button>

          <button
            v-if="allowRefresh && !isDropdownMode"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isLoading"
            @click="refreshScenarios(true)"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>

    <section
      v-if="showScenarioForm"
      class="min-h-0 shrink-0 overflow-y-auto rounded-2xl border border-primary/30 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <h3 class="truncate text-base font-black text-primary">
          {{ formMode === 'edit' ? 'Edit Scenario' : 'Add Scenario' }}
        </h3>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          @click="showScenarioForm = false"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <add-scenario :mode="formMode" @saved="handleScenarioSaved" />
    </section>

    <kr-card-flip
      v-model="infoScenarioOpen"
      :label="infoScenario?.title || 'Scenario'"
    >
      <template #back="{ close, commit }">
        <kr-card-back
          v-if="infoScenario"
          v-model:editing="infoScenarioEditing"
          :title="infoScenario.title || 'Untitled Scenario'"
          :description="infoScenario.description || ''"
          :source="infoScenario"
          :art-src="infoScenario.imagePath || ''"
          :badges="infoScenarioBadges"
          :can-interact="true"
          interact-label="Play"
          @back="commit"
          @interact="interactWithInfoScenario"
        >
          <template #details>
            <dl class="grid grid-cols-2 gap-2 text-xs">
              <div v-if="infoScenario.locations" class="col-span-2">
                <dt class="font-black uppercase opacity-55">Locations</dt>
                <dd class="whitespace-pre-wrap">
                  {{ infoScenario.locations }}
                </dd>
              </div>
              <div v-if="infoScenario.inspirations" class="col-span-2">
                <dt class="font-black uppercase opacity-55">Inspirations</dt>
                <dd class="whitespace-pre-wrap">
                  {{ infoScenario.inspirations }}
                </dd>
              </div>
              <div v-if="infoScenario.genres">
                <dt class="font-black uppercase opacity-55">Genres</dt>
                <dd>{{ infoScenario.genres }}</dd>
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
              v-if="infoScenario.allowReviews !== false"
              :target-id="infoScenario.id"
              target-type="scenario"
              reaction-category="SCENARIO"
              :target-title="infoScenario.title || 'Untitled Scenario'"
              compact
            />
          </template>
        </kr-card-back>

        <div v-else class="p-6 text-center text-sm opacity-60">
          <p>That Scenario is no longer available.</p>
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

    <section class="min-h-0 flex-1" :class="isRowMode ? '' : 'overflow-y-auto'">
      <div
        v-if="isLoading"
        class="flex h-full min-h-32 items-center justify-center"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="errorMessage"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-error/40 bg-error/10 p-6 text-center"
      >
        <p class="font-bold text-error">{{ errorMessage }}</p>

        <button
          class="btn btn-sm btn-outline btn-error rounded-xl"
          type="button"
          @click="refreshScenarios(true)"
        >
          Try Again
        </button>
      </div>

      <div v-else-if="isDropdownMode" class="flex flex-col gap-3">
        <select
          class="select select-bordered w-full bg-base-100"
          :value="scenarioStore.selectedScenario?.id ?? ''"
          aria-label="Select scenario"
          @change="selectScenarioFromEvent"
        >
          <option value="">Choose a scenario</option>

          <option
            v-for="scenario in filteredScenarios"
            :key="scenario.id"
            :value="scenario.id"
          >
            {{ scenario.title || 'Untitled Scenario' }}
          </option>

          <option v-if="allowAdd" disabled>──────────</option>
          <option v-if="allowAdd" value="__add__">+ Add Scenario</option>
        </select>

        <ScenarioCard
          v-if="scenarioStore.selectedScenario"
          :scenario="scenarioStore.selectedScenario"
          :selected="true"
          :compact="true"
          :show-actions="allowEdit"
          :show-description="true"
          :show-meta="showMeta"
          :allow-edit="allowEdit"
          :allow-delete="false"
          :allow-clone="false"
          @edit="startEditingScenarioById"
          @open="openScenario"
        />

        <section v-if="showSelectedCharacterCards" class="kr-panel-flat p-3">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-base font-black text-base-content">
                {{ selectedScenarioTitle }} Cast
              </h3>

              <p class="truncate text-sm text-base-content/60">
                Character cards connected to this scenario.
              </p>
            </div>

            <span class="badge badge-secondary">
              {{ selectedScenarioCharacters.length }}
            </span>
          </div>

          <div class="character-card-grid">
            <character-card
              v-for="character in castCharacters"
              :key="character.id"
              :character="character"
              :compact="true"
              :show-image="showImages"
              :show-actions="false"
              :show-reaction="false"
              :show-meta="showMeta"
            />
          </div>
        </section>
      </div>

      <div
        v-else-if="filteredScenarios.length === 0"
        class="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200/50 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:map" class="h-10 w-10 opacity-50" />

        <div>
          <p class="font-bold">
            {{
              searchQuery
                ? 'No scenarios match your search.'
                : 'No scenarios yet.'
            }}
          </p>

          <p class="mt-1 text-sm opacity-70">
            {{
              searchQuery
                ? 'Try fewer or stranger words.'
                : 'Every weird little world starts somewhere.'
            }}
          </p>
        </div>

        <button
          v-if="allowAdd && !searchQuery"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingScenario"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add Scenario
        </button>
      </div>

      <div v-else class="flex min-h-0 flex-col gap-4">
        <!-- Row stays bespoke: a horizontal filmstrip is not one of
             kr-gallery's cards/heroes/icons grids. -->
        <div v-if="isRowMode" :class="layoutClass">
          <ScenarioCard
            v-for="scenario in filteredScenarios"
            :key="scenario.id"
            :scenario="scenario"
            :selected="scenarioStore.selectedScenario?.id === scenario.id"
            :earned-karma="earnedKarmaByScenarioId[scenario.id]"
            v-bind="scenarioCardProps"
            @edit="startEditingScenarioById"
            @clone="cloneScenarioById"
            @delete="handleScenarioDeleted"
            @open="openScenario"
          />
        </div>

        <!-- t-060: the shared shell owns the grid AND the Cards/Heroes/Icons
             bar; ScenarioCard stays the card. The mode is bound both ways and
             fed through MODE_VARIANT into the card's `variant`, because a mode
             bar that does not reach the card is the defect Silas found on the
             first pass: "no different layouts". -->
        <kr-gallery
          v-else
          :items="galleryItems"
          :mode="galleryMode"
          empty-label="scenarios"
          @update:mode="galleryMode = $event"
        >
          <template #toolbar>
            <div
              v-if="showControls && !isDropdownMode"
              class="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <label
                class="input input-bordered input-sm flex flex-1 items-center gap-2 bg-base-200"
              >
                <Icon name="kind-icon:search" class="h-4 w-4 opacity-50" />
                <input
                  v-model="searchQuery"
                  type="search"
                  aria-label="Search scenarios"
                  placeholder="Search scenarios..."
                  class="grow bg-transparent"
                />
              </label>

              <label
                v-if="userStore.isAdmin"
                class="label cursor-pointer gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-1.5"
              >
                <span class="label-text text-sm font-bold">Mature</span>

                <input
                  v-model="showMature"
                  type="checkbox"
                  class="toggle toggle-accent toggle-sm"
                />
              </label>
            </div>
          </template>

          <template #item="{ item }">
            <ScenarioCard
              v-if="scenarioById.get(Number(item.id))"
              :scenario="scenarioById.get(Number(item.id))!"
              :selected="scenarioStore.selectedScenario?.id === item.id"
              :earned-karma="earnedKarmaByScenarioId[Number(item.id)]"
              :variant="MODE_VARIANT[galleryMode]"
              v-bind="scenarioCardProps"
              @edit="startEditingScenarioById"
              @clone="cloneScenarioById"
              @delete="handleScenarioDeleted"
              @open="openScenario"
            />
          </template>
        </kr-gallery>

        <section v-if="showSelectedCharacterCards" class="kr-panel-flat p-3">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-base font-black text-base-content">
                {{ selectedScenarioTitle }} Cast
              </h3>

              <p class="truncate text-sm text-base-content/60">
                Character cards connected to this scenario.
              </p>
            </div>

            <span class="badge badge-secondary">
              {{ selectedScenarioCharacters.length }}
            </span>
          </div>

          <div class="character-card-grid">
            <character-card
              v-for="character in castCharacters"
              :key="character.id"
              :character="character"
              :compact="true"
              :show-image="showImages"
              :show-actions="false"
              :show-reaction="false"
              :show-meta="showMeta"
            />
          </div>
        </section>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Character } from '~/prisma/generated/prisma/client'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { MODE_VARIANT, type GalleryMode } from '@/utils/galleryVocabulary'
import type { ScenarioWithRelations } from '@/stores/scenarioStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'grid' | 'dashboard' | 'row' | 'dropdown'

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
    showInspirations?: boolean
    showCharacters?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowClone?: boolean
    allowRefresh?: boolean
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    variant: 'grid',
    title: 'Scenarios',
    subtitle: 'Pick a weird little world to ruin beautifully.',
    showHeader: true,
    showImages: true,
    showControls: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    showInspirations: false,
    showCharacters: true,
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    allowClone: true,
    allowRefresh: true,
    compact: false,
    autoLoad: true,
  },
)

const scenarioStore = useScenarioStore()
const userStore = useUserStore()

const searchQuery = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const showScenarioForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const isDropdownMode = computed(() => props.variant === 'dropdown')
const isRowMode = computed(() => props.variant === 'row')

const isCompact = computed(() => {
  return props.compact || isRowMode.value || isDropdownMode.value
})

const layoutClass = computed(() => {
  return isRowMode.value ? 'scenario-row' : 'scenario-grid'
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

const galleryScenarios = computed<ScenarioWithRelations[]>(() => {
  let scenarios = scenarioStore.scenarios

  if (!userStore.isAdmin) {
    scenarios = scenarios.filter((scenario) => {
      return scenario.isPublic || scenario.userId === currentUserId.value
    })
  }

  if (!showMature.value) {
    scenarios = scenarios.filter((scenario) => !scenario.isMature)
  }

  return scenarios
})

/*
 * interface-vision t-060 — the grid variant renders through the shared
 * kr-gallery shell (mode/skeleton/error/empty/grid) while keeping ScenarioCard
 * as the card, via kr-gallery's `item` slot. Adopting the shell must not cost
 * the reactions, earned karma and edit/clone/archive actions that t-064 put on
 * kr-entity-card-body, which is exactly what the built-in item rendering would
 * have traded away.
 *
 * `row` and `dropdown` stay bespoke on purpose: a horizontal filmstrip and a
 * <select> are not grids, and forcing them through a grid shell would be
 * adoption for the counter's sake rather than for the user's.
 */
/** Which of Cards/Heroes/Icons the grid is showing. */
const galleryMode = ref<GalleryMode>('cards')

const galleryItems = computed<GalleryItem[]>(() =>
  filteredScenarios.value.map((scenario) => ({
    id: scenario.id,
    title: scenario.title || `Scenario ${scenario.id}`,
    source: scenario,
  })),
)

/** Slot props give back a GalleryItem, so map the id to the real record. */
const scenarioById = computed(
  () => new Map(filteredScenarios.value.map((s) => [s.id, s])),
)

/**
 * The card's props in one place. Both the bespoke row layout and the
 * kr-gallery slot render the same ScenarioCard, and a nine-prop list copied
 * twice would drift the moment one of them gained a tenth.
 */
/*
 * Icons is a browse view: a text-forward row whose art is a 3rem square.
 * Three floating action circles over that is the "cramped displays" Silas
 * photographed -- the buttons were larger than the artwork. Actions stay on
 * Cards and Heroes, where there is room for them.
 */
const scenarioCardProps = computed(() => ({
  showImage: props.showImages,
  compact: isCompact.value,
  showActions: props.showCardActions && galleryMode.value !== 'icons',
  showDescription: props.showDescriptions,
  showMeta: props.showMeta,
  showInspirations: props.showInspirations,
  allowEdit: props.allowEdit,
  allowDelete: props.allowDelete,
  allowClone: props.allowClone,
}))

const filteredScenarios = computed<ScenarioWithRelations[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) return galleryScenarios.value

  return galleryScenarios.value.filter((scenario) => {
    const dreamText =
      scenario.Dreams?.map((dream) => dream.title || dream.slug || '').join(
        ' ',
      ) ?? ''

    const characterText =
      scenario.Characters?.map((character) =>
        [
          character.name,
          character.honorific,
          character.title,
          character.role,
          character.class,
          character.species,
          character.genre,
        ]
          .filter(Boolean)
          .join(' '),
      ).join(' ') ?? ''

    return (
      (scenario.title || '').toLowerCase().includes(query) ||
      (scenario.description || '').toLowerCase().includes(query) ||
      (scenario.locations || '').toLowerCase().includes(query) ||
      (scenario.genres || '').toLowerCase().includes(query) ||
      (scenario.inspirations || '').toLowerCase().includes(query) ||
      dreamText.toLowerCase().includes(query) ||
      characterText.toLowerCase().includes(query)
    )
  })
})

// interface-vision/t-066: earned karma for the rendered set, batched through
// the shared composable (see composables/useEarnedKarma.ts). Scoped to
// filteredScenarios — the set the grid actually renders.
const { earnedKarma: earnedKarmaByScenarioId } = useEarnedKarma(
  'scenario',
  () => filteredScenarios.value.map((scenario) => scenario.id),
)

const selectedScenarioCharacters = computed(() => {
  return scenarioStore.selectedScenario?.Characters ?? []
})

/*
 * scenarioStore's Characters relation is a curated Pick<Character, ...> of safe
 * display fields (see ScenarioCharacter in stores/scenarioStore.ts) -- it omits
 * userId and allowReviews, which character-card.vue's full Character prop type
 * technically requires. Both cast-grid renders below pass show-actions="false"
 * and show-reaction="false", so neither omitted field is ever read; the cast is
 * safe under that configuration.
 */
const castCharacters = computed(
  () => selectedScenarioCharacters.value as unknown as Character[],
)

const selectedScenarioTitle = computed(() => {
  return scenarioStore.selectedScenario?.title || 'Selected Scenario'
})

const showSelectedCharacterCards = computed(() => {
  return props.showCharacters && selectedScenarioCharacters.value.length > 0
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshScenarios()
  }
})

async function refreshScenarios(force = false) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await scenarioStore.initialize({
      force,
      fetchRemote: true,
      includeSeeds: true,
    })
  } catch (error) {
    console.error('Failed to load scenarios:', error)

    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Failed to load scenarios. Please try again.'
  } finally {
    isLoading.value = false
  }
}

/*
 * scenario-card used to select the Scenario itself AND emit, so the store was
 * already changed before the gallery heard about it. It emits only now.
 */
function openScenario(id: number) {
  if (isDropdownMode.value) {
    void scenarioStore.selectScenario(id)
    return
  }

  infoScenarioId.value = id
}

/* Interact LEAVES: the story surface is a working space, not a panel. */
function interactWithInfoScenario() {
  const id = infoScenarioId.value
  infoScenarioOpen.value = false
  if (id) void scenarioStore.selectScenario(id)
}

/*
 * INFO FIRST, INTERACTION AFTER -- the same frame Bots, Resources and Rewards
 * use, and the reason kr-card-back is one component rather than one per
 * gallery. Picking turns the card over; the thing you came to do is a button
 * on the back.
 *
 * THE DROPDOWN BRANCH COMES FIRST. This gallery is also embedded as a PICKER,
 * where a click has to pick and nothing else. verifyCardActionContract puts
 * that decision in the gallery -- "A card is an entry point. It emits; the
 * gallery decides what that means" -- which is what lets browse and picker
 * disagree about the same click.
 *
 * The id IS the open state so the two cannot drift; only the false direction
 * is writable, because the flip closes itself on Escape and the backdrop.
 */
const infoScenarioId = ref<number | null>(null)
const infoScenarioEditing = ref(false)

const infoScenario = computed(
  () =>
    scenarioStore.scenarios.find(
      (entry) => entry.id === infoScenarioId.value,
    ) ?? null,
)

const infoScenarioOpen = computed({
  get: () => infoScenarioId.value !== null,
  set: (value: boolean) => {
    if (!value) {
      infoScenarioId.value = null
      infoScenarioEditing.value = false
    }
  },
})

const infoScenarioBadges = computed(() => {
  const scenario = infoScenario.value
  if (!scenario) return []

  return [scenario.genres, scenario.isMature ? '18+' : '']
    .map((entry) => String(entry ?? '').trim())
    .filter((entry) => entry.length > 0)
})

function selectScenarioFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement

  if (target.value === '__add__') {
    startAddingScenario()
    return
  }

  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    scenarioStore.deselectScenario()
    return
  }

  void scenarioStore.selectScenario(id)
}

function startAddingScenario() {
  scenarioStore.deselectScenario()
  scenarioStore.scenarioForm = {
    title: '',
    description: '',
    locations: '',
    genres: '',
    inspirations: '',
    intros: [],
    artPrompt: '',
    imagePath: null,
    artImageId: null,
    isPublic: true,
    isMature: false,
  }

  formMode.value = 'add'
  showScenarioForm.value = true
}

async function startEditingScenarioById(id: number) {
  const scenario =
    scenarioStore.scenarios.find((entry) => entry.id === id) ??
    (await scenarioStore.fetchScenarioById(id))

  if (!scenario) return

  await scenarioStore.selectScenario(id)
  scenarioStore.scenarioForm = scenarioStore.toScenarioForm(scenario)

  formMode.value = 'edit'
  showScenarioForm.value = true
}

function cloneScenarioById(id: number) {
  const scenario = scenarioStore.scenarios.find((entry) => entry.id === id)

  if (!scenario) return

  scenarioStore.deselectScenario()

  scenarioStore.scenarioForm = {
    ...scenarioStore.toScenarioForm(scenario),
    id: undefined,
    title: `Copy of ${scenario.title || 'Untitled Scenario'}`,
    isPublic: false,
  }

  formMode.value = 'add'
  showScenarioForm.value = true
}

async function handleScenarioSaved() {
  showScenarioForm.value = false
  await refreshScenarios(true)
}

function handleScenarioDeleted(id: number) {
  if (scenarioStore.selectedScenario?.id === id) {
    scenarioStore.deselectScenario()
  }
}
</script>

<style scoped>
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr));
  gap: 0.75rem;
  align-items: start;
}

.scenario-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scroll-snap-type: x proximity;
}

.scenario-row > * {
  scroll-snap-align: start;
  min-width: min(180px, 70vw);
  max-width: 240px;
  flex-shrink: 0;
}

.character-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr));
  gap: 0.75rem;
  align-items: stretch;
}
</style>
