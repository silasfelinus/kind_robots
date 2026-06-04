<!-- /pages/[...slug].vue -->
<template>
  <div v-if="page" class="h-full min-h-0 w-full">
    <ContentRenderer :value="page" />
  </div>

  <div
    v-else-if="contentPending"
    class="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-6 text-center"
  >
    <Icon name="kind-icon:spinner" class="h-10 w-10 animate-spin text-info" />
    <p class="text-base font-bold text-info">Loading page…</p>
    <p class="max-w-xl text-sm text-base-content/60">
      Looking for {{ contentPath }}
    </p>
  </div>

  <div
    v-else
    class="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-6 text-center"
  >
    <Icon name="kind-icon:alert" class="h-10 w-10 text-warning" />
    <p class="text-base font-bold text-warning">Page not found</p>
    <p class="max-w-xl text-sm text-base-content/60">
      No Nuxt Content page was found for {{ contentPath }}.
    </p>
  </div>

  <error-popup />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from '#app'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useChatStore } from '@/stores/chatStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore, type WorkspacePage } from '@/stores/pageStore'
import type {
  displayModeState,
  displayActionState,
} from '@/stores/displayStore'

const route = useRoute()

const pageStore = usePageStore()
const displayStore = useDisplayStore()
const userStore = useUserStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const scenarioStore = useScenarioStore()
const chatStore = useChatStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()

const contentPath = computed(() => {
  const path = route.path.replace(/\/$/, '')
  return path || '/'
})

const {
  data: page,
  status: contentStatus,
  error: contentError,
} = await useAsyncData(
  () => `content-page:${contentPath.value}`,
  async () => {
    const path = contentPath.value

    console.groupCollapsed('[slug-page] querying Nuxt Content')
    console.log('route.path:', route.path)
    console.log('route.fullPath:', route.fullPath)
    console.log('contentPath:', path)
    console.groupEnd()

    const result = await queryCollection('content').path(path).first()

    console.groupCollapsed('[slug-page] Nuxt Content result')
    console.log('contentPath:', path)
    console.log('found:', Boolean(result))
    console.log('title:', result?.title)
    console.log('path:', result?.path)
    console.log('dashboardKey:', result?.dashboardKey)
    console.log('dashboardTab:', result?.dashboardTab)
    console.log('result:', result)
    console.groupEnd()

    return result
  },
  {
    default: () => null,
    watch: [contentPath],
  },
)

const contentPending = computed(() => {
  return contentStatus.value === 'pending' || contentStatus.value === 'idle'
})

useSeoMeta({
  title: () => page.value?.title || 'Kind Robots',
  description: () =>
    page.value?.description ||
    'A friendly AI playground for humans and robots.',
})

watch(
  [page, contentStatus, contentError],
  ([currentPage, status, error]) => {
    console.groupCollapsed('[slug-page] page changed')
    console.log('contentPath:', contentPath.value)
    console.log('status:', status)
    console.log('pending:', contentPending.value)
    console.log('has page:', Boolean(currentPage))
    console.log('page title:', currentPage?.title)
    console.log('page path:', currentPage?.path)
    console.log('page dashboardKey:', currentPage?.dashboardKey)
    console.log('page dashboardTab:', currentPage?.dashboardTab)
    console.log('contentError:', error)
    console.groupEnd()

    if (contentPending.value) {
      console.log(
        '[slug-page] skipped pageStore update while content is pending',
      )
      return
    }

    if (!currentPage) {
      pageStore.clearPage()
      return
    }

    pageStore.setPage({
      ...currentPage,
      seo: currentPage.seo ?? {},
      navigation: currentPage.navigation ?? false,
    } as WorkspacePage)
  },
  { immediate: true },
)

watch(
  () => route.query,
  (query) => {
    const displayMode = query.displayMode
    const displayAction = query.displayAction
    const botId = query.botId
    const characterId = query.characterId
    const scenarioId = query.scenarioId
    const chatId = query.chatId
    const pitchId = query.pitchId
    const promptId = query.promptId

    if (typeof displayMode === 'string') {
      displayStore.displayMode = displayMode as displayModeState
    }

    if (typeof displayAction === 'string') {
      displayStore.displayAction = displayAction as displayActionState
    }

    if (typeof botId === 'string') {
      const id = Number(botId)
      if (Number.isFinite(id)) botStore.selectBot(id)
    }

    if (typeof characterId === 'string') {
      const id = Number(characterId)
      if (Number.isFinite(id)) characterStore.selectCharacter(id)
    }

    if (typeof scenarioId === 'string') {
      const id = Number(scenarioId)
      if (Number.isFinite(id)) scenarioStore.selectScenario(id)
    }

    if (typeof chatId === 'string') {
      const id = Number(chatId)
      if (Number.isFinite(id)) chatStore.selectChat(id)
    }

    if (typeof pitchId === 'string') {
      const id = Number(pitchId)
      if (Number.isFinite(id)) pitchStore.selectPitch(id)
    }

    if (typeof promptId === 'string') {
      const id = Number(promptId)
      if (Number.isFinite(id)) promptStore.selectPrompt(id)
    }
  },
  { immediate: true },
)

const queryToken = computed(() => route.query.token)

if (typeof queryToken.value === 'string' && !userStore.user) {
  await userStore.initialize(queryToken.value)
}
</script>
