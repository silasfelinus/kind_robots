<!-- /components/builders/builder-manager.vue -->
<template>
  <dashboard-shell
    title="Builder Tool"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading builder systems..."
    nav-grid-class="xl:grid-cols-8"
    refresh-label="Refresh Builder"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #actions="{ activeTab: currentTab }">
      <div
        class="hidden items-center gap-2 rounded-2xl border border-base-300 bg-base-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-base-content/60 lg:flex"
      >
        <Icon name="kind-icon:blueprint" class="h-4 w-4 text-primary" />
        {{ getStageTitle(currentTab) }}
      </div>
    </template>

    <template #default="{ activeTab: currentTab }">
      <section
        v-if="currentTab === 'user'"
        class="flex min-h-full flex-col gap-4"
      >
        <user-builder />
      </section>

      <section
        v-else-if="currentTab === 'pitch'"
        class="flex min-h-full flex-col gap-4"
      >
        <pitch-builder />
      </section>

      <section
        v-else-if="currentTab === 'dream'"
        class="flex min-h-full flex-col gap-4"
      >
        <dream-builder />
      </section>

<section
        v-else-if="currentTab === 'bot'"
        class="flex min-h-full flex-col gap-4"
      >
        <bot-builder />
      </section>


      <section
        v-else-if="currentTab === 'character'"
        class="flex min-h-full flex-col gap-4"
      >
        <character-builder />
      </section>

      <section
        v-else-if="currentTab === 'reward'"
        class="flex min-h-full flex-col gap-4"
      >
        <reward-builder />
      </section>

      <section
        v-else-if="currentTab === 'scenario'"
        class="flex min-h-full flex-col gap-4"
      >
        <scenario-builder />
      </section>

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown builder stage: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useNavStore } from '@/stores/navStore'
import {
  getBuilderStage,
  isBuilderStageKey,
  type BuilderStageKey,
} from '@/stores/seeds/builderSchema'

const dashboardKey = 'builder' as const

const navStore = useNavStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const activeStage = computed(() => getBuilderStage(activeTab.value))

const managerSummary = computed(() => {
  return (
    activeStage.value.summary ??
    'Build a full creative universe from idea to interactive experience.'
  )
})

function getStageTitle(tab: string) {
  return getBuilderStage(tab).title ?? 'Builder'
}

function setTab(tab: string) {
  if (!isBuilderStageKey(tab)) {
    managerError.value = `Unknown builder tab: ${tab}`
    return
  }

  managerError.value = null
  navStore.setDashboardTab(dashboardKey, tab)
}

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await navStore.initialize(force)
  } catch (error) {
    managerError.value =
      error instanceof Error
        ? error.message
        : 'Failed to load builder manager data.'
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
