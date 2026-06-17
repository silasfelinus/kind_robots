<!-- /components/scenarios/scenario-gallery.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3">
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-black text-base-content">
            {{ title }}
          </h2>

          <p class="truncate text-sm text-base-content/60">
            {{ subtitle }}
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
        />

        <section
          v-if="showSelectedCharacterCards"
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
        >
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
            <CharacterFlipCard
              v-for="character in selectedScenarioCharacters"
              :key="character.id"
              :character="character"
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
        <div :class="layoutClass">
          <ScenarioCard
            v-for="scenario in filteredScenarios"
            :key="scenario.id"
            :scenario="scenario"
            :selected="scenarioStore.selectedScenario?.id === scenario.id"
            :show-image="showImages"
            :compact="isCompact"
            :show-actions="showCardActions"
            :show-description="showDescriptions"
            :show-meta="showMeta"
            :show-inspirations="showInspirations"
            :allow-edit="allowEdit"
            :allow-delete="allowDelete"
            :allow-clone="allowClone"
            @edit="startEditingScenarioById"
            @clone="cloneScenarioById"
            @delete="handleScenarioDeleted"
          />
        </div>

        <section
          v-if="showSelectedCharacterCards"
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-base font-black text-base-content">
                {{ selectedScenarioTitle }} Cast
              </h3>

              <p class="truncate text-sm text-base-content/60">
                Tap a card to flip between portrait and character data.
              </p>
            </div>

            <span class="badge badge-secondary">
              {{ selectedScenarioCharacters.length }}
            </span>
          </div>

          <div class="character-card-grid">
            <CharacterFlipCard
              v-for="character in selectedScenarioCharacters"
              :key="character.id"
              :character="character"
            />
          </div>
        </section>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

const selectedScenarioCharacters = computed(() => {
  return scenarioStore.selectedScenario?.Characters ?? []
})

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
  grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
  gap: 1rem;
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
  min-width: min(220px, 70vw);
  max-width: 280px;
  flex-shrink: 0;
}

.character-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 1rem;
  align-items: stretch;
}
</style>
