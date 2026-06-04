<!-- /pages/[...slug].vue -->
<template>
  <div v-if="page" class="h-full min-h-0 w-full">
    <ContentRenderer :value="page" />
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
  if (route.path === '/') return '/'
  return route.path.replace(/\/$/, '')
})

const contentKey = computed(() => {
  return `content-page:${contentPath.value}`
})

const { data: page, error: pageError } = await useAsyncData(
  contentKey,
  async () => {
    console.groupCollapsed('[slug-page] querying Nuxt Content')
    console.log('route.path:', route.path)
    console.log('route.fullPath:', route.fullPath)
    console.log('contentPath:', contentPath.value)
    console.groupEnd()

    const result = await queryCollection('content')
      .path(contentPath.value)
      .first()

    console.groupCollapsed('[slug-page] Nuxt Content result')
    console.log('contentPath:', contentPath.value)
    console.log('found:', Boolean(result))
    console.log('result:', result)
    console.groupEnd()

    return result
  },
  {
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
  page,
  (currentPage) => {
    console.groupCollapsed('[slug-page] page changed')
    console.log('contentPath:', contentPath.value)
    console.log('has page:', Boolean(currentPage))
    console.log('page title:', currentPage?.title)
    console.log('page dashboardKey:', currentPage?.dashboardKey)
    console.log('page dashboardTab:', currentPage?.dashboardTab)
    console.log('page error:', pageError.value)
    console.groupEnd()

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
