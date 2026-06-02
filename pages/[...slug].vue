<template>
  <component :is="layoutComponent">
    <div
      v-if="isLoading"
      class="flex min-h-64 flex-col items-center justify-center gap-3"
    >
      <Icon name="kind-icon:loading" class="h-10 w-10 text-info" />
      <p class="text-center text-base text-info">Loading page...</p>
    </div>

    <div
      v-else-if="notFound"
      class="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-warning/40 bg-base-100 p-6 text-center"
    >
      <Icon name="kind-icon:warning" class="h-10 w-10 text-warning" />
      <h1 class="text-2xl font-bold">Page not found</h1>
      <p class="max-w-xl text-base text-base-content/70">
        This route does not have a matching content page yet.
      </p>
      <NuxtLink to="/" class="btn btn-primary rounded-2xl">
        Go Home
      </NuxtLink>
    </div>

    <div
      v-else-if="typedPage && typedPage.body"
      :class="isWorkspaceLayout ? 'h-full min-h-0 overflow-hidden' : ''"
    >
      <ContentRenderer
        :value="typedPage"
        :class="isWorkspaceLayout ? 'h-full min-h-0 overflow-hidden' : ''"
      />
    </div>
  </component>

  <error-popup />
</template>

<script setup lang="ts">
// /pages/[...slug].vue
import { useRoute, useRouter } from '#app'
import { computed, onMounted, ref, watch } from 'vue'
import type { Component } from 'vue'
import type { ContentType } from '~/content.config'
import DefaultLayout from '@/layouts/default.vue'
import WorkspaceLayout from '@/layouts/workspace.vue'
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
  layout?: string | null
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

const notFound = ref(false)

const {
  data: pageData,
  status: pageStatus,
  error: pageError,
} = useAsyncData(
  () => `content-${route.path}`,
  () => queryCollection('content').path(route.path).first(),
  {
    watch: [() => route.path],
  },
)

const typedPage = computed<ContentPage | null>(() => {
  return pageData.value ? normalizePage(pageData.value) : null
})

const layout = computed<PageLayoutName>(() => {
  return normalizeLayoutName(typedPage.value?.layout)
})

const layoutComponent = computed<Component>(() => {
  return layout.value === 'workspace' ? WorkspaceLayout : DefaultLayout
})

const isWorkspaceLayout = computed(() => {
  return layout.value === 'workspace'
})

const isLoading = computed(() => {
  return pageStatus.value === 'idle' || pageStatus.value === 'pending'
})

function normalizePage(page: unknown): ContentPage {
  return page as ContentPage
}

function normalizeLayoutName(value?: string | null): PageLayoutName {
  return value === 'workspace' ? 'workspace' : 'default'
}

function getQueryNumber(value: unknown): number | null {
  if (typeof value !== 'string') return null

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

function syncDashboardShellFromPage(page: ContentPage): void {
  if (normalizeLayoutName(page.layout) !== 'workspace') {
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
}

function applyPage(page: ContentPage): void {
  notFound.value = false
  pageStore.setPage(page)
  navStore.recordVisit(route.path)
  syncDashboardShellFromPage(page)
}

watch(
  [pageData, pageStatus, pageError],
  ([value, status, error]) => {
    if (status === 'idle' || status === 'pending') {
      notFound.value = false
      return
    }

    if (error || !value) {
      notFound.value = true
      navStore.clearDashboardShell()
      return
    }

    applyPage(normalizePage(value))
  },
  { immediate: true },
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