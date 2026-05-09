<!-- /components/scenarios/scenario-gallery.vue -->
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
            v-if="scenarioStore.selectedScenario"
            class="truncate text-sm text-base-content/70"
          >
            Selected:
            <span class="font-semibold text-primary">
              {{ scenarioStore.selectedScenario.title || 'Untitled Scenario' }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
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
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div
        v-if="showControls && !isDropdownMode"
        class="grid grid-cols-1 gap-2 lg:grid-cols-[auto_minmax(0,1fr)_auto]"
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

        <input
          v-model="searchQuery"
          type="search"
          aria-label="Search scenarios"
          placeholder="Search scenarios..."
          class="input input-bordered input-sm w-full bg-base-100"
        />

        <button
          class="btn btn-ghost btn-sm rounded-xl lg:w-auto"
          type="button"
          :disabled="!scenarioStore.selectedScenario"
          @click="clearSelectedScenario"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>
      </div>
    </header>

    <section
      v-if="showScenarioForm"
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
          @click="closeScenarioForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          <span class="hidden sm:inline">Close</span>
        </button>
      </div>

      <add-scenario :mode="formMode" @saved="handleScenarioSaved" />
    </section>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div
        v-else-if="errorMessage"
        class="flex h-full items-center justify-center rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">
          {{ errorMessage }}
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
                <Icon name="kind-icon:map" class="h-6 w-6 text-primary" />
              </div>

              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-base-content/50">
                  Current Scenario
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ selectedScenarioTitle }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  {{ selectedScenarioSubtitle }}
                </p>
              </div>
            </div>

            <button
              v-if="canEditSelected"
              class="btn btn-secondary btn-sm rounded-xl"
              type="button"
              @click="startEditingScenario"
            >
              <Icon name="kind-icon:pencil" class="h-4 w-4" />
              <span class="hidden sm:inline">Edit</span>
            </button>
          </div>

          <select
            class="select select-bordered w-full bg-base-200"
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

            <option v-if="allowAdd" value="__add__">Add Scenario</option>
          </select>

          <div
            v-if="scenarioStore.selectedScenario"
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-xs text-base-content/70"
          >
            <p class="line-clamp-3">
              {{ selectedScenarioDescription }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="scenarioStore.selectedScenario.isPublic"
                class="badge badge-info badge-sm"
              >
                Public
              </span>

              <span v-else class="badge badge-ghost badge-sm"> Private </span>

              <span
                v-if="scenarioStore.selectedScenario.isMature"
                class="badge badge-warning badge-sm"
              >
                Mature
              </span>

              <span
                v-if="scenarioStore.selectedScenario.genres"
                class="badge badge-outline badge-sm"
              >
                {{ scenarioStore.selectedScenario.genres }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="filteredScenarios.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:map" class="h-10 w-10" />

        <p class="text-lg font-bold">No scenarios found.</p>

        <p class="max-w-xl text-sm opacity-70">
          No public or owned scenarios match this gallery.
        </p>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingScenario"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add Scenario
        </button>
      </div>

      <div v-else :class="layoutClass">
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
          :show-choices="showChoices"
          :allow-edit="allowEdit"
          :allow-delete="allowDelete"
          :allow-clone="allowClone"
          @select="selectScenario"
          @edit="startEditingScenarioById"
          @clone="cloneScenarioById"
          @delete="handleScenarioDeleted"
          @choice="handleScenarioChoice"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Scenario } from '~/prisma/generated/prisma/client'
import { useScenarioStore } from '@/stores/scenarioStore'
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
    showInspirations?: boolean
    showChoices?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowClone?: boolean
    allowRefresh?: boolean
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    variant: 'dashboard',
    title: 'Scenarios',
    subtitle: 'Pick a weird little world to ruin beautifully.',
    showHeader: true,
    showImages: true,
    showControls: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    showInspirations: true,
    showChoices: true,
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

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || isDropdownMode.value
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'scenario-row' : 'scenario-grid'
})

const currentUserId = computed(() => {
  return userStore.userId ?? userStore.user?.id ?? null
})

const selectedScenario = computed(() => {
  return scenarioStore.selectedScenario
})

const selectedScenarioTitle = computed(() => {
  return selectedScenario.value?.title || 'No scenario selected'
})

const selectedScenarioDescription = computed(() => {
  return (
    selectedScenario.value?.description ||
    selectedScenario.value?.intros ||
    selectedScenario.value?.locations ||
    'No description yet. The plot goblin remains suspiciously quiet.'
  )
})

const selectedScenarioSubtitle = computed(() => {
  const scenario = selectedScenario.value

  if (!scenario) return 'Choose a scenario or add a new one.'

  return (
    scenario.genres ||
    scenario.locations ||
    scenario.description ||
    'Scenario selected.'
  )
})

const formTitle = computed(() => {
  return formMode.value === 'edit' ? 'Edit Scenario' : 'Add Scenario'
})

const formSubtitle = computed(() => {
  return formMode.value === 'edit'
    ? 'Tune this world before it bites somebody.'
    : 'Create a new narrative playground.'
})

const showMature = computed({
  get: () => userStore.user?.showMature ?? userStore.showMature ?? false,
  set: async (value: boolean) => {
    if (!userStore.user) return

    await userStore.updateUser({ showMature: value })
  },
})

const canEditSelected = computed(() => {
  const scenario = selectedScenario.value

  if (!props.allowEdit || !scenario?.id) return false
  if (userStore.isAdmin) return true

  return scenario.userId === currentUserId.value
})

const galleryScenarios = computed<Scenario[]>(() => {
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

const filteredScenarios = computed<Scenario[]>(() => {
  let scenarios = galleryScenarios.value

  const query = searchQuery.value.trim().toLowerCase()

  if (query) {
    scenarios = scenarios.filter((scenario) => {
      return (
        (scenario.title || '').toLowerCase().includes(query) ||
        (scenario.description || '').toLowerCase().includes(query) ||
        (scenario.intros || '').toLowerCase().includes(query) ||
        (scenario.locations || '').toLowerCase().includes(query) ||
        (scenario.genres || '').toLowerCase().includes(query) ||
        (scenario.inspirations || '').toLowerCase().includes(query) ||
        (scenario.artPrompt || '').toLowerCase().includes(query)
      )
    })
  }

  return scenarios
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

async function selectScenario(id: number) {
  await scenarioStore.selectScenario(id)
}

function selectScenarioFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement

  if (target.value === '__add__') {
    startAddingScenario()
    return
  }

  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    clearSelectedScenario()
    return
  }

  void selectScenario(id)
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

function startEditingScenario() {
  const id = scenarioStore.selectedScenario?.id

  if (!id) return

  void startEditingScenarioById(id)
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

function clearSelectedScenario() {
  scenarioStore.deselectScenario()
  showScenarioForm.value = false
}

function closeScenarioForm() {
  showScenarioForm.value = false
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

function handleScenarioChoice(choice: string) {
  scenarioStore.setCurrentChoice(choice)
}
</script>

<style scoped>
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 1rem;
}

.scenario-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.scenario-row > * {
  min-width: min(280px, 85vw);
  max-width: 360px;
}
</style>
