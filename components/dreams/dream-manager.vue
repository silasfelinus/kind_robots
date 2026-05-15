<!-- /components/dreams/dream-manager.vue -->
<template>
  <dashboard-shell
    title="Dream Atlas"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Mapping dreamhouses, suspicious doors, and plot-adjacent furniture..."
    nav-grid-class="sm:grid-cols-3 xl:grid-cols-7"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <dream-gallery
        v-if="currentTab === 'dreams'"
        variant="dashboard"
        :show-header="false"
        :show-controls="true"
        :show-images="true"
        :show-card-actions="true"
        :show-open-button="true"
        :show-stats="true"
        :show-meta="true"
      />

      <add-dream
        v-else-if="currentTab === 'add'"
        @saved="onDreamSaved"
        @created="onDreamSaved"
      />

      <dream-prompts v-else-if="currentTab === 'prompts'" />

      <section
        v-else-if="currentTab === 'art'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="flex min-h-0 flex-col gap-4 xl:col-span-8">
          <div
            class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-primary">
              Dream Art
            </p>

            <h2 class="text-2xl font-black text-base-content">
              Visuals for {{ selectedTitle }}
            </h2>

            <p class="mt-2 text-sm text-base-content/70">
              Upload images, browse the gallery, or generate art for this dream.
            </p>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <image-upload />
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <art-gallery :show-header="false" />
          </div>
        </div>

        <aside class="flex min-h-0 flex-col gap-4 xl:col-span-4">
          <collection-gallery
            variant="dropdown"
            :show-header="true"
            :show-controls="false"
            :allow-add="true"
            :allow-edit="false"
            :allow-delete="false"
            :allow-merge="false"
            :allow-refresh="false"
          />

          <server-gallery
            mode="art"
            variant="dropdown"
            v-bind="readonlyServerGalleryProps"
          />

          <dream-list list-type="art" />
        </aside>
      </section>

      <section
        v-else-if="currentTab === 'collections'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="min-h-0 xl:col-span-8">
          <div
            class="mb-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-primary">
              Collections
            </p>

            <h2 class="text-2xl font-black text-base-content">
              Dream Collections
            </h2>

            <p class="mt-2 text-sm text-base-content/70">
              Manage shared art collections connected to the dream.
            </p>
          </div>

          <collection-gallery :show-header="false" />
        </div>

        <aside class="min-h-0 xl:col-span-4">
          <dream-list list-type="art" />
        </aside>
      </section>

      <section
        v-else-if="currentTab === 'scenarios'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="xl:col-span-4">
          <div
            class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-primary">
              Scenario Link
            </p>

            <h2 class="text-2xl font-black text-base-content">
              Scenario in Dream
            </h2>

            <p class="mt-2 text-sm leading-relaxed text-base-content/70">
              Dream is the place. Scenario is what happens there.
            </p>

            <div
              v-if="dreamStore.selectedDream?.Scenario"
              class="mt-4 rounded-2xl border border-secondary/30 bg-secondary/10 p-3"
            >
              <p
                class="text-xs font-bold uppercase tracking-wide text-secondary"
              >
                Attached Scenario
              </p>

              <h3 class="mt-1 text-lg font-black text-base-content">
                {{
                  dreamStore.selectedDream.Scenario.title || 'Untitled Scenario'
                }}
              </h3>

              <p class="mt-2 line-clamp-5 text-sm text-base-content/70">
                {{
                  dreamStore.selectedDream.Scenario.description ||
                  'No scenario description yet.'
                }}
              </p>
            </div>

            <div
              v-else
              class="mt-4 rounded-2xl border border-dashed border-base-300 bg-base-200 p-3 text-sm text-base-content/60"
            >
              No scenario attached yet.
            </div>
          </div>
        </div>

        <div class="min-h-0 xl:col-span-8">
          <scenario-gallery variant="dashboard" :show-header="false" />
        </div>
      </section>

      <section
        v-else-if="currentTab === 'servers'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="flex min-h-0 flex-col gap-4 xl:col-span-5">
          <server-gallery
            mode="text"
            variant="dropdown"
            title="Text Server"
            subtitle="Choose the chat engine for this dream."
            v-bind="{ ...readonlyServerGalleryProps, showHeader: true }"
          />

          <server-gallery
            mode="art"
            variant="dropdown"
            title="Art Server"
            subtitle="Choose the image engine for dream visuals."
            v-bind="{ ...readonlyServerGalleryProps, showHeader: true }"
          />
        </div>

        <div class="min-h-0 xl:col-span-7">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <server-interact />
          </div>
        </div>
      </section>

      <dream-interact v-else-if="currentTab === 'interact'" />

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown Dream tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
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

