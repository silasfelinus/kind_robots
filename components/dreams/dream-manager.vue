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
    nav-grid-class="sm:grid-cols-3 xl:grid-cols-9"
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
              Current Location
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
                @click="setTab('about')"
              >
                <Icon name="kind-icon:pencil" class="h-4 w-4" />
                Edit
              </button>

              <button
                class="btn btn-sm btn-secondary rounded-2xl"
                type="button"
                @click="setTab('chat')"
              >
                <Icon name="kind-icon:chat" class="h-4 w-4" />
                Enter
              </button>

              <button
                class="btn btn-sm btn-accent rounded-2xl"
                type="button"
                @click="setTab('scene')"
              >
                <Icon name="kind-icon:image" class="h-4 w-4" />
                Assets
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
        </aside>

        <div class="min-h-0 xl:col-span-8">
          <dream-interact />
        </div>
      </section>

      <add-dream
        v-else-if="currentTab === 'about'"
        mode="edit"
        @saved="handleDreamSaved"
      />

      <dream-gallery
        v-else-if="currentTab === 'atlas'"
        variant="dashboard"
        :show-header="false"
        :show-controls="true"
        :show-images="true"
        :show-card-actions="true"
        :show-open-button="true"
        :show-stats="true"
        :show-meta="true"
      />

      <section
        v-else-if="currentTab === 'scene'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="min-h-0 xl:col-span-8">
          <div
            class="mb-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-primary">
              Scene Assets
            </p>

            <h2 class="text-2xl font-black text-base-content">
              Visuals for {{ selectedTitle }}
            </h2>

            <p class="mt-2 text-sm text-base-content/70">
              Generate or select art assets, then connect them to the Dream
              collection so the location has a visual memory.
            </p>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <art-gallery :show-header="false" />
          </div>
        </div>

        <aside class="flex min-h-0 flex-col gap-4 xl:col-span-4">
          <dream-list list-type="art" />

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <collection-gallery :show-header="false" />
          </div>
        </aside>
      </section>

      <section
        v-else-if="currentTab === 'cast'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="min-h-0 xl:col-span-7">
          <div
            class="mb-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-primary">
              Cast
            </p>

            <h2 class="text-2xl font-black text-base-content">
              Who belongs in {{ selectedTitle }}?
            </h2>

            <p class="mt-2 text-sm text-base-content/70">
              Characters can be residents, visitors, guides, rivals, hazards,
              witnesses, or extremely suspicious furniture critics.
            </p>
          </div>

          <character-gallery variant="dashboard" :show-header="false" />
        </div>

        <aside class="min-h-0 xl:col-span-5">
          <dream-list list-type="cast" />
        </aside>
      </section>

      <section
        v-else-if="currentTab === 'items'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="min-h-0 xl:col-span-7">
          <div
            class="mb-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-primary">
              Items
            </p>

            <h2 class="text-2xl font-black text-base-content">
              What can be found in {{ selectedTitle }}?
            </h2>

            <p class="mt-2 text-sm text-base-content/70">
              Rewards become location items, tools, artifacts, keys, plot
              twists, suspicious snacks, and other beautiful narrative
              contraband.
            </p>
          </div>

          <reward-gallery variant="dashboard" :show-header="false" />
        </div>

        <aside class="min-h-0 xl:col-span-5">
          <dream-list list-type="items" />
        </aside>
      </section>

      <section
        v-else-if="currentTab === 'plot'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="xl:col-span-4">
          <div
            class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-primary">
              Plot Layer
            </p>

            <h2 class="text-2xl font-black text-base-content">
              Scenario in Location
            </h2>

            <p class="mt-2 text-sm leading-relaxed text-base-content/70">
              Dream is the place. Scenario is what happens there. Keep those
              ideas separate and your future self will buy you a pastry.
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
              No Scenario attached yet. The location is vibing without a plot,
              which is legal but suspicious.
            </div>
          </div>
        </div>

        <div class="min-h-0 xl:col-span-8">
          <scenario-gallery variant="dashboard" :show-header="false" />
        </div>
      </section>

      <dream-prompts v-else-if="currentTab === 'prompts'" />

      <dream-interact v-else-if="currentTab === 'chat'" />

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

type DreamTab =
  | 'overview'
  | 'about'
  | 'atlas'
  | 'scene'
  | 'cast'
  | 'items'
  | 'plot'
  | 'prompts'
  | 'chat'

const dashboardKey = 'dream' as const

const dreamStore = useDreamStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs: { key: DreamTab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'kind-icon:map' },
  { key: 'about', label: 'About', icon: 'kind-icon:scroll' },
  { key: 'atlas', label: 'Atlas', icon: 'kind-icon:door' },
  { key: 'scene', label: 'Scene', icon: 'kind-icon:image' },
  { key: 'cast', label: 'Cast', icon: 'kind-icon:users' },
  { key: 'items', label: 'Items', icon: 'kind-icon:gift' },
  { key: 'plot', label: 'Plot', icon: 'kind-icon:story' },
  { key: 'prompts', label: 'Prompts', icon: 'kind-icon:sparkles' },
  { key: 'chat', label: 'Chat', icon: 'kind-icon:chat' },
]

const tabKeys = computed(() => tabs.map((tab) => tab.key))

const activeTab = computed<DreamTab>(() => {
  const storedTab = navStore.getDashboardTab(dashboardKey)

  if (tabKeys.value.includes(storedTab as DreamTab)) {
    return storedTab as DreamTab
  }

  return 'overview'
})

const selectedTitle = computed(() => {
  return dreamStore.selectedDream?.title || 'No Dream selected'
})

const selectedDescription = computed(() => {
  return (
    dreamStore.selectedDream?.description ||
    dreamStore.selectedDream?.currentVibe ||
    'Choose a Dream location from the atlas to inspect its scene, cast, items, plot, prompts, and room history.'
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
    label: 'Notes',
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
  const selected = dreamStore.selectedDream?.title || 'no location selected'

  return `${activeCount}/${dreamCount} Dream locations active. ${scenarioCount} Scenarios loaded. Current location: ${selected}.`
})

function isDreamTab(tab: string): tab is DreamTab {
  return tabKeys.value.includes(tab as DreamTab)
}

function setTab(tab: string) {
  const safeTab = isDreamTab(tab) ? tab : 'overview'

  navStore.setDashboardTab(dashboardKey, safeTab)

  if (safeTab === 'scene') {
    serverStore.setCurrentServerMode('art')
    return
  }

  if (safeTab === 'prompts' || safeTab === 'chat' || safeTab === 'overview') {
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

async function handleDreamSaved(id: number) {
  await dreamStore.fetchDreamById(id, true)
  setTab('overview')
}

onMounted(async () => {
  await loadManagerData()

  if (!activeTab.value) {
    setTab('overview')
  }
})
</script>
