<!-- /pages/[...slug].vue -->
<template>
  <NuxtLayout :name="layout">
    <div v-if="pageStore.page && pageStore.page.body">
      <ContentRenderer :value="pageStore.page" />
    </div>

    <template #fallback>
      <Icon name="kind-icon:loading" class="h-10 w-10 text-info" />
      <p class="p-4 text-center text-base text-info">Loading page...</p>
    </template>
  </NuxtLayout>

  <error-popup />
</template>

<script setup lang="ts">
// /pages/[...slug].vue
import { useRoute, useRouter } from '#app'
import { watch, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useChatStore } from '@/stores/chatStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import type {
  displayModeState,
  displayActionState,
} from '@/stores/displayStore'
import type { ContentType } from '~/content.config'
import { usePageStore } from '@/stores/pageStore'
import { useNavStore } from '@/stores/navStore'

type PageLayoutName = 'default'

type ContentPage = ContentType & {
  dashboard?: string | null
  footer?: string | null
  footerState?: string | null
}

type FooterState = 'compact' | 'open' | 'hidden' | 'priority' | 'disabled'

const footerStates = [
  'compact',
  'open',
  'hidden',
  'priority',
  'disabled',
] as const

const route = useRoute()
const router = useRouter()

const pageStore = usePageStore()
const navStore = useNavStore()
const displayStore = useDisplayStore()
const userStore = useUserStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const scenarioStore = useScenarioStore()
const chatStore = useChatStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()

function normalizePage(page: unknown): ContentPage {
  return page as ContentPage
}

function getContentPath(): string {
  return route.path
}

function isFooterState(value: string): value is FooterState {
  return footerStates.includes(value as FooterState)
}

function normalizeFooterComponent(value?: string | null): string {
  const normalized = (value ?? '').trim()

  if (!normalized) return ''

  if (normalized === 'kind') return 'bot'
  if (normalized.endsWith('-footer')) {
    return normalized.replace(/-footer$/, '')
  }

  return normalized
}

function applyFooterStateFromContent(footerState?: string | null): void {
  const normalizedFooterState = (footerState ?? '').trim()

  if (!normalizedFooterState) return

  if (!isFooterState(normalizedFooterState)) {
    console.warn(
      `[slug] Ignoring invalid footer state: ${normalizedFooterState}`,
    )
    return
  }

  displayStore.footerState = normalizedFooterState
}

function applyFooterComponentFromContent(footer?: string | null): void {
  const normalizedFooter = normalizeFooterComponent(footer)

  if (!normalizedFooter) return

  displayStore.setFooterComponent(normalizedFooter)
}

function applyPageSettings(page: ContentPage): void {
  if (page.footer) {
    applyFooterComponentFromContent(page.footer)
  }

  applyFooterStateFromContent(page.footerState ?? 'open')
}

async function loadPage(path: string): Promise<void> {
  const data = await queryCollection('content').path(path).first()

  if (!data) {
    await router.push('/error')
    return
  }

  const normalizedPage = normalizePage(data)

  pageStore.setPage(normalizedPage)
  navStore.recordVisit(path)
  applyPageSettings(normalizedPage)
}

const { data: pageData } = await useAsyncData(
  () => getContentPath(),
  () => queryCollection('content').path(getContentPath()).first(),
)

if (!pageData.value) {
  await router.push('/error')
}

if (pageData.value) {
  const normalizedPage = normalizePage(pageData.value)

  pageStore.setPage(normalizedPage)
  navStore.recordVisit(getContentPath())
  applyPageSettings(normalizedPage)
}

watch(
  () => route.path,
  async (newPath) => {
    await loadPage(newPath)
  },
)

const layout = computed<PageLayoutName>(() => 'default')

onMounted(async () => {
  const {
    token: queryToken,
    botId,
    characterId,
    scenarioId,
    chatId,
    pitchId,
    promptId,
    displayMode,
    displayAction,
  } = route.query

  if (displayMode) {
    displayStore.displayMode = displayMode as displayModeState
  }

  if (displayAction) {
    displayStore.displayAction = displayAction as displayActionState
  }

  if (botId) botStore.selectBot(Number(botId))
  if (characterId) characterStore.selectCharacter(Number(characterId))
  if (scenarioId) scenarioStore.selectScenario(Number(scenarioId))
  if (chatId) chatStore.selectChat(Number(chatId))
  if (pitchId) pitchStore.selectPitch(Number(pitchId))
  if (promptId) promptStore.selectPrompt(Number(promptId))

  if (queryToken && !userStore.user) {
    console.log('[slug] Token in query and no user, calling initialize()')
    await userStore.initialize(queryToken as string)
    console.log('[slug] initialize() done, isLoggedIn:', userStore.isLoggedIn)
  }

  if (!userStore.user && queryToken) {
    console.warn('[slug] Still no user after initialize, redirecting to login')
    await router.push('/login')
  }
})
</script>
