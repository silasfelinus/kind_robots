<!-- /pages/[...slug].vue -->
<template>
  <main>
    <NuxtLayout :name="layout">
      <template v-if="page && page.body">
        <ContentRenderer :value="page" />
      </template>
      <template #fallback>
        <p class="text-center text-base text-info p-4">Loading page...</p>
      </template>
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from '#app'
import { storeToRefs } from 'pinia'

import { usePageStore } from '@/stores/pageStore'
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

const route = useRoute()
const router = useRouter()

const displayStore = useDisplayStore()
const userStore = useUserStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const scenarioStore = useScenarioStore()
const chatStore = useChatStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()
const pageStore = usePageStore()

const { page, layout } = storeToRefs(pageStore)

const handleRouteChange = async () => {
  await pageStore.loadPage(route.path)

  const {
    token: queryToken,
    code,
    botId,
    characterId,
    scenarioId,
    chatId,
    pitchId,
    promptId,
    displayMode,
    displayAction,
  } = route.query

  // Display modes
  if (displayMode && displayStore.displayMode !== displayMode) {
    displayStore.displayMode = displayMode as displayModeState
  }

  if (displayAction && displayStore.displayAction !== displayAction) {
    displayStore.displayAction = displayAction as displayActionState
  }

  // Context selects
  if (botId) botStore.selectBot(Number(botId))
  if (characterId) characterStore.selectCharacter(Number(characterId))
  if (scenarioId) scenarioStore.selectScenario(Number(scenarioId))
  if (chatId) chatStore.selectChat(Number(chatId))
  if (pitchId) pitchStore.selectPitch(Number(pitchId))
  if (promptId) promptStore.selectPrompt(Number(promptId))

  // Google OAuth callback
  if (code) {
    await router.push(`/api/auth/google/callback?code=${code}`)
    return
  }

  // Initialize userStore with token (if in query)
  await userStore.initialize(queryToken as string | undefined)

  // If user is still null (token invalid or missing), redirect unless guest allowed
  if (!userStore.user && queryToken) {
    console.warn('[slug] Invalid token login attempt. Redirecting.')
    await router.push('/login')
  }
}

watch(
  () => route.fullPath,
  async () => {
    await handleRouteChange()
  },
  { immediate: true },
)
</script>
