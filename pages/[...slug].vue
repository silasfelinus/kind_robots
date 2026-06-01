<template>
  <NuxtLayout :name="layout">
    <div
      v-if="pageStore.page && pageStore.page.body"
      :class="pageShell === 'builder' ? 'h-full min-h-0 overflow-hidden' : ''"
    >
      <ContentRenderer
        :value="pageStore.page"
        :class="pageShell === 'builder' ? 'h-full min-h-0 overflow-hidden' : ''"
      />
    </div>

    <template #fallback>
      <div class="flex min-h-64 flex-col items-center justify-center gap-3">
        <Icon name="kind-icon:loading" class="h-10 w-10 text-info" />
        <p class="text-center text-base text-info">Loading page...</p>
      </div>
    </template>
  </NuxtLayout>

  <error-popup />
</template>

<script setup lang="ts">
// /pages/[...slug].vue
import { useRoute, useRouter } from '#app'
import { computed, onMounted, watch } from 'vue'
import type { ContentType } from '~/content.config'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useChatStore } from '@/stores/chatStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { usePageStore } from '@/stores/pageStore'
import { useNavStore } from '@/stores/navStore'

type PageLayoutName = 'default' | 'builder'

type ContentPage = ContentType & {
  dashboard?: string | null
  footer?: string | null
  footerState?: string | null
  shell?: string | null
  builder?: string | null
}

const route = useRoute()
const router = useRouter()

const pageStore = usePageStore()
const navStore = useNavStore()
const userStore = useUserStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const scenarioStore = useScenarioStore()
const chatStore = useChatStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()

const typedPage = computed<ContentPage | null>(() => {
  return pageStore.page ? normalizePage(pageStore.page) : null
})

const pageShell = computed<PageLayoutName>(() => {
  return typedPage.value?.shell === 'builder' ? 'builder' : 'default'
})

const layout = computed<PageLayoutName>(() => {
  return pageShell.value
})

function normalizePage(page: unknown): ContentPage {
  return page as ContentPage
}

function getContentPath(): string {
  return route.path
}

async function loadPage(path: string): Promise<void> {
  const data = await queryCollection('content').path(path).first()

  if (!data) {
    await router.push('/error')
    return
  }

  const normalizedPage = normalizePage(data)

  pageStore.setPage(normalizedPage)
  navStore.recordVisit(path)
}

const { data: pageData } = await useAsyncData(
  () => getContentPath(),
  () => queryCollection('content').path(getContentPath()).first(),
)

if (!pageData.value) {
  await router.push('/error')
}

if (pageData.value) {
  const normalizedPage = normalizePage(pageData.value)

  pageStore.setPage(normalizedPage)
  navStore.recordVisit(getContentPath())
}

watch(
  () => route.path,
  async (newPath) => {
    await loadPage(newPath)
  },
)

onMounted(async () => {
  const {
    token: queryToken,
    botId,
    characterId,
    scenarioId,
    chatId,
    pitchId,
    promptId,
  } = route.query

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
})
</script>
