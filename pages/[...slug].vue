<template>
  <main>
    <NuxtLayout :name="layout">
      <ClientOnly>
        <template v-if="page && page.body">
          <ContentRenderer :value="page" />
        </template>
        <template #fallback>
          <p class="text-center text-base text-info p-4">Loading page...</p>
        </template>
      </ClientOnly>
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
  displayActionState,
  displayModeState,
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

  if (displayMode && displayStore.displayMode !== displayMode) {
    displayStore.displayMode = displayMode as displayModeState
  }

  if (displayAction && displayStore.displayAction !== displayAction) {
    displayStore.displayAction = displayAction as displayActionState
  }

  if (botId && botStore.selectedBotId !== Number(botId)) {
    botStore.selectBot(Number(botId))
  }

  if (
    characterId &&
    characterStore.selectedCharacter?.id !== Number(characterId)
  ) {
    characterStore.selectCharacter(Number(characterId))
  }

  if (scenarioId && scenarioStore.selectedScenario?.id !== Number(scenarioId)) {
    scenarioStore.selectScenario(Number(scenarioId))
  }

  if (chatId && chatStore.selectedChat?.id !== Number(chatId)) {
    chatStore.selectChat(Number(chatId))
  }

  if (pitchId && pitchStore.selectedPitch?.id !== Number(pitchId)) {
    pitchStore.selectPitch(Number(pitchId))
  }

  if (promptId && promptStore.selectedPrompt?.id !== Number(promptId)) {
    promptStore.selectPrompt(Number(promptId))
  }

  if (code) {
    await router.push(`/api/auth/google/callback?code=${code}`)
    return
  }

  const storedToken = userStore.getFromLocalStorage('token')
  const tokenToUse = queryToken || storedToken

  if (!userStore.user && tokenToUse) {
    if (userStore.token !== tokenToUse) {
      userStore.token = tokenToUse as string
    }

    try {
      const isValid = await userStore.validateAndFetchUserData()

      if (!isValid) {
        userStore.removeFromLocalStorage('token')
        await router.push('/login')
      } else if (queryToken) {
        userStore.saveToLocalStorage('token', queryToken as string)
      }
    } catch (error) {
      console.error('Token validation error:', error)
      userStore.removeFromLocalStorage('token')
      await router.push('/login')
    }
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