const dashboardKey = 'dream' as const

const dreamStore = useDreamStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()
const uploadStore = useUploadStore()
const collectionStore = useCollectionStore()

const readonlyServerGalleryProps = {
  showHeader: false,
  showControls: false,
  showCardActions: false,
  showDescriptions: true,
  showMeta: true,
  showCapabilities: false,
  showUseButtons: false,
  showWorkflow: false,
  showDefaults: false,
  showStatus: false,
  allowAdd: false,
  allowEdit: false,
  allowDelete: false,
  allowTest: false,
} as const

const SERVER_MODE_BY_TAB: Record<string, 'art' | 'text' | 'selected'> = {
  add: 'selected',
  art: 'art',
  prompts: 'text',
  servers: 'text',
  interact: 'text',
  dreams: 'selected',
  collections: 'selected',
  scenarios: 'selected',
}

const tabs = computed(() => {
  const baseTabs = navStore
    .getDashboardTabs(dashboardKey)
    .filter((tab) => tab.key !== 'overview')

  if (baseTabs.some((tab) => tab.key === 'add')) return baseTabs

  return [
    ...baseTabs,
    {
      key: 'add',
      label: 'Add Dream',
      icon: 'kind-icon:plus',
      description: 'Create or edit a Dream location.',
    },
  ]
})

const fallbackTab = computed(() =>
  dreamStore.selectedDream?.id ? 'interact' : 'dreams',
)

const activeTab = computed(() => {
  const storedTab = navStore.getDashboardTab(dashboardKey)
  const validTabs = tabs.value.map((tab) => tab.key)

  if (storedTab === 'overview') return fallbackTab.value
  if (!validTabs.includes(storedTab)) return fallbackTab.value

  return storedTab
})

const selectedTitle = computed(
  () => dreamStore.selectedDream?.title || 'No Dream selected',
)

const managerSummary = computed(() => {
  const selected = dreamStore.selectedDream?.title || 'no dream selected'
  return `${dreamStore.activeDreams.length}/${dreamStore.dreams.length} Dreams active. ${scenarioStore.scenarios.length} Scenarios loaded. Current dream: ${selected}.`
})

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

      const collection = collectionStore.collections.find(
        (item) => item.label === label,
      )

      if (collection?.id) {
        await dreamStore.updateSelectedDream({ artCollectionId: collection.id })
      }
    },
  })
}

watch(
  () => dreamStore.selectedDream?.id,
  () => {
    if (activeTab.value === 'art') setupUploadTarget()
  },
)

function setTab(tab: string) {
  const requestedTab = tab === 'overview' ? fallbackTab.value : tab
  const validTabs = tabs.value.map((item) => item.key)
  const nextTab = validTabs.includes(requestedTab)
    ? requestedTab
    : fallbackTab.value

  navStore.setDashboardTab(dashboardKey, nextTab)
  serverStore.setCurrentServerMode(SERVER_MODE_BY_TAB[nextTab] ?? 'selected')

  if (nextTab === 'art') setupUploadTarget()
}

async function onDreamSaved() {
  await refreshManagerData()
  if (dreamStore.selectedDream?.id) {
    setTab('interact')
  } else {
    setTab('dreams')
  }
}

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await navStore.initialize() // sequential

    await Promise.all([
      dreamStore.initialize(force),
      promptStore.initialize?.(),
      scenarioStore.initialize({
        force,
        fetchRemote: true,
        includeSeeds: true,
      }),
      serverStore.initialize({ force, fetchRemote: true }), // ← no hasLoaded guard
    ])

    setTab(activeTab.value)
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

onMounted(async () => {
  await loadManagerData()
})
</script>
