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

const contentPath = computed(() => route.path)

const { data: page } = await useAsyncData(
  () => `content-page-${contentPath.value}`,
  () => queryCollection('content').path(contentPath.value).first(),
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

watchEffect(() => {
  if (!page.value) return

  pageStore.setPage({
    ...page.value,
    seo: page.value.seo ?? {},
    navigation: page.value.navigation ?? false,
  } as ContentType)
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
