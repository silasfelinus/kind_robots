<!-- /components/content/bots/bot-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="isLoadingManager"
      class="flex h-full min-h-0 flex-1 items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6"
    >
      <div class="flex flex-col items-center gap-3 text-center">
        <span class="loading loading-spinner loading-lg text-primary" />
        <p class="text-sm text-base-content/70">
          Loading bots, text engines, and charming little nonsense modules...
        </p>
      </div>
    </div>

    <div
      v-else-if="managerError"
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-error/40 bg-error/10 p-4 text-error"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span>{{ managerError }}</span>
        <button
          type="button"
          class="btn btn-error btn-sm rounded-2xl"
          @click="refreshManagerData"
        >
          Retry
        </button>
      </div>
    </div>

    <section
      v-else-if="activeTab === 'overview'"
      class="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-5"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <bot-gallery
            variant="dropdown"
            :show-header="false"
            :show-controls="false"
            :show-images="true"
            :show-card-actions="false"
            :show-launch-button="false"
            :show-meta="true"
            :show-personality="true"
            :compact="true"
          />
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-7"
      >
        <div class="min-h-0 flex-1 overflow-hidden">
          <bot-interact class="h-full min-h-0 overflow-hidden" />
        </div>
      </section>
    </section>

    <section
      v-else-if="activeTab === 'bots'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <bot-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        variant="dashboard"
        :show-header="false"
      />
    </section>

    <section
      v-else-if="activeTab === 'interact'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <bot-interact class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <section
      v-else-if="activeTab === 'composition'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <composition-manager class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <section
      v-else-if="activeTab === 'forge'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
    >
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <add-bot
          :mode="botStore.currentBot ? 'edit' : 'add'"
          @saved="handleBotSaved"
        />
      </div>
    </section>

    <div
      v-else
      class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Unknown bot tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useBotStore } from '@/stores/botStore'
import { useChatStore } from '@/stores/chatStore'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'

type BotTab =
  | 'overview'
  | 'bots'
  | 'interact'
  | 'composition'
  | 'builder'
  | 'forge'

const botStore = useBotStore()
const chatStore = useChatStore()
const navStore = useNavStore()
const serverStore = useServerStore()

const defaultDashboardKey = 'bot'
const defaultTab: BotTab = 'overview'

const validTabs: BotTab[] = [
  'overview',
  'bots',
  'interact',
  'composition',
  'builder',
  'forge',
]

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<BotTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)

  if (validTabs.includes(selectedTab as BotTab)) {
    return selectedTab as BotTab
  }

  return defaultTab
})

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      botStore.initialize({
        force,
        fetchRemote: true,
        initializeServerStore: false,
        createBlankForm: true,
      }),
      ...(force || !serverStore.hasLoaded
        ? [serverStore.initialize({ force, fetchRemote: true })]
        : []),
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
}

onMounted(async () => {
  await loadManagerData()
})
</script>
