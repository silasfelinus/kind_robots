<template>
  <main>
    <NuxtLayout :name="layout">
      <SpeedInsights />
      <ContentRenderer v-if="page" :value="page" />
      <template v-else>
        <p>Bot Not Found</p>
      </template>
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">

import { onMounted } from 'vue'
import { useRouter } from '#app'
import { SpeedInsights } from '@vercel/speed-insights/vue'

import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useChatStore } from '@/stores/chatStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import {
  useDisplayStore,
  type displayActionState,
  type displayModeState,
} from '@/stores/displayStore'

import { usePageStore } from '@/stores/pageStore'

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

onMounted(async () => {
  // Load token from localStorage
  const token = userStore.getFromLocalStorage('token')
  if (userStore.user === null && token) {
    userStore.token = token
    try {
      console.log('Validating token from localStorage...')
      const isValid = await userStore.validateAndFetchUserData()
      if (!isValid) {
        console.warn('Invalid token. Clearing storage.')
        userStore.removeFromLocalStorage('token')
      }
    } catch (error) {
      console.error('Error during token validation:', error)
      userStore.removeFromLocalStorage('token')
    }
  }

  // Process query parameters
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
  } = useRoute().query

  if (displayMode) displayStore.displayMode = displayMode as displayModeState
  if (displayAction) displayStore.displayAction = displayAction as displayActionState
  if (botId) botStore.selectBot(parseInt(botId as string, 10))
  if (characterId) characterStore.selectCharacter(parseInt(characterId as string, 10))
  if (scenarioId) scenarioStore.selectScenario(parseInt(scenarioId as string, 10))
  if (chatId) chatStore.selectChat(parseInt(chatId as string, 10))
  if (pitchId) pitchStore.selectPitch(parseInt(pitchId as string, 10))
  if (promptId) promptStore.selectPrompt(parseInt(promptId as string, 10))

  if (queryToken) {
    console.log('Processing query token...')
    try {
      userStore.token = queryToken as string
      const isValid = await userStore.validateAndFetchUserData()
      if (!isValid) await router.push('/login')
    } catch (error) {
      console.error('Error processing query token:', error)
      await router.push('/login')
    }
  } else if (code) {
    console.log('Redirecting for token exchange...')
    await router.push(`/api/auth/google/callback?code=${code}`)
  }
})
</script>
