<!-- /components/content/characters/character-manager.vue -->
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
        <span
          v-if="isLoadingManager"
          class="loading loading-spinner loading-xs"
        />
        <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
        Refresh
      </button>
    </div>

    <section
      v-if="activeTab === 'characters'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <character-interact class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <section
      v-else-if="activeTab === 'adventure'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <add-character />
    </section>

    <section
      v-else-if="activeTab === 'stage'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <stage-manager class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <div
      v-else
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-center text-warning"
    >
      <Icon name="kind-icon:warning" class="h-10 w-10" />

      <div>
        <p class="text-lg font-black">Unknown character tab: {{ activeTab }}</p>

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
import { useCharacterStore } from '@/stores/characterStore'
import { useNavStore } from '@/stores/navStore'
import {
  getDashboardConfig,
  getDashboardDefaultTab,
  getDashboardTabs,
  isDashboardTabKey,
  type DashboardKey,
} from '@/stores/helpers/dashboardHelper'

const dashboardKey: DashboardKey = 'character'

const characterStore = useCharacterStore()
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

const managerSummary = computed(() => {
  const count = characterStore.characters.length

  return `${count} character${count === 1 ? '' : 's'} loaded.`
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
    await characterStore.initialize({
      force,
      fetchRemote: true,
      createDefaultForm: true,
    })
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load characters.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

function goToDefaultTab() {
  navStore.setDashboardTab(dashboardKey, defaultTab.value)
}

onMounted(async () => {
  await loadManagerData()
})
</script>
