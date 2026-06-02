<template>
  <NuxtLayout :name="nuxtLayoutName">
    <div
      v-if="pageStore.page && pageStore.page.body"
      :class="isWorkspaceLayout ? 'h-full min-h-0 overflow-hidden' : ''"
    >
      <ContentRenderer
        :value="pageStore.page"
        :class="isWorkspaceLayout ? 'h-full min-h-0 overflow-hidden' : ''"
      />
    </div>

    <template #fallback>
      <div class="flex min-h-64 flex-col items-center justify-center gap-3">
        <Icon name="kind-icon:loading" class="h-10 w-10 text-info" />
        <p class="text-center text-base text-info">Loading page...</p>
      </div>
    </template>
  </NuxtLayout>

  <error-popup />
</template>

<script setup lang="ts">
// /pages/[...slug].vue
import { useRoute, useRouter } from '#app'
import { computed, onMounted, watch } from 'vue'
import type { ContentType } from '~/content.config'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useChatStore } from '@/stores/chatStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { usePageStore } from '@/stores/pageStore'
import { useNavStore } from '@/stores/navStore'

type PageLayoutName = 'default' | 'workspace'

type ContentPage = ContentType & {
  layout?: PageLayoutName | string | null
  dashboardKey?: string | null
  dashboardTab?: string | null
  cards?: string | null
  footer?: string | null
  footerState?: string | null
  subtitle?: string | null
  summary?: string | null
  loadingMessage?: string | null
  refreshLabel?: string | null
}

const route = useRoute()
const router = useRouter()

const pageStore = usePageStore()
const navStore = useNavStore()
const userStore = useUserStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const scenarioStore = useScenarioStore()
const chatStore = useChatStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()

const typedPage = computed<ContentPage | null>(() => {
  return pageStore.page ? normalizePage(pageStore.page) : null
})

const layout = computed<PageLayoutName>(() => {
  return normalizeLayoutName(typedPage.value?.layout)
})

const nuxtLayoutName = computed(() => {
  return layout.value as unknown as 'default'
})

const isWorkspaceLayout = computed(() => {
  return layout.value === 'workspace'
})

function normalizePage(page: unknown): ContentPage {
  return page as ContentPage
}

function normalizeLayoutName(value?: string | null): PageLayoutName {
  return value === 'workspace' ? 'workspace' : 'default'
}

function getContentPath(): string {
  return route.path
}

function getQueryNumber(value: unknown): number | null {
  if (typeof value !== 'string') return null

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

function syncDashboardShellFromPage(page: ContentPage): void {
  const pageLayout = normalizeLayoutName(page.layout)

  if (pageLayout !== 'workspace') {
    navStore.clearDashboardShell()
    return
  }

navStore.setDashboardShellFromContent({
  layout: page.layout,
  title: page.title,
  subtitle: page.subtitle,
  description: page.description,
  summary: page.summary,
  dashboardKey: page.dashboardKey,
  dashboardTab: page.dashboardTab,
  cards: page.cards,
  loadingMessage: page.loadingMessage,
  refreshLabel: page.refreshLabel,
})

async function loadPage(path: string): Promise<void> {
  const data = await queryCollection('content').path(path).first()

  if (!data) {
    navStore.clearDashboardShell()
    await router.push('/error')
    return
  }

  const normalizedPage = normalizePage(data)

  pageStore.setPage(normalizedPage)
  navStore.recordVisit(path)
  syncDashboardShellFromPage(normalizedPage)
}

const { data: pageData } = await useAsyncData(
  () => getContentPath(),
  () => queryCollection('content').path(getContentPath()).first(),
)

if (!pageData.value) {
  navStore.clearDashboardShell()
  await router.push('/error')
}

if (pageData.value) {
  const normalizedPage = normalizePage(pageData.value)

  pageStore.setPage(normalizedPage)
  navStore.recordVisit(getContentPath())
  syncDashboardShellFromPage(normalizedPage)
}

watch(
  () => route.path,
  async (newPath) => {
    await loadPage(newPath)
  },
)

onMounted(async () => {
  const {
    token: queryToken,
    botId,
    characterId,
    scenarioId,
    chatId,
    pitchId,
    promptId,
  } = route.query

  const selectedBotId = getQueryNumber(botId)
  const selectedCharacterId = getQueryNumber(characterId)
  const selectedScenarioId = getQueryNumber(scenarioId)
  const selectedChatId = getQueryNumber(chatId)
  const selectedPitchId = getQueryNumber(pitchId)
  const selectedPromptId = getQueryNumber(promptId)

  if (selectedBotId) botStore.selectBot(selectedBotId)
  if (selectedCharacterId) characterStore.selectCharacter(selectedCharacterId)
  if (selectedScenarioId) scenarioStore.selectScenario(selectedScenarioId)
  if (selectedChatId) chatStore.selectChat(selectedChatId)
  if (selectedPitchId) pitchStore.selectPitch(selectedPitchId)
  if (selectedPromptId) promptStore.selectPrompt(selectedPromptId)

  if (typeof queryToken === 'string' && queryToken && !userStore.user) {
    await userStore.initialize(queryToken)
  }

  if (!userStore.user && typeof queryToken === 'string' && queryToken) {
    await router.push('/login')
  }
})
</script>
