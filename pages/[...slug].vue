
<!-- /pages/[...slug].vue -->
<template>
  <NuxtLayout :name="layout">
    <template v-if="page && page.body">
      <ContentRenderer :value="page" />
    </template>
    <template #fallback>
      <p class="text-center text-base text-info p-4">Loading page...</p>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from '#app'
import { queryCollection } from '#content'

import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useChatStore } from '@/stores/chatStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import type { displayModeState, displayActionState } from '@/stores/displayStore'

const route = useRoute()
const router = useRouter()

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('content').path(route.path).first()
)

const layout = computed(() => {
  const val = page.value?.layout
  return ['default', 'minimal', 'vertical-scroll'].includes(val) ? val : 'default'
})

const displayStore = useDisplayStore()
const userStore = useUserStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const scenarioStore = useScenarioStore()
const chatStore = useChatStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()

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
if (displayAction) displayStore.displayAction = displayAction as displayActionState
if (botId) botStore.selectBot(Number(botId))
if (characterId) characterStore.selectCharacter(Number(characterId))
if (scenarioId) scenarioStore.selectScenario(Number(scenarioId))
if (chatId) chatStore.selectChat(Number(chatId))
if (pitchId) pitchStore.selectPitch(Number(pitchId))
if (promptId) promptStore.selectPrompt(Number(promptId))
if (queryToken && !userStore.user) await userStore.initialize(queryToken as string)
if (!userStore.user && queryToken) await router.push('/login')
if (!page.value) await router.push('/error')
</script>

