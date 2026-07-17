<!-- /components/content/bots/bot-manager.vue -->
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
        {{ managerError || 'Loading bots...' }}
      </p>

      <button
        type="button"
        class="btn btn-sm rounded-2xl"
        :class="managerError ? 'btn-error' : 'btn-ghost'"
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

    <section
      v-if="activeTab === 'bots'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <bot-interact class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <section
      v-else-if="activeTab === 'forge'"
      class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div class="mb-4 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-xl font-black text-primary">Bot Forge</h2>

          <p class="mt-1 text-sm text-base-content/60">
            Create or edit bot personalities, skills, and suspiciously helpful
            little agendas.
          </p>
        </div>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          @click="goToBots"
        >
          <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
          <span class="hidden sm:inline">Bots</span>
        </button>
      </div>

      <add-bot :mode="botFormMode" @saved="handleBotSaved" @cancel="goToBots" />
    </section>

    <div
      v-else
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-center text-warning"
    >
      <Icon name="kind-icon:warning" class="h-10 w-10" />

      <div>
        <p class="text-lg font-black">Unknown bot tab: {{ activeTab }}</p>

        <p class="mt-1 text-sm opacity-80">
          Expected one of: {{ validTabLabels }}
        </p>
      </div>

      <button
        class="btn btn-warning btn-sm rounded-xl"
        type="button"
        @click="goToDefaultTab"
      >
        Go to {{ defaultTabLabel }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useBotStore } from '@/stores/botStore'
import { useNavStore } from '@/stores/navStore'
import {
  getDashboardConfig,
  getDashboardDefaultTab,
  getDashboardTabs,
  isDashboardTabKey,
  type DashboardKey,
} from '@/stores/helpers/dashboardHelper'

const dashboardKey: DashboardKey = 'bot'

const botStore = useBotStore()
const navStore = useNavStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const dashboardConfig = computed(() => {
  return getDashboardConfig(dashboardKey)
})

const dashboardTabs = computed(() => {
  return getDashboardTabs(dashboardKey)
})

const defaultTab = computed(() => {
  return getDashboardDefaultTab(dashboardKey)
})

const activeTab = computed(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey)

  if (isDashboardTabKey(dashboardKey, selectedTab)) {
    return selectedTab
  }

  return defaultTab.value
})

const botFormMode = computed<'add' | 'edit'>(() => {
  return botStore.currentBot ? 'edit' : 'add'
})

const validTabLabels = computed(() => {
  return dashboardTabs.value.map((tab) => tab.key).join(', ')
})

const defaultTabLabel = computed(() => {
  return (
    dashboardTabs.value.find((tab) => tab.key === defaultTab.value)?.label ||
    dashboardConfig.value.label
  )
})

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await botStore.initialize({
      force,
      fetchRemote: true,
      initializeServerStore: false,
      createBlankForm: true,
    })
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load bots.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

function goToBots() {
  navStore.setDashboardTab(dashboardKey, 'bots')
}

function goToDefaultTab() {
  navStore.setDashboardTab(dashboardKey, defaultTab.value)
}

async function handleBotSaved() {
  await loadManagerData(true)
  goToBots()
}

onMounted(async () => {
  await loadManagerData()
})
</script>
