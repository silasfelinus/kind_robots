<!-- /components/content/weird/scenario-gallery.vue -->
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

        <span v-if="!isLoading" class="badge badge-ghost shrink-0">
          {{ filteredScenarios.length }}
        </span>
      </div>

      <div
        v-if="showControls"
        class="flex flex-col gap-2 lg:flex-row lg:items-center"
      >
        <select
          v-model="selectedUser"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter scenarios by user"
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
          aria-label="Search scenarios by title"
          placeholder="Search scenarios..."
          class="input input-bordered input-sm w-full bg-base-100"
        />
      </div>

      <div v-if="showToolbar" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingScenario"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add
        </button>

        <button
          v-if="allowEdit"
          class="btn btn-secondary btn-sm rounded-xl"
          type="button"
          :disabled="!scenarioStore.selectedScenario"
          @click="startEditingScenario"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
          Edit
        </button>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="!scenarioStore.selectedScenario"
          @click="clearSelectedScenario"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>

        <button
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading"
          @click="refreshScenarios(true)"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <section
      v-if="showScenarioForm"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-bold text-base-content">
          {{ formTitle }}
        </h3>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          @click="closeScenarioForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <add-scenario v-if="formMode === 'add'" @saved="handleScenarioSaved" />
      <edit-scenario v-else @saved="handleScenarioSaved" />
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
        <p class="text-lg font-bold">{{ errorMessage }}</p>
      </div>

      <div
        v-else-if="filteredScenarios.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:map" class="h-10 w-10" />
        <p class="text-lg font-bold">No scenarios found.</p>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingScenario"
        >
          Add a scenario
        </button>
      </div>

      <div v-else-if="variant === 'dropdown'" class="flex flex-col gap-2">
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
        </select>
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
  </div>
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
    showImages?: boolean
    showControls?: boolean
    showToolbar?: boolean
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
    showImages: true,
    showControls: true,
    showToolbar: true,
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

const selectedUser = ref<string | number>('all')
const searchQuery = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const showScenarioForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const variant = computed(() => props.variant)
const title = computed(() => props.title)
const subtitle = computed(() => props.subtitle)
const showImages = computed(() => props.showImages)
const showControls = computed(() => props.showControls)
const showToolbar = computed(() => props.showToolbar)
const showCardActions = computed(() => props.showCardActions)
const showDescriptions = computed(() => props.showDescriptions)
const showMeta = computed(() => props.showMeta)
const showInspirations = computed(() => props.showInspirations)
const showChoices = computed(() => props.showChoices)
const allowAdd = computed(() => props.allowAdd)
const allowEdit = computed(() => props.allowEdit)
const allowDelete = computed(() => props.allowDelete)
const allowClone = computed(() => props.allowClone)
const allowRefresh = computed(() => props.allowRefresh)

const isCompact = computed(
  () =>
    props.compact || props.variant === 'row' || props.variant === 'dropdown',
)

const formTitle = computed(() =>
  formMode.value === 'edit' ? 'Edit Scenario' : 'Add Scenario',
)

const layoutClass = computed(() =>
  props.variant === 'row' ? 'scenario-row' : 'scenario-grid',
)

const filteredScenarios = computed<Scenario[]>(() => {
  let scenarios = scenarioStore.scenarios

  if (selectedUser.value !== 'all') {
    scenarios = scenarios.filter(
      (scenario) => scenario.userId === Number(selectedUser.value),
    )
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()

    scenarios = scenarios.filter((scenario) =>
      (scenario.title || '').toLowerCase().includes(query),
    )
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
    errorMessage.value = 'Failed to load scenarios. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function selectScenario(id: number) {
  await scenarioStore.selectScenario(id)
}

function selectScenarioFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement
  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    clearSelectedScenario()
    return
  }

  void selectScenario(id)
}

function startAddingScenario() {
  scenarioStore.scenarioForm = {}
  formMode.value = 'add'
  showScenarioForm.value = true
}

function startEditingScenario() {
  const id = scenarioStore.selectedScenario?.id

  if (!id) return

  startEditingScenarioById(id)
}

async function startEditingScenarioById(id: number) {
  const scenario =
    scenarioStore.scenarios.find((entry) => entry.id === id) ??
    (await scenarioStore.fetchScenarioById(id))

  if (!scenario) return

  scenarioStore.scenarioForm = scenarioStore.toScenarioForm(scenario)
  await scenarioStore.selectScenario(id)

  formMode.value = 'edit'
  showScenarioForm.value = true
}

function cloneScenarioById(id: number) {
  const scenario = scenarioStore.scenarios.find((entry) => entry.id === id)

  if (!scenario) return

  scenarioStore.scenarioForm = {
    ...scenarioStore.toScenarioForm(scenario),
    id: undefined,
    title: `Copy of ${scenario.title || 'Untitled Scenario'}`,
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
