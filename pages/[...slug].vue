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
import { usePageStore } from '@/stores/pageStore'
import type {
  displayModeState,
  displayActionState,
} from '@/stores/displayStore'
import type { ContentType } from '~/content.config'

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
  const cleanPath = route.path.replace(/\/$/, '')
  return cleanPath || '/'
})

const asyncDataKey = computed(() => {
  return `content-page:${contentPath.value}`
})

const {
  data: page,
  pending: contentPending,
  error: contentError,
  refresh,
} = await useAsyncData(
  asyncDataKey.value,
  async () => {
    const path = contentPath.value

    console.groupCollapsed('[slug-page] queryCollection')
    console.log('route.path:', route.path)
    console.log('route.fullPath:', route.fullPath)
    console.log('contentPath:', path)
    console.groupEnd()

    const result = await queryCollection('content').path(path).first()

    console.groupCollapsed('[slug-page] queryCollection result')
    console.log('contentPath:', path)
    console.log('found:', Boolean(result))
    console.log('result:', result)
    console.groupEnd()

    return result
  },
  {
    default: () => null,
    watch: [contentPath],
  },
)

useSeoMeta({
  title: () => page.value?.title || 'Kind Robots',
  description: () =>
    page.value?.description ||
    'A friendly AI playground for humans and robots.',
})

watch(
  [page, contentPending, contentError],
  ([currentPage, pending, error]) => {
    console.groupCollapsed('[slug-page] page state changed')
    console.log('contentPath:', contentPath.value)
    console.log('pending:', pending)
    console.log('has page:', Boolean(currentPage))
    console.log('page title:', currentPage?.title)
    console.log('page path:', currentPage?.path)
    console.log('page dashboardKey:', currentPage?.dashboardKey)
    console.log('page dashboardTab:', currentPage?.dashboardTab)
    console.log('contentError:', error)
    console.groupEnd()

    if (pending) {
      console.log(
        '[slug-page] pageStore update skipped while content is pending',
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
    } as ContentType)
  },
  { immediate: true },
)

watch(contentPath, async () => {
  console.log('[slug-page] contentPath changed', {
    contentPath: contentPath.value,
  })

  await refresh()
})

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
