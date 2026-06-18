<!-- /components/dreams/dream-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="isLoadingManager || managerError"
      class="mb-2 flex shrink-0 items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-3 py-2 text-xs shadow-sm"
      :class="managerError ? 'border-error/40 bg-error/10 text-error' : 'text-base-content/60'"
    >
      <span
        v-if="isLoadingManager"
        class="loading loading-spinner loading-xs text-primary"
      />

      <Icon
        v-else
        name="kind-icon:warning"
        class="h-4 w-4 shrink-0 text-error"
      />

      <p class="min-w-0 flex-1 truncate">
        {{ managerError || managerSummary }}
      </p>

      <button
        type="button"
        class="btn btn-ghost btn-xs tooltip tooltip-left shrink-0 rounded-xl"
        :class="managerError ? 'text-error' : ''"
        :disabled="isLoadingManager"
        data-tip="Refresh Dream workspace"
        aria-label="Refresh Dream workspace"
        @click="refreshManagerData"
      >
        <Icon name="kind-icon:refresh" class="h-4 w-4" />
      </button>
    </div>

    <section
      v-if="activeTab === 'dreammaker'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-maker
        class="h-full min-h-0 flex-1 overflow-hidden"
        @saved="onDreamSaved"
        @created="onDreamSaved"
      />
    </section>

    <section
      v-else-if="activeTab === 'interact' && dreamStore.selectedDream"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-interact class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <section
      v-else
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        variant="dashboard"
        title="Dreams"
        subtitle="Search, filter, and select a Dream. Selection opens the workspace."
        :show-header="true"
        :show-controls="true"
        :show-images="true"
        :show-card-actions="true"
        :show-stats="true"
        :show-meta="true"
        :show-descriptions="false"
        :allow-add="true"
        :allow-edit="true"
        :allow-delete="false"
        :allow-refresh="true"
        :open-on-select="true"
        @selected="onDreamSelected"
        @opened="onDreamOpened"
        @editing="onDreamEditing"
        @created="onDreamCreated"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'
import { useUploadStore } from '@/stores/uploadStore'

type DreamTab = 'dreams' | 'interact' | 'dreammaker'
type LegacyDreamTab =
  | DreamTab
  | 'overview'
  | 'gallery'
  | 'add'
  | 'maker'
  | 'prompts'
  | 'brainstorm'

const dreamStore = useDreamStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()
const uploadStore = useUploadStore()
const collectionStore = useCollectionStore()
const artStore = useArtStore()

const dashboardKey = 'dream'
const defaultTab: DreamTab = 'dreams'

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const activeTab = computed<DreamTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey) as LegacyDreamTab
  const normalized = normalizeTab(selectedTab)

  if (normalized === 'interact' && !dreamStore.selectedDream) {
    return 'dreams'
  }

  return normalized
})

const managerSummary = computed(() => {
  const selected = dreamStore.selectedDream?.title || 'no Dream selected'

  return `${dreamStore.activeDreams.length}/${dreamStore.dreams.length} active Dreams • ${scenarioStore.scenarios.length} Scenarios • ${selected}`
})

function normalizeTab(tab?: LegacyDreamTab | string | null): DreamTab {
  if (tab === 'interact') {
    return 'interact'
  }

  if (tab === 'add' || tab === 'maker' || tab === 'dreammaker') {
    return 'dreammaker'
  }

  return defaultTab
}

function setTab(tab: DreamTab) {
  navStore.setDashboardTab?.(dashboardKey, tab)
}

function onDreamSelected() {
  setupUploadTarget()
}

function onDreamOpened() {
  setupUploadTarget()
  setTab('interact')
}

function onDreamEditing() {
  setupUploadTarget()
  setTab('dreammaker')
}

function onDreamCreated() {
  setTab('dreammaker')
}

async function onDreamSaved(id?: number | number[] | DreamWithRelations) {
  await loadManagerData(true)

  const selectedId = resolveSavedDreamId(id)

  if (selectedId) {
    await dreamStore.selectDreamById(selectedId)
    setupUploadTarget()
    setTab('interact')
    return
  }

  setTab('dreams')
}

function resolveSavedDreamId(value?: number | number[] | DreamWithRelations) {
  if (typeof value === 'number') return value

  if (Array.isArray(value)) {
    const [firstId] = value
    return typeof firstId === 'number' ? firstId : null
  }

  return typeof value?.id === 'number' ? value.id : null
}

function setupUploadTarget() {
  const dream = dreamStore.selectedDream
  if (!dream) return

  const collectionLabel =
    dream.ArtCollection?.label || dream.title || `Dream ${dream.id}`

  uploadStore.setTarget({
    model: 'Dream',
    modelId: dream.id,
    collectionLabel,
    buttonLabel: 'Upload to Dream',
    icon: 'kind-icon:camera',
    applyCollection: async ({
      collectionLabel: label,
    }: {
      collectionLabel: string
    }) => {
      await collectionStore.fetchCollections?.()

      const collection = collectionStore.collections.find(
        (item: { id?: number; label?: string | null }) => item.label === label,
      )

      if (collection?.id) {
        await dreamStore.updateSelectedDream({ artCollectionId: collection.id })
      }
    },
  })
}

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      dreamStore.initialize({ force, fetchRemote: true }),
      promptStore.initialize?.(),
      scenarioStore.initialize({
        force,
        fetchRemote: true,
        includeSeeds: true,
      }),
      artStore.initialize?.({
        force,
        hydrateImages: false,
        initializeServerStore: false,
      }),
      collectionStore.fetchCollections(force, {
        includeImages: true,
        imageLimit: 80,
      }),
      ...(force || !serverStore.hasLoaded
        ? [serverStore.initialize({ force, fetchRemote: true })]
        : []),
    ])

    setupUploadTarget()
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load Dream workspace.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

watch(
  () => dreamStore.selectedDream?.id,
  () => setupUploadTarget(),
)

onMounted(async () => {
  await loadManagerData()
})
</script>
