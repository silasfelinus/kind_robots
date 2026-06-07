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
      v-else-if="activeTab === 'prompts'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-prompts class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <section
      v-else-if="activeTab === 'art'"
      class="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12"
      @vue:mounted="setupUploadTarget"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-8"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
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

          <div class="mt-4 rounded-2xl border border-base-300 bg-base-200 p-3">
            <image-upload />
          </div>

          <div class="mt-4 rounded-2xl border border-base-300 bg-base-200 p-3">
            <art-gallery :show-header="false" />
          </div>
        </div>
      </section>

      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-4"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
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

          <div class="mt-4">
            <dream-list list-type="art" />
          </div>
        </div>
      </aside>
    </section>

    <section
      v-else-if="activeTab === 'collections'"
      class="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-8"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <div
            class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow"
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

          <div class="mt-4">
            <collection-gallery :show-header="false" />
          </div>
        </div>
      </section>

      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-4"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <dream-list list-type="art" />
        </div>
      </aside>
    </section>

    <section
      v-else-if="activeTab === 'scenarios'"
      class="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-4"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
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
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-8"
      >
        <scenario-gallery
          class="h-full min-h-0 flex-1 overflow-hidden"
          variant="dashboard"
          :show-header="false"
        />
      </section>
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

type DreamTab =
  | 'overview'
  | 'dreams'
  | 'add'
  | 'prompts'
  | 'art'
  | 'builder'
  | 'collections'
  | 'scenarios'
  | 'interact'

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
  'prompts',
  'art',
  'builder',
  'collections',
  'scenarios',
  'interact',
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
