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
    nav-grid-class="sm:grid-cols-3 xl:grid-cols-8"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <section
        v-if="currentTab === 'overview'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <aside class="flex min-h-0 flex-col gap-4 xl:col-span-4">
          <div
            class="rounded-2xl border border-primary/30 bg-primary/10 p-4 shadow"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-primary">
              Current Dream
            </p>

            <h2 class="mt-1 text-2xl font-black text-base-content">
              {{ selectedTitle }}
            </h2>

            <p
              class="mt-2 line-clamp-5 text-sm leading-relaxed text-base-content/70"
            >
              {{ selectedDescription }}
            </p>

            <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div
                v-for="stat in selectedStats"
                :key="stat.label"
                class="rounded-2xl border border-base-300 bg-base-100 p-3"
              >
                <div class="flex items-center gap-2 text-base-content/50">
                  <Icon :name="stat.icon" class="h-4 w-4" />

                  <span class="font-bold uppercase tracking-wide">
                    {{ stat.label }}
                  </span>
                </div>

                <div class="mt-1 text-lg font-black text-secondary">
                  {{ stat.value }}
                </div>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                class="btn btn-sm btn-primary rounded-2xl"
                type="button"
                @click="setTab('dreams')"
              >
                <Icon name="kind-icon:moon" class="h-4 w-4" />
                Dreams
              </button>

              <button
                class="btn btn-sm btn-secondary rounded-2xl"
                type="button"
                @click="setTab('interact')"
              >
                <Icon name="kind-icon:chat" class="h-4 w-4" />
                Interact
              </button>

              <button
                class="btn btn-sm btn-accent rounded-2xl"
                type="button"
                @click="setTab('art')"
              >
                <Icon name="kind-icon:image" class="h-4 w-4" />
                Art
              </button>
            </div>
          </div>

          <dream-gallery
            variant="dropdown"
            :show-header="false"
            :show-controls="true"
            :show-images="true"
            :show-card-actions="false"
            :show-open-button="false"
            :show-stats="true"
            :show-meta="true"
            :compact="true"
          />

          <scenario-gallery
            variant="dropdown"
            :show-header="false"
            :show-controls="false"
            :show-images="true"
            :show-card-actions="false"
            :show-inspirations="false"
            :show-choices="false"
            :show-meta="false"
            :compact="true"
          />

          <server-gallery
            mode="text"
            variant="dropdown"
            :show-header="false"
            :show-controls="false"
            :show-card-actions="false"
            :show-descriptions="true"
            :show-meta="true"
            :show-capabilities="false"
            :show-use-buttons="false"
            :show-workflow="false"
            :show-defaults="false"
            :show-status="false"
            :allow-add="false"
            :allow-edit="false"
            :allow-delete="false"
            :allow-test="false"
          />
        </aside>

        <div class="min-h-0 xl:col-span-8">
          <dream-interact />
        </div>
      </section>

      <dream-gallery
        v-else-if="currentTab === 'dreams'"
        variant="dashboard"
        :show-header="false"
        :show-controls="true"
        :show-images="true"
        :show-card-actions="true"
        :show-open-button="true"
        :show-stats="true"
        :show-meta="true"
      />

      <dream-prompts v-else-if="currentTab === 'prompts'" />

      <section
        v-else-if="currentTab === 'art'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="min-h-0 xl:col-span-8">
          <div
            class="mb-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-primary">
              Dream Art
            </p>

            <h2 class="text-2xl font-black text-base-content">
              Visuals for {{ selectedTitle }}
            </h2>

            <p class="mt-2 text-sm text-base-content/70">
              Choose or generate the current image for the dream.
            </p>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <art-gallery :show-header="false" />
          </div>
        </div>

        <aside class="flex min-h-0 flex-col gap-4 xl:col-span-4">
          <server-gallery
            mode="art"
            variant="dropdown"
            :show-header="false"
            :show-controls="false"
            :show-card-actions="false"
            :show-descriptions="true"
            :show-meta="true"
            :show-capabilities="false"
            :show-use-buttons="false"
            :show-workflow="false"
            :show-defaults="false"
            :show-status="false"
            :allow-add="false"
            :allow-edit="false"
            :allow-delete="false"
            :allow-test="false"
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
            :show-header="true"
            :show-controls="false"
            :show-card-actions="false"
            :show-descriptions="true"
            :show-meta="true"
            :show-capabilities="false"
            :show-use-buttons="false"
            :show-workflow="false"
            :show-defaults="false"
            :show-status="false"
            :allow-add="false"
            :allow-edit="false"
            :allow-delete="false"
            :allow-test="false"
          />

          <server-gallery
            mode="art"
            variant="dropdown"
            title="Art Server"
            subtitle="Choose the image engine for dream visuals."
            :show-header="true"
            :show-controls="false"
            :show-card-actions="false"
            :show-descriptions="true"
            :show-meta="true"
            :show-capabilities="false"
            :show-use-buttons="false"
            :show-workflow="false"
            :show-defaults="false"
            :show-status="false"
            :allow-add="false"
            :allow-edit="false"
            :allow-delete="false"
            :allow-test="false"
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
import { computed, onMounted, ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'

const dashboardKey = 'dream' as const

const dreamStore = useDreamStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const selectedTitle = computed(() => {
  return dreamStore.selectedDream?.title || 'No Dream selected'
})

const selectedDescription = computed(() => {
  return (
    dreamStore.selectedDream?.description ||
    dreamStore.selectedDream?.currentVibe ||
    'Choose a Dream from the gallery to inspect its art, collections, scenario, prompts, and chat.'
  )
})

const selectedStats = computed(() => [
  {
    label: 'Cast',
    value:
      dreamStore.selectedDream?._count?.Characters ??
      dreamStore.selectedDreamCast.length,
    icon: 'kind-icon:users',
  },
  {
    label: 'Items',
    value:
      dreamStore.selectedDream?._count?.Rewards ??
      dreamStore.selectedDreamItems.length,
    icon: 'kind-icon:gift',
  },
  {
    label: 'Art',
    value: dreamStore.selectedDreamCollectionArt.length,
    icon: 'kind-icon:image',
  },
  {
    label: 'Chats',
    value:
      dreamStore.selectedDream?._count?.Chats ??
      dreamStore.selectedDreamChats.length,
    icon: 'kind-icon:chat',
  },
])

const managerSummary = computed(() => {
  const dreamCount = dreamStore.dreams.length
  const activeCount = dreamStore.activeDreams.length
  const scenarioCount = scenarioStore.scenarios.length
  const selected = dreamStore.selectedDream?.title || 'no dream selected'

  return `${activeCount}/${dreamCount} Dreams active. ${scenarioCount} Scenarios loaded. Current dream: ${selected}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)

  if (tab === 'art') {
    serverStore.setCurrentServerMode('art')
    return
  }

  if (
    tab === 'overview' ||
    tab === 'prompts' ||
    tab === 'servers' ||
    tab === 'interact'
  ) {
    serverStore.setCurrentServerMode('text')
    return
  }

  serverStore.setCurrentServerMode('selected')
}

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await navStore.initialize()

    await Promise.all([
      dreamStore.initialize(force),
      promptStore.initialize?.(),
      scenarioStore.initialize({
        force,
        fetchRemote: true,
        includeSeeds: true,
      }),
      serverStore.initialize({
        force,
        fetchRemote: true,
      }),
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
