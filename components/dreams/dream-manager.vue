<!-- /components/dreams/dream-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="isLoadingManager || managerError"
      class="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-sm shadow"
    >
      <p
        class="min-w-0 flex-1 text-base-content/70"
        :class="managerError ? 'text-error' : ''"
      >
        {{ managerError || managerSummary }}
      </p>

      <button
        type="button"
        class="btn btn-sm rounded-2xl"
        :class="managerError ? 'btn-error' : 'btn-ghost'"
        :disabled="isLoadingManager"
        @click="refreshManagerData"
      >
        <Icon
          name="kind-icon:refresh"
          class="h-4 w-4"
          :class="isLoadingManager ? 'animate-spin' : ''"
        />
        Refresh
      </button>
    </div>

    <section
      v-if="activeTab === 'overview'"
      class="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-5"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <dream-gallery
            variant="dropdown"
            :show-header="false"
            :show-controls="false"
            :show-images="true"
            :show-card-actions="false"
            :show-open-button="true"
            :show-stats="true"
            :show-meta="true"
          />
          <dream-list list-type="art" />
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-7"
      >
        <div class="min-h-0 flex-1 overflow-hidden">
          <dream-interact class="h-full min-h-0 overflow-hidden" />
        </div>
      </section>
    </section>

    <section
      v-else-if="activeTab === 'dreams'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        variant="dashboard"
        :show-header="false"
        :show-controls="true"
        :show-images="true"
        :show-card-actions="true"
        :show-open-button="true"
        :show-stats="true"
        :show-meta="true"
      />
    </section>

    <section
      v-else-if="activeTab === 'add'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
    >
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <add-dream @saved="onDreamSaved" @created="onDreamSaved" />
      </div>
    </section>

    <section
      v-else-if="activeTab === 'maker' || activeTab === 'prompts'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-maker
        class="h-full min-h-0 flex-1 overflow-hidden"
        :show-header="false"
        @saved="onDreamMakerSaved"
      />
    </section>

    <section
      v-else-if="activeTab === 'interact'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-interact class="h-full min-h-0 flex-1 overflow-hidden" />
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
import { useCollectionStore } from '@/stores/collectionStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'
import { useUploadStore } from '@/stores/uploadStore'

type DreamTab = 'overview' | 'dreams' | 'add' | 'interact' | 'prompts' | 'maker'

const dreamStore = useDreamStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()
const uploadStore = useUploadStore()
const collectionStore = useCollectionStore()

const defaultDashboardKey = 'dream'
const defaultTab: DreamTab = 'overview'

const validTabs: DreamTab[] = [
  'overview',
  'dreams',
  'add',
  'interact',
  'prompts',
  'maker',
]

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<DreamTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)

  if (validTabs.includes(selectedTab as DreamTab)) {
    return selectedTab as DreamTab
  }

  return defaultTab
})

const selectedTitle = computed(() => {
  return dreamStore.selectedDream?.title || 'No Dream selected'
})

const managerSummary = computed(() => {
  const selected = dreamStore.selectedDream?.title || 'no dream selected'

  return `${dreamStore.activeDreams.length}/${dreamStore.dreams.length} Dreams active. ${scenarioStore.scenarios.length} Scenarios loaded. Current dream: ${selected}.`
})

async function onDreamMakerSaved(ids: number[]) {
  await refreshManagerData()

  const [firstId] = ids

  if (firstId) {
    await dreamStore.selectDreamById(firstId)
  }
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
    applyCollection: async ({ collectionLabel: label }) => {
      await collectionStore.fetchCollections?.()

      const collection = collectionStore.collections.find((item) => {
        return item.label === label
      })

      if (collection?.id) {
        await dreamStore.updateSelectedDream({ artCollectionId: collection.id })
      }
    },
  })
}

async function onDreamSaved() {
  await refreshManagerData()

  if (dreamStore.selectedDream?.id) {
    navStore.setDashboardTab?.(dashboardKey.value, 'interact')
    return
  }

  navStore.setDashboardTab?.(dashboardKey.value, 'dreams')
}

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      dreamStore.initialize(force),
      promptStore.initialize?.(),
      scenarioStore.initialize({
        force,
        fetchRemote: true,
        includeSeeds: true,
      }),
      ...(force || !serverStore.hasLoaded
        ? [serverStore.initialize({ force, fetchRemote: true })]
        : []),
    ])
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load Dream atlas.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

watch(
  () => dreamStore.selectedDream?.id,
  () => {
    setupUploadTarget()
  },
)

onMounted(async () => {
  await loadManagerData()
})
</script>
