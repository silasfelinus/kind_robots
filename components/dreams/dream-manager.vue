<!-- /components/dreams/dream-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <header
      class="mb-3 flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow md:flex-row md:items-center md:justify-between"
    >
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <Icon name="kind-icon:dream" class="h-6 w-6 text-primary" />
          <h1 class="text-xl font-black text-primary">Dreams</h1>
          <span class="badge badge-outline rounded-xl">{{ activeLabel }}</span>
        </div>

        <p
          class="mt-1 text-sm text-base-content/65"
          :class="managerError ? 'text-error' : ''"
        >
          {{ managerError || managerSummary }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="tab in visibleTabs"
          :key="tab.key"
          type="button"
          class="btn btn-sm rounded-2xl"
          :class="
            activeTab === tab.key ? 'btn-primary text-white' : 'btn-ghost'
          "
          @click="setTab(tab.key)"
        >
          <Icon :name="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>

        <button
          type="button"
          class="btn btn-sm rounded-2xl"
          :class="managerError ? 'btn-error' : 'btn-outline'"
          :disabled="isLoadingManager"
          @click="refreshManagerData"
        >
          <span
            v-if="isLoadingManager"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <section
      v-if="activeTab === 'dreams'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        variant="dashboard"
        :show-header="false"
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
        @selected="onDreamSelected"
        @opened="onDreamOpened"
        @editing="onDreamEditing"
      />
    </section>

    <section
      v-else-if="activeTab === 'interact'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-interact class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <section
      v-else-if="activeTab === 'dreammaker'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-maker
        class="h-full min-h-0 flex-1 overflow-hidden"
        @saved="onDreamSaved"
        @created="onDreamSaved"
      />
    </section>

    <section
      v-else-if="activeTab === 'brainstorm'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-brainstorm
        class="h-full min-h-0 flex-1 overflow-hidden"
        @saved="onBrainstormSaved"
      />
    </section>

    <div
      v-else
      class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Unknown Dream tab: {{ activeTab }}
    </div>
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

type DreamTab = 'dreams' | 'interact' | 'dreammaker' | 'brainstorm'
type LegacyDreamTab =
  | DreamTab
  | 'overview'
  | 'gallery'
  | 'add'
  | 'maker'
  | 'prompts'

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

const visibleTabs: { key: DreamTab; label: string; icon: string }[] = [
  { key: 'dreams', label: 'Dreams', icon: 'kind-icon:grid' },
  { key: 'interact', label: 'Interact', icon: 'kind-icon:chat' },
  { key: 'dreammaker', label: 'Dreammaker', icon: 'kind-icon:wand' },
  { key: 'brainstorm', label: 'Brainstorm', icon: 'kind-icon:sparkles' },
]

const activeTab = computed<DreamTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey) as LegacyDreamTab
  return normalizeTab(selectedTab)
})

const activeLabel = computed(() => {
  return (
    visibleTabs.find((tab) => tab.key === activeTab.value)?.label ?? 'Dreams'
  )
})

const managerSummary = computed(() => {
  const selected = dreamStore.selectedDream?.title || 'no Dream selected'

  return `${dreamStore.activeDreams.length}/${dreamStore.dreams.length} Dreams active. ${scenarioStore.scenarios.length} Scenarios loaded. Current Dream: ${selected}.`
})

function normalizeTab(tab?: LegacyDreamTab | string | null): DreamTab {
  if (tab === 'overview' || tab === 'gallery' || tab === 'dreams') {
    return 'dreams'
  }

  if (tab === 'interact') {
    return 'interact'
  }

  if (tab === 'add' || tab === 'maker' || tab === 'dreammaker') {
    return 'dreammaker'
  }

  if (tab === 'prompts' || tab === 'brainstorm') {
    return 'brainstorm'
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

async function onDreamSaved(id: number | number[] | DreamWithRelations) {
  await loadManagerData(true)

  const selectedId = resolveSavedDreamId(id)

  if (selectedId) {
    await dreamStore.selectDreamById(selectedId)
  }

  setTab('dreams')
}

async function onBrainstormSaved(ids: number[]) {
  await loadManagerData(true)

  const [firstId] = ids

  if (firstId) {
    await dreamStore.selectDreamById(firstId)
  }

  setTab('dreams')
}

function resolveSavedDreamId(value: number | number[] | DreamWithRelations) {
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
