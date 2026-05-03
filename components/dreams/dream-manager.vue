<!-- /components/dreams/dream-manager.vue -->
<template>
  <dashboard-shell
    title="Dream Manager"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading dreams, servers, prompts, and moonlit nonsense..."
    nav-grid-class="xl:grid-cols-8"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <section v-if="currentTab === 'overview'" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <dream-gallery
              variant="row"
              title="Dreams"
              subtitle="Pick the shared canvas."
              :show-controls="false"
              :show-toolbar="false"
              :show-images="true"
              :show-card-actions="true"
              :show-open-button="false"
              :compact="true"
            />
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <server-gallery
              mode="art"
              variant="row"
              title="Art Servers"
              subtitle="Pick the image engine."
              :show-controls="false"
              :show-toolbar="false"
              :show-use-buttons="false"
              :compact="true"
            />
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <server-gallery
              mode="text"
              variant="row"
              title="Text Servers"
              subtitle="Pick the chat engine."
              :show-controls="false"
              :show-toolbar="false"
              :show-use-buttons="false"
              :compact="true"
            />
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <dream-interact />
        </div>
      </section>

      <dream-gallery
        v-else-if="currentTab === 'dreams'"
        variant="dashboard"
        title="Dream Gallery"
        subtitle="Select, add, edit, clone, delete, or continue collaborative dreams."
      />

      <dream-prompts v-else-if="currentTab === 'prompts'" />

      <section
        v-else-if="currentTab === 'art'"
        class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <art-gallery />
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <collection-gallery />
        </div>
      </section>

      <collection-gallery v-else-if="currentTab === 'collections'" />

      <scenario-gallery
        v-else-if="currentTab === 'scenarios'"
        variant="dashboard"
        title="Scenario Links"
        subtitle="Optionally ground dreams in a story setting."
      />

      <server-manager v-else-if="currentTab === 'servers'" />

      <dream-interact v-else-if="currentTab === 'interact'" />

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown dream tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useServerStore } from '@/stores/serverStore'

const dashboardKey = 'dream' as const

const checkpointStore = useCheckpointStore()
const dreamStore = useDreamStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const managerSummary = computed(() => {
  const dreamCount = dreamStore.dreams.length
  const selectedDream = dreamStore.selectedDream?.title || 'no dream'
  const artServer =
    serverStore.activeArtServer?.label ||
    serverStore.activeArtServer?.title ||
    'no art server'
  const textServer =
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    'no text server'

  return `${dreamCount} dreams loaded. Current dream: ${selectedDream}. Engines: ${artServer} and ${textServer}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)
}

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      navStore.initialize(),
      dreamStore.initialize(force),
      promptStore.initialize?.(),
      serverStore.initialize({
        force,
        fetchRemote: true,
      }),
      checkpointStore.initialize(),
    ])
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load dream manager.'
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
