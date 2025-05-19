<!-- /pages/[...slug].vue -->
<template>
  <NuxtLayout :name="layout">
    <template v-if="pageStore.page && pageStore.page.body">
      <ContentRenderer :value="pageStore.page" />
    </template>
    <template #fallback>
      <p class="text-center text-base text-info p-4">Loading page...</p>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from '#app'
import { computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useChatStore } from '@/stores/chatStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import type { LayoutKey } from '@/stores/pageStore'
import type {
  displayModeState,
  displayActionState,
} from '@/stores/displayStore'

const route = useRoute()
const router = useRouter()

const fullPath = route.path || '/'
const { data: pageData } = await useAsyncData(fullPath, () =>
  queryCollection('content').path(fullPath).first()
)

const pageStore = usePageStore()
const userStore = useUserStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const scenarioStore = useScenarioStore()
const chatStore = useChatStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()

if (pageData.value) {
  pageStore.page = pageData.value
} else {
  await router.push('/error')
}

const layout = computed(() => {
  const val = pageData.value?.layout
  return ['default', 'minimal', 'vertical-scroll'].includes(val as string)
    ? (val as LayoutKey)
    : 'default'
}) as ComputedRef<LayoutKey>

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

if (queryToken && !userStore.user) {
  await userStore.initialize(queryToken as string)
}
if (!userStore.user && queryToken) {
  await router.push('/login')
}
</script>
