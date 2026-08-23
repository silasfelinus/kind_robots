<!-- /components/content/bots/bot-manager.vue -->
<template>
  <kr-manager
    dashboard-key="bot"
    :loading="isLoadingManager"
    :error="managerError"
    loading-label="Loading bots..."
    :panel-tabs="['forge']"
    @refresh="refreshManagerData"
  >
    <template #bots>
      <div class="flex h-full min-h-0 flex-1 flex-col gap-2">
        <div v-if="botStore.selectedBot" class="flex shrink-0 justify-end">
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            title="Brainstorm variations grounded in this Bot"
            @click="startBrainstormWithBot"
          >
            <Icon name="kind-icon:brain" class="size-4" />
            <span class="hidden sm:inline">Brainstorm variations</span>
          </button>
        </div>
        <bot-interact class="h-full min-h-0 flex-1 overflow-hidden" />
      </div>
    </template>

    <template #forge>
      <add-bot :mode="botFormMode" @saved="handleBotSaved" @cancel="goToBots" />
    </template>
  </kr-manager>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from '#app'
import { useBotStore } from '@/stores/botStore'
import { useNavStore } from '@/stores/navStore'

const dashboardKey = 'bot'

const route = useRoute()
const botStore = useBotStore()
const navStore = useNavStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const botFormMode = computed<'add' | 'edit'>(() => {
  return botStore.currentBot ? 'edit' : 'add'
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

function querySelectionId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function syncBotFromRoute(): Promise<void> {
  const id = querySelectionId(route.query.botId ?? route.query.bot)
  if (!id) return

  navStore.setDashboardTab(dashboardKey, 'bots')
  await botStore.selectBot(id)
}

async function refreshManagerData() {
  await loadManagerData(true)
  await syncBotFromRoute()
}

function goToBots() {
  navStore.setDashboardTab(dashboardKey, 'bots')
}

function startBrainstormWithBot(): void {
  const bot = botStore.selectedBot
  if (!bot?.id) return
  void navigateTo({
    path: '/brainstorm',
    query: {
      source: 'bot',
      sourceId: String(bot.id),
      intent: `Generate variations for the Bot "${bot.name || 'this Bot'}" that preserve its personality and voice.`,
    },
  })
}

async function handleBotSaved() {
  await loadManagerData(true)
  goToBots()
}

onMounted(async () => {
  await loadManagerData()
  await syncBotFromRoute()

  watch(
    () => [route.query.botId, route.query.bot],
    () => {
      void syncBotFromRoute()
    },
  )
})
</script>
