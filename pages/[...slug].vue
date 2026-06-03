<!-- /pages/[...slug].vue -->
<template>
  <div v-if="pageStore.page?.body" class="h-full min-h-0 w-full">
    <ContentRenderer :value="pageStore.page" />
  </div>

  <div
    v-else
    class="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-6 text-center"
  >
    <Icon name="kind-icon:loading" class="h-10 w-10 text-info" />
    <p class="text-base font-bold text-info">Loading page...</p>
  </div>

  <error-popup />
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
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
  return route.path === '/' ? '/' : route.path.replace(/\/$/, '')
})

function normalizePageData(page: typeof pageData.value) {
  if (!page) return null

  return {
    ...page,
    navigation: page.navigation ?? false,
    seo: page.seo ?? {},
  }
}

const { data: pageData, error: pageError } = await useAsyncData(
  () => `content-page-${contentPath.value}`,
  () => queryCollection('content').path(contentPath.value).first(),
  {
    watch: [contentPath],
  },
)

if (pageError.value) {
  console.error('[slug] Content loading failed:', pageError.value)
}

if (!pageData.value) {
  throw createError({
    statusCode: 404,
    statusMessage: `Page not found: ${contentPath.value}`,
    fatal: false,
  })
}

const normalizedPage = normalizePageData(pageData.value)

if (!normalizedPage) {
  throw createError({
    statusCode: 404,
    statusMessage: `Page not found: ${contentPath.value}`,
    fatal: false,
  })
}

pageStore.setPage(normalizedPage)

watchEffect(() => {
  const normalized = normalizePageData(pageData.value)

  if (normalized) {
    pageStore.setPage(normalized)
  }
})

watchEffect(() => {
  const displayMode = route.query.displayMode
  const displayAction = route.query.displayAction
  const botId = route.query.botId
  const characterId = route.query.characterId
  const scenarioId = route.query.scenarioId
  const chatId = route.query.chatId
  const pitchId = route.query.pitchId
  const promptId = route.query.promptId

  if (typeof displayMode === 'string') {
    displayStore.displayMode = displayMode as displayModeState
  }

  if (typeof displayAction === 'string') {
    displayStore.displayAction = displayAction as displayActionState
  }

  if (typeof botId === 'string') {
    botStore.selectBot(Number(botId))
  }

  if (typeof characterId === 'string') {
    characterStore.selectCharacter(Number(characterId))
  }

  if (typeof scenarioId === 'string') {
    scenarioStore.selectScenario(Number(scenarioId))
  }

  if (typeof chatId === 'string') {
    chatStore.selectChat(Number(chatId))
  }

  if (typeof pitchId === 'string') {
    pitchStore.selectPitch(Number(pitchId))
  }

  if (typeof promptId === 'string') {
    promptStore.selectPrompt(Number(promptId))
  }
})

const queryToken = computed(() => route.query.token)

if (typeof queryToken.value === 'string' && !userStore.user) {
  await userStore.initialize(queryToken.value)
}
</script>
