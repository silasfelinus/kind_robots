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
    <template #default="{ activeTab: currentTab }">
      <section v-if="currentTab === 'overview'" class="flex flex-col gap-4">
        <div
          class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
        >
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <bot-gallery
              variant="row"
              title="Bot Roster"
              subtitle="Pick the voice."
              :show-controls="false"
              :show-toolbar="false"
              :show-images="true"
              :show-card-actions="true"
              :show-launch-button="true"
              :compact="true"
            />
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <server-gallery
              mode="text"
              variant="row"
              title="Text Servers"
              subtitle="Pick the brain engine."
              :show-controls="false"
              :show-toolbar="false"
              :show-use-buttons="false"
              :compact="true"
            />
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <bot-interact />
        </div>
      </section>

      <bot-gallery
        v-else-if="currentTab === 'bots'"
        variant="dashboard"
        title="Bot Gallery"
        subtitle="Select, add, edit, clone, delete, or launch bots."
      />

      <bot-interact v-else-if="currentTab === 'interact'" />

      <server-manager v-else-if="currentTab === 'servers'" />

      <section
        v-else-if="currentTab === 'forge'"
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
        Unknown bot tab: {{ currentTab }}
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

const managerSummary = computed(() => {
  const botCount = botStore.bots.length
  const visibleCount = botStore.visibleBots.length
  const selectedBot = botStore.currentBot?.name || 'no bot'
  const activeTextServer =
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    'no text server'

  return `${botCount} bots loaded, ${visibleCount} visible. Current bot: ${selectedBot}. Runtime text engine: ${activeTextServer}.`
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
})
</script>