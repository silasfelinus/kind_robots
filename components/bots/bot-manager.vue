<!-- /components/content/bots/bot-manager.vue -->
<template>
  <dashboard-shell
    title="Bot Workshop"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading bots, text engines, and charming little nonsense modules..."
    nav-grid-class="xl:grid-cols-5"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default>
      <section
        v-if="activeTab === 'overview'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="flex min-h-0 flex-col gap-4 xl:col-span-5">
          <bot-gallery
            variant="dropdown"
            title="Bot"
            subtitle="Choose the voice."
            :show-controls="false"
            :show-images="true"
            :show-card-actions="false"
            :show-launch-button="false"
            :show-meta="true"
            :show-personality="true"
            :compact="true"
          />

          <server-gallery
            mode="text"
            variant="dropdown"
            title="Text Server"
            subtitle="Choose the brain engine."
            :show-controls="false"
            :show-card-actions="false"
            :show-descriptions="true"
            :show-meta="true"
            :show-capabilities="false"
            :show-use-buttons="false"
            :show-workflow="false"
            :show-defaults="false"
            :show-status="false"
          />
        </div>

        <div class="min-h-0 xl:col-span-7">
          <bot-interact />
        </div>
      </section>

      <bot-gallery
        v-else-if="activeTab === 'bots'"
        variant="dashboard"
        title="Bot Gallery"
        subtitle="Select, add, edit, clone, delete, or launch bots."
      />

      <bot-interact v-else-if="activeTab === 'interact'" />

      <server-manager v-else-if="activeTab === 'servers'" />

      <section
        v-else-if="activeTab === 'forge'"
        class="rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <add-bot
          :mode="botStore.currentBot ? 'edit' : 'add'"
          @saved="handleBotSaved"
          @cancel="setTab('bots')"
        />
      </section>

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown bot tab: {{ activeTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useBotStore } from '@/stores/botStore'
import { useChatStore } from '@/stores/chatStore'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'

const dashboardKey = 'bot' as const

const botStore = useBotStore()
const chatStore = useChatStore()
const navStore = useNavStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const selectedBotName = computed(() => {
  return (
    botStore.currentBot?.name ||
    botStore.currentBot?.subtitle ||
    botStore.currentBot?.tagline ||
    'no bot'
  )
})

const activeTextServerName = computed(() => {
  return (
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    'no text server'
  )
})

const managerSummary = computed(() => {
  const botCount = botStore.bots.length
  const visibleCount = botStore.visibleBots.length

  return `${botCount} bots loaded, ${visibleCount} visible. Current setup: ${selectedBotName.value}, ${activeTextServerName.value}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)

  if (tab === 'overview' || tab === 'interact' || tab === 'servers') {
    serverStore.setCurrentServerMode('text')
  }
}

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      navStore.initialize(),
      botStore.initialize({
        force,
        fetchRemote: true,
        initializeServerStore: false,
        createBlankForm: true,
      }),
      serverStore.initialize({
        force,
        fetchRemote: true,
      }),
      chatStore.initialize(),
    ])

    if (serverStore.activeTextServer) {
      serverStore.selectServer(serverStore.activeTextServer.id)
    }
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load bot manager.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

async function handleBotSaved() {
  await refreshManagerData()
  setTab('bots')
}

onMounted(async () => {
  await loadManagerData()
  setTab(activeTab.value)
})
</script>
