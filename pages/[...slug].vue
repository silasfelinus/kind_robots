<template>
  <main>
    <NuxtLayout :name="layout">
      <ContentRenderer v-if="page" :value="page" />
      <template v-else>
        <p>Bot Not Found</p>
      </template>
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAsyncData, useRouter } from '#app'
import type { LayoutKey } from '#build/types/layouts'
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

const router = useRouter()

const displayStore = useDisplayStore()
const userStore = useUserStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const scenarioStore = useScenarioStore()
const chatStore = useChatStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()

// Get the route params
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('content').path(route.path).first()
})

// Compute the layout key properly
const layout = computed(() => (page.value?.layout ?? 'default') as LayoutKey)

onMounted(async () => {
  // Handle user authentication
  const token = userStore.getFromLocalStorage('token')
  if (userStore.user === null) {
    if (token) {
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
  }

  // Handle query parameters
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

  if (displayMode) displayStore.displayMode = displayMode as displayModeState
  if (displayAction)
    displayStore.displayAction = displayAction as displayActionState

  if (botId) botStore.selectBot(parseInt(botId as string, 10))
  if (characterId)
    characterStore.selectCharacter(parseInt(characterId as string, 10))
  if (scenarioId)
    scenarioStore.selectScenario(parseInt(scenarioId as string, 10))
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
