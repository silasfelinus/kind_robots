<template>
  <main>
    <NuxtLayout :name="page?.layout || 'default'">
      <ContentDoc />
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useChatStore } from '@/stores/chatStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const userStore = useUserStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const scenarioStore = useScenarioStore()
const chatStore = useChatStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()
const { page } = useContent()
const route = useRoute()
const router = useRouter()

onMounted(async () => {
  // If user already exists in the store, no need to validate
  if (userStore.user !== null) {
    console.log('User already logged in. Skipping auth flow.')
    return
  }

  // Check for a localStorage token
  const token = userStore.getFromLocalStorage('token')
  if (token) {
    try {
      console.log('Validating token from localStorage...')
      const isValid = await userStore.validateAndFetchUserData()
      if (isValid) {
        console.log('Token validated. User session set.')
      } else {
        console.warn('Invalid token. Clearing storage.')
        userStore.removeFromLocalStorage('token')
      }
    } catch (error) {
      console.error('Error during token validation:', error)
      userStore.removeFromLocalStorage('token')
    }
  }

  // Handle query parameters
  const queryToken = route.query.token as string
  const code = route.query.code as string

  const botId = route.query.botId
    ? parseInt(route.query.botId as string, 10)
    : undefined
  const characterId = route.query.characterId
    ? parseInt(route.query.characterId as string, 10)
    : undefined
  const scenarioId = route.query.scenarioId
    ? parseInt(route.query.scenarioId as string, 10)
    : undefined
  const chatId = route.query.chatId
    ? parseInt(route.query.chatId as string, 10)
    : undefined
  const pitchId = route.query.pitchId
    ? parseInt(route.query.pitchId as string, 10)
    : undefined
  const promptId = route.query.promptId
    ? parseInt(route.query.promptId as string, 10)
    : undefined

  const displayMode = route.query.displayMode as displayModeState
  const displayAction = route.query.displayAction as displayActionState

  if (displayMode) {
    try {
      console.log(`Setting display mode: ${displayMode}`)
      displayStore.displayMode = displayMode
    } catch (error) {
      console.error(`Failed to set display mode: ${displayMode}`, error)
    }
  }

  if (displayAction) {
    try {
      console.log(`Setting display action: ${displayAction}`)
      displayStore.displayAction = displayAction
    } catch (error) {
      console.error(`Failed to set display action: ${displayAction}`, error)
    }
  }

  // Handle store selections
  if (botId) {
    try {
      console.log(`Selecting bot with ID: ${botId}`)
      botStore.selectBot(botId)
    } catch (error) {
      console.error(`Failed to select bot with ID ${botId}:`, error)
    }
  }

  if (characterId) {
    try {
      console.log(`Selecting character with ID: ${characterId}`)
      characterStore.selectCharacter(characterId)
    } catch (error) {
      console.error(`Failed to select character with ID ${characterId}:`, error)
    }
  }

  if (scenarioId) {
    try {
      console.log(`Selecting scenario with ID: ${scenarioId}`)
      scenarioStore.selectScenario(scenarioId)
    } catch (error) {
      console.error(`Failed to select scenario with ID ${scenarioId}:`, error)
    }
  }

  if (chatId) {
    try {
      console.log(`Selecting chat with ID: ${chatId}`)
      chatStore.selectChat(chatId)
    } catch (error) {
      console.error(`Failed to select chat with ID ${chatId}:`, error)
    }
  }

  if (pitchId) {
    try {
      console.log(`Selecting pitch with ID: ${pitchId}`)
      pitchStore.selectPitch(pitchId)
    } catch (error) {
      console.error(`Failed to select pitch with ID ${pitchId}:`, error)
    }
  }

  if (promptId) {
    try {
      console.log(`Selecting prompt with ID: ${promptId}`)
      promptStore.selectPrompt(promptId)
    } catch (error) {
      console.error(`Failed to select prompt with ID ${promptId}:`, error)
    }
  }

  // Handle query token for mandatory login
  if (queryToken) {
    console.log('Processing query token...')
    try {
      userStore.token = queryToken
      const isValid = await userStore.validateAndFetchUserData()
      if (isValid) {
        console.log('Query token validated. User session set.')
      } else {
        console.warn('Query token validation failed.')
        await router.push('/login') // Redirect to login on failure
      }
    } catch (error) {
      console.error('Error processing query token:', error)
      await router.push('/login')
    }
  } else if (code) {
    console.log('Code found. Redirecting for token exchange...')
    await router.push(`/api/auth/google/callback?code=${code}`)
  } else {
    console.log('No auth data found. Proceeding with content rendering.')
  }
})
</script>
