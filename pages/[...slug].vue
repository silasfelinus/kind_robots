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
type ContentPage = ContentType

type DisplayStoreWithFooter = ReturnType<typeof useDisplayStore> & {
  footer?: string | null
  footerState?: string | null
  selectedFooter?: string | null
  setFooter?: (footer: string) => void
  setFooterState?: (footer: string) => void
  setSelectedFooter?: (footer: string) => void
}

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

function applyFooterFromContent(footer?: string | null): void {
  const normalizedFooter = (footer ?? '').trim()

  if (!normalizedFooter) return

  const store = displayStore as DisplayStoreWithFooter

  if (typeof store.setFooter === 'function') {
    store.setFooter(normalizedFooter)
    return
  }

  if (typeof store.setFooterState === 'function') {
    store.setFooterState(normalizedFooter)
    return
  }

  if (typeof store.setSelectedFooter === 'function') {
    store.setSelectedFooter(normalizedFooter)
    return
  }

  if ('footer' in store) {
    store.footer = normalizedFooter
    return
  }

  if ('footerState' in store) {
    store.footerState = normalizedFooter
    return
  }

  if ('selectedFooter' in store) {
    store.selectedFooter = normalizedFooter
  }
}

function applyPageSettings(page: ContentPage): void {
  if (page.dashboard) {
    navStore.setDashboardTabFromContent(page.dashboard)
  }

  if (page.footer) {
    applyFooterFromContent(page.footer)
  }
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

  if (displayMode) displayStore.displayMode = displayMode as displayModeState
  if (displayAction)
    displayStore.displayAction = displayAction as displayActionState
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