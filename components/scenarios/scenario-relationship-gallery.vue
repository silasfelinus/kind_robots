<!-- /components/scenarios/scenario-relationship-gallery.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3">
    <header class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-black text-base-content">{{ title }}</h2>
          <p class="truncate text-sm text-base-content/60">{{ subtitleLine }}</p>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <span class="badge badge-ghost">{{ filteredScenarios.length }}</span>
          <span v-if="resolvedDreamId" class="badge badge-primary badge-sm rounded-xl">
            Dream #{{ resolvedDreamId }}
          </span>

          <select
            v-model="localRelationMode"
            class="select select-bordered select-sm rounded-2xl bg-base-200"
            aria-label="Scenario relationship mode"
          >
            <option value="connected">Connected</option>
            <option value="available">Available</option>
            <option value="all">All</option>
          </select>

          <button
            v-if="allowAdd"
            type="button"
            class="btn btn-primary btn-sm rounded-xl"
            @click="startAddingScenario"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      <label class="input input-bordered input-sm mt-3 flex items-center gap-2 rounded-2xl bg-base-200">
        <Icon name="kind-icon:search" class="h-4 w-4 opacity-50" />
        <input
          v-model="searchQuery"
          type="search"
          aria-label="Search scenarios"
          placeholder="Search scenarios..."
          class="grow bg-transparent"
        />
      </label>
    </header>

    <section
      v-if="showScenarioForm"
      class="shrink-0 rounded-2xl border border-primary/30 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <h3 class="truncate text-base font-black text-primary">
          {{ formMode === 'edit' ? 'Edit Scenario' : 'Add Scenario' }}
        </h3>

        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl"
          @click="showScenarioForm = false"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <add-scenario :mode="formMode" @saved="handleScenarioSaved" />
    </section>

    <section class="min-h-0 flex-1 overflow-y-auto">
      <div v-if="isLoading" class="flex h-full min-h-48 items-center justify-center">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="!resolvedDreamId && requireDreamContext"
        class="flex h-full min-h-48 flex-col gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-3"
      >
        <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <h3 class="font-black text-warning">Choose a Dream first</h3>
          <p class="mt-1 text-sm text-base-content/70">
            This Scenario view needs a Dream anchor before it can show useful relationships.
          </p>
        </div>

        <dream-gallery
          class="min-h-0 flex-1"
          variant="dropdown"
          :open-on-select="false"
          :show-card-actions="false"
          :show-pitch-sheet-preview="false"
          @selected="handleContextDreamSelected"
        />
      </div>

      <div
        v-else-if="filteredScenarios.length === 0"
        class="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200/50 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:map" class="h-10 w-10 opacity-50" />
        <div>
          <p class="font-bold">{{ emptyTitle }}</p>
          <p class="mt-1 text-sm opacity-70">{{ emptySubtitle }}</p>
        </div>

        <button
          v-if="allowAdd && !searchQuery"
          type="button"
          class="btn btn-primary btn-sm rounded-xl"
          @click="startAddingScenario"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add Scenario
        </button>
      </div>

      <div v-else class="scenario-grid">
        <ScenarioCard
          v-for="scenario in filteredScenarios"
          :key="scenario.id"
          :scenario="scenario"
          :selected="scenarioStore.selectedScenario?.id === scenario.id"
          :show-image="showImages"
          :compact="compact"
          :show-actions="showCardActions"
          :show-description="showDescriptions"
          :show-meta="showMeta"
          :show-inspirations="showInspirations"
          :allow-edit="allowEdit"
          :allow-delete="allowDelete"
          :allow-clone="allowClone"
          @choose="selectScenarioCard"
          @edit="startEditingScenarioById"
          @clone="cloneScenarioById"
          @delete="handleScenarioDeleted"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { DreamWithRelations } from '@/stores/dreamStore'
import type { ScenarioWithRelations } from '@/stores/scenarioStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

type RelationMode = 'all' | 'connected' | 'available'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    relationMode?: RelationMode
    contextDreamId?: number | null
    requireDreamContext?: boolean
    showImages?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showInspirations?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowClone?: boolean
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    title: 'Scenarios',
    subtitle: 'Scenarios connected to the active Dream.',
    relationMode: 'connected',
    contextDreamId: null,
    requireDreamContext: true,
    showImages: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    showInspirations: false,
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    allowClone: true,
    compact: false,
    autoLoad: true,
  },
)

const emit = defineEmits<{
  selected: [scenario: ScenarioWithRelations]
  editing: [scenario: ScenarioWithRelations]
  created: []
}>()

const scenarioStore = useScenarioStore()
const userStore = useUserStore()
const workspaceStore = useWorkspaceStore()

const searchQuery = ref('')
const isLoading = ref(false)
const showScenarioForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const localRelationMode = ref<RelationMode>(props.relationMode)

const resolvedDreamId = computed(() => {
  const explicitId = Number(props.contextDreamId)
  if (Number.isInteger(explicitId) && explicitId > 0) return explicitId

  const workspaceId = Number(workspaceStore.dreamId)
  if (Number.isInteger(workspaceId) && workspaceId > 0) return workspaceId

  return null
})

