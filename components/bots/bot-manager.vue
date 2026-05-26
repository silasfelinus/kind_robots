<!-- /components/content/bots/bot-manager.vue -->
<template>
  <dashboard-shell
    dashboard-key="bot"
    title="Bot Workshop"
    :summary="managerSummary"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading bots, text engines, and charming little nonsense modules..."
    nav-grid-class="xl:grid-cols-5"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <section
        v-if="currentTab === 'overview'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="flex min-h-0 flex-col gap-4 xl:col-span-5">
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
          />
        </div>

        <div class="min-h-0 xl:col-span-7">
          <bot-interact />
        </div>
      </section>

      <bot-gallery
        v-else-if="currentTab === 'bots'"
        variant="dashboard"
        :show-header="false"
      />

      <bot-interact v-else-if="currentTab === 'interact'" />

      <composition-manager v-else-if="currentTab === 'composition'" />

      <section
        v-else-if="currentTab === 'servers'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="min-h-0 xl:col-span-7">
          <server-gallery
            mode="text"
            variant="dashboard"
            :show-header="false"
            :show-controls="true"
            :show-card-actions="true"
            :show-descriptions="true"
            :show-meta="true"
            :show-capabilities="true"
            :show-use-buttons="true"
            :show-workflow="true"
            :show-defaults="true"
            :show-status="true"
          />
        </div>

        <div class="min-h-0 xl:col-span-5">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <server-interact />
          </div>
        </div>
      </section>

      <bot-builder v-else-if="currentTab === 'builder'" />

      <section
        v-else-if="currentTab === 'forge'"
        class="rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <add-bot
          :mode="botStore.currentBot ? 'edit' : 'add'"
          @saved="handleBotSaved"
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
import { useServerStore } from '@/stores/serverStore'

const botStore = useBotStore()
const chatStore = useChatStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

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
