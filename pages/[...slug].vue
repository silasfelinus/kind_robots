<!-- /pages/[...slug].vue -->
<template>
  <main>
    <NuxtLayout :name="layout">
      <template v-if="page && page.body">
        <ContentRenderer :value="page" />
      </template>
      <template #fallback>
        <p class="text-center text-base text-info p-4">Loading page…</p>
      </template>
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from '#app'
import { queryCollection } from '#content'

// Stores
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

const page = ref<any | null>(null)
const loading = ref(true)

const displayStore = useDisplayStore()
const userStore = useUserStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const scenarioStore = useScenarioStore()
const chatStore = useChatStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()

const layout = computed(() => {
  const val = page.value?.layout
  return ['default', 'minimal', 'vertical-scroll'].includes(val) ? val : 'default'
})

const handleRouteChange = async () => {
  loading.value = true
  try {
    const result = await queryCollection('content').path(route.path).first()
    if (!result) {
      console.warn('[slug] No page found:', route.path)
      await router.push('/error')
      return
    }
    page.value = result
  } catch (err) {
    console.error('[slug] Error loading content:', err)
    await router.push('/error')
  } finally {
    loading.value = false
  }

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
}

watch(
  () => route.fullPath,
  async () => {
    await handleRouteChange()
  },
  { immediate: true },
)
</script>