const subtitleLine = computed(() => {
  if (localRelationMode.value === 'connected' && resolvedDreamId.value) {
    return `Showing Scenarios connected to Dream #${resolvedDreamId.value}.`
  }

  if (localRelationMode.value === 'available' && resolvedDreamId.value) {
    return `Showing Scenarios available to connect to Dream #${resolvedDreamId.value}.`
  }

  return props.subtitle
})

const visibleScenarios = computed<ScenarioWithRelations[]>(() => {
  let scenarios = scenarioStore.scenarios
  const currentUserId = userStore.userId ?? userStore.user?.id ?? null
  const showMature = userStore.user?.showMature ?? userStore.showMature ?? false

  if (!userStore.isAdmin) {
    scenarios = scenarios.filter((scenario) => {
      return scenario.isPublic || (currentUserId !== null && scenario.userId === currentUserId)
    })
  }

  if (!showMature) {
    scenarios = scenarios.filter((scenario) => !scenario.isMature)
  }

  return scenarios
})

const relationScenarios = computed<ScenarioWithRelations[]>(() => {
  if (localRelationMode.value === 'all') return visibleScenarios.value
  if (!resolvedDreamId.value) return []

  return visibleScenarios.value.filter((scenario) => {
    const dreamIds = scenario.Dreams?.map((dream) => dream.id) ?? []
    const connected = dreamIds.includes(resolvedDreamId.value!)

    return localRelationMode.value === 'connected' ? connected : !connected
  })
})

const filteredScenarios = computed<ScenarioWithRelations[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) return relationScenarios.value

  return relationScenarios.value.filter((scenario) => {
    return scenarioSearchText(scenario).toLowerCase().includes(query)
  })
})

const emptyTitle = computed(() => {
  if (searchQuery.value) return 'No scenarios match your search.'
  if (localRelationMode.value === 'connected') return 'No connected scenarios yet.'
  if (localRelationMode.value === 'available') return 'No available scenarios to connect.'
  return 'No scenarios yet.'
})

const emptySubtitle = computed(() => {
  if (searchQuery.value) return 'Try fewer or stranger words.'
  if (localRelationMode.value === 'connected') return 'Create one here or switch to Available.'
  if (localRelationMode.value === 'available') return 'Everything visible is already connected or filtered out.'
  return 'Every weird little world starts somewhere.'
})

watch(
  () => props.relationMode,
  (mode) => {
    localRelationMode.value = mode
  },
)

onMounted(async () => {
  workspaceStore.hydrate()

  if (props.autoLoad) {
    await refreshScenarios()
  }
})

async function refreshScenarios(force = false) {
  isLoading.value = true

  try {
    await scenarioStore.initialize({
      force,
      fetchRemote: true,
      includeSeeds: true,
    })
  } finally {
    isLoading.value = false
  }
}

function startAddingScenario() {
  scenarioStore.deselectScenario()

  const dreamId = resolvedDreamId.value

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
    dreamIds: dreamId ? [dreamId] : [],
  }

  formMode.value = 'add'
  showScenarioForm.value = true
  emit('created')
}

async function startEditingScenarioById(id: number) {
  const scenario =
    scenarioStore.scenarios.find((entry) => entry.id === id) ??
    (await scenarioStore.fetchScenarioById(id))

  if (!scenario) return

  await selectScenarioById(id)
  scenarioStore.scenarioForm = scenarioStore.toScenarioForm(scenario)
  formMode.value = 'edit'
  showScenarioForm.value = true
  emit('editing', scenario)
}

function cloneScenarioById(id: number) {
  const scenario = scenarioStore.scenarios.find((entry) => entry.id === id)
  if (!scenario) return

  const dreamId = resolvedDreamId.value

  scenarioStore.deselectScenario()
  scenarioStore.scenarioForm = {
    ...scenarioStore.toScenarioForm(scenario),
    id: undefined,
    title: `Copy of ${scenario.title || 'Untitled Scenario'}`,
    isPublic: false,
    dreamIds: dreamId ? [dreamId] : scenario.Dreams?.map((dream) => dream.id) ?? [],
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
    workspaceStore.clearScenario()
  }
}

async function selectScenarioCard(scenario: ScenarioWithRelations) {
  await selectScenarioById(scenario.id)
}

async function selectScenarioById(id: number) {
  const scenario = await scenarioStore.selectScenario(id)
  if (!scenario) return

  workspaceStore.openScenario(id, resolvedDreamId.value)
  emit('selected', scenario)
}

function handleContextDreamSelected(dream: DreamWithRelations) {
  workspaceStore.openDream(dream.id, 'scenarios')
}

function scenarioSearchText(scenario: ScenarioWithRelations) {
  const dreamText = scenario.Dreams?.map((dream) => dream.title || dream.slug || '').join(' ') ?? ''
  const characterText =
    scenario.Characters?.map((character) =>
      [character.name, character.honorific, character.title, character.role, character.class, character.species, character.genre]
        .filter(Boolean)
        .join(' '),
    ).join(' ') ?? ''

  return [
    scenario.title,
    scenario.description,
    scenario.locations,
    scenario.genres,
    scenario.inspirations,
    dreamText,
    characterText,
  ]
    .filter(Boolean)
    .join(' ')
}
</script>

<style scoped>
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
  gap: 1rem;
  align-items: start;
}
</style>
