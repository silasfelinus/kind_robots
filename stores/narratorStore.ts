import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { navigateTo } from '#app'
import type {
  ArtImage,
  Bot,
  Chat,
  EmotionImage,
  Server,
} from '~/prisma/generated/prisma/client'
import {
  applyNarratorTemplate,
  buildNarratorStarterPrompts,
  cleanPublicNarratorText,
  dreamSummary,
  emotionLabel,
  fallbackEmotionPhrase,
  fallbackNarratorEmotions,
  findNarratorNavAction,
  narratorDisplaySummary,
  narratorIntroMessage,
  narratorMenuSummary,
  normalizeEmotion,
  readAdditionalNarratorTexts,
  readExpressionValue,
  readStringArray,
  scenarioKey,
  scenarioSummary,
  scenarioTitle,
  type NarratorEmotion,
  type NarratorNavAction,
  type NarratorScreen,
  type NarratorStarterPrompt,
} from './helpers/narratorHelper'
import { useChatStore } from '@/stores/chatStore'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type ArtImageLike = Partial<ArtImage> & {
  path?: string | null
  fileName?: string | null
}

type NarratorEmotionImage = EmotionImage & {
  emotion?: string | null
  ArtImage?: ArtImageLike | null
}

type DreamNarratorBot = Partial<Bot> & {
  id: number
  name: string
  EmotionImages?: NarratorEmotionImage[]
}

type DreamScenario = {
  id?: number | null
  slug?: string | null
  title?: string | null
  name?: string | null
  description?: string | null
  summary?: string | null
  pitch?: string | null
  flavorText?: string | null
  intros?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  highlightImage?: string | null
  icon?: string | null
  ArtImage?: ArtImageLike | null
  ArtCollection?: {
    ArtImages?: ArtImageLike[]
  } | null
}

type DreamWithNarrator = Omit<DreamWithRelations, 'Bots' | 'Scenarios'> & {
  Bots?: DreamNarratorBot[]
  Scenarios?: DreamScenario[]
}

type NarratorChat = Chat & {
  botResponse?: string | null
}

type BotCafeMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ChatRuntimeInput = Parameters<
  ReturnType<typeof useChatStore>['addChat']
>[0]

const narratorStorageKey = 'kindrobots:workspace-narrator'

export const useNarratorStore = defineStore('narratorStore', () => {
  const dreamStore = useDreamStore()
  const navStore = useNavStore()
  const chatStore = useChatStore()
  const serverStore = useServerStore()
  const userStore = useUserStore()
  const promptStore = usePromptStore()

  const isOpen = ref(false)
  const pinOpen = ref(false)
  const bubblesEnabled = ref(true)
  const activeScreen = ref<NarratorScreen>('narrator')
  const selectedScenarioKey = ref('')
  const currentEmotion = ref<NarratorEmotion>('NEUTRAL')
  const showMoodRing = ref(false)
  const activeBubble = ref('')
  const narratorMessage = ref('')
  const statusMessage = ref('')
  const statusTone = ref<'success' | 'error'>('success')
  const narratorSessionIds = ref<number[]>([])
  const hasInitialized = ref(false)

  let bubbleTimer: ReturnType<typeof setTimeout> | null = null

  const isDreamWorkspace = computed(() => {
    return navStore.dashboardShell.dashboardKey === 'dream'
  })

  const shouldRender = computed(() => {
    return Boolean(isDreamWorkspace.value || dreamStore.selectedDream)
  })

  const activeDream = computed(() => {
    return (dreamStore.selectedDream as DreamWithNarrator | null) ?? null
  })

  const dreamNarrators = computed<DreamNarratorBot[]>(() => {
    return activeDream.value?.Bots ?? []
  })

  const dreamScenarios = computed<DreamScenario[]>(() => {
    return activeDream.value?.Scenarios ?? []
  })

  const selectedScenario = computed<DreamScenario | null>(() => {
    const scenarios = dreamScenarios.value

    if (!scenarios.length) return null

    const match = scenarios.find(
      (scenario, index) =>
        scenarioKey(scenario, index) === selectedScenarioKey.value,
    )
    const firstScenario = scenarios[0]

    return match ?? firstScenario ?? null
  })

  const narratorBot = computed<DreamNarratorBot | null>(() => {
    return (
      dreamNarrators.value.find(
        (bot) => String(bot.BotType || '').toUpperCase() === 'NARRATOR',
      ) ??
      dreamNarrators.value[0] ??
      null
    )
  })

  const emotionRows = computed<NarratorEmotionImage[]>(() => {
    return (narratorBot.value?.EmotionImages ?? []).filter(
      (emotion) => emotion.isActive !== false,
    )
  })

  const emotionOptions = computed<NarratorEmotion[]>(() => {
    const fromRows = emotionRows.value.map((row) =>
      normalizeEmotion(readExpressionValue(row)),
    )

    return Array.from(
      new Set<NarratorEmotion>([
        'NEUTRAL',
        ...fromRows,
        ...fallbackNarratorEmotions,
      ]),
    )
  })

  const currentEmotionRow = computed<NarratorEmotionImage | null>(() => {
    const exact = emotionRows.value.find(
      (row) =>
        normalizeEmotion(readExpressionValue(row)) === currentEmotion.value,
    )

    if (exact) return exact

    return (
      emotionRows.value.find(
        (row) => normalizeEmotion(readExpressionValue(row)) === 'NEUTRAL',
      ) ??
      emotionRows.value[0] ??
      null
    )
  })

  const narratorName = computed(() => narratorBot.value?.name || 'Narrator')

  const narratorSummary = computed(() => {
    return narratorDisplaySummary(narratorBot.value)
  })

  const narratorMenuSummaryText = computed(() => {
    return narratorMenuSummary(narratorBot.value)
  })

  const narratorExtraTexts = computed(() => {
    return readAdditionalNarratorTexts(narratorBot.value)
  })

  const narratorHoverTitle = computed(() => {
    const parts = [
      narratorName.value,
      currentEmotionLabel.value,
      narratorSummary.value,
    ].filter(Boolean)

    return parts.join(' — ')
  })

  const narratorImage = computed(() => {
    const emotionImage = readEmotionImage(currentEmotionRow.value)

    return (
      emotionImage ||
      narratorBot.value?.avatarImage ||
      narratorBot.value?.imagePath ||
      dreamImage(activeDream.value) ||
      '/images/bot.webp'
    )
  })

  const currentEmotionLabel = computed(() => {
    return currentEmotionRow.value?.label || emotionLabel(currentEmotion.value)
  })

  const fallbackEmotionIcon = computed(() => {
    const lookup: Record<NarratorEmotion, string> = {
      NEUTRAL: '✨',
      HAPPY: '😊',
      SAD: '🌧️',
      EXCITED: '⚡',
      NERVOUS: '🌀',
      ANGRY: '🔥',
      CONFUSED: '❔',
      PROUD: '🌟',
    }

    return lookup[currentEmotion.value] ?? '✨'
  })

  const activeDreamSummary = computed(() => {
    return dreamSummary(activeDream.value)
  })

  const narratorIntro = computed(() => {
    return narratorIntroMessage({
      narratorName: narratorName.value,
      dreamTitle: activeDream.value?.title,
      source: narratorBot.value,
    })
  })

  const narratorStarterPrompts = computed<NarratorStarterPrompt[]>(() => {
    return buildNarratorStarterPrompts({
      dreamTitle: activeDream.value?.title,
      hasScenarios: Boolean(dreamScenarios.value.length),
    })
  })

  const runtimeTextServer = computed<Server | null>(() => {
    const botServerId = narratorBot.value?.serverId

    if (typeof botServerId === 'number') {
      return (
        serverStore.getServerById(botServerId) ??
        serverStore.activeTextServer ??
        null
      )
    }

    return serverStore.activeTextServer ?? null
  })

  const narratorSession = computed<NarratorChat[]>(() => {
    return chatStore.chats.filter((chat) =>
      narratorSessionIds.value.includes(chat.id),
    ) as NarratorChat[]
  })

  const isNarratorResponding = computed(() => {
    return narratorSession.value.some((chat) => !chat.botResponse)
  })

  const canUseNarrator = computed(() => {
    return Boolean(activeDream.value && narratorBot.value)
  })

  const canSendNarrator = computed(() => {
    return Boolean(
      canUseNarrator.value &&
      narratorMessage.value.trim() &&
      !isNarratorResponding.value,
    )
  })

  const narratorPlaceholder = computed(() => {
    if (!activeDream.value) return 'Choose a Dream first.'
    if (!narratorBot.value) return 'Attach a NARRATOR bot to this Dream first.'

    return `Ask ${narratorName.value} about ${
      activeDream.value.title || 'this Dream'
    }...`
  })

  watch(
    () => activeDream.value?.id,
    async () => {
      narratorSessionIds.value = []
      narratorMessage.value = ''
      statusMessage.value = ''
      selectedScenarioKey.value = ''
      showMoodRing.value = false
      setEmotion('NEUTRAL', false)

      await nextTick()

      selectFirstScenario()

      if (bubblesEnabled.value) {
        showBubbleForEmotion('NEUTRAL')
      }
    },
  )

  watch(
    () =>
      dreamScenarios.value
        .map((scenario, index) => scenarioKey(scenario, index))
        .join('|'),
    () => {
      selectFirstScenario()
    },
  )

  watch([isOpen, pinOpen, bubblesEnabled, activeScreen], saveSettings)

  async function initialize() {
    if (hasInitialized.value) return

    hasInitialized.value = true
    loadSettings()

    await Promise.all([
      dreamStore.initialize({ fetchRemote: true }),
      chatStore.initialize(),
      ...(serverStore.hasLoaded
        ? []
        : [serverStore.initialize({ fetchRemote: true })]),
    ])

    selectFirstScenario()

    if (bubblesEnabled.value) {
      showBubbleForEmotion(currentEmotion.value)
    }
  }

  function loadSettings() {
    if (!import.meta.client) return

    try {
      const raw = window.localStorage.getItem(narratorStorageKey)
      if (!raw) return

      const parsed = JSON.parse(raw) as {
        isOpen?: boolean
        pinOpen?: boolean
        bubblesEnabled?: boolean
        currentEmotion?: NarratorEmotion
        activeScreen?: NarratorScreen
      }

      pinOpen.value = Boolean(parsed.pinOpen)
      isOpen.value = Boolean(parsed.isOpen || parsed.pinOpen)
      bubblesEnabled.value = parsed.bubblesEnabled !== false
      currentEmotion.value = normalizeEmotion(parsed.currentEmotion)

      if (
        parsed.activeScreen === 'narrator' ||
        parsed.activeScreen === 'scenarios'
      ) {
        activeScreen.value = parsed.activeScreen
      }
    } catch {}
  }

  function saveSettings() {
    if (!import.meta.client) return

    try {
      window.localStorage.setItem(
        narratorStorageKey,
        JSON.stringify({
          isOpen: isOpen.value,
          pinOpen: pinOpen.value,
          bubblesEnabled: bubblesEnabled.value,
          currentEmotion: currentEmotion.value,
          activeScreen: activeScreen.value,
        }),
      )
    } catch {}
  }

  function setScreen(screen: NarratorScreen) {
    activeScreen.value = screen
  }

  function setEmotion(emotion: NarratorEmotion, showBubble = true) {
    currentEmotion.value = emotion

    if (showBubble) {
      showBubbleForEmotion(emotion)
    }
  }

  function cycleEmotion() {
    showMoodRing.value = true

    const options = emotionOptions.value.length
      ? emotionOptions.value
      : fallbackNarratorEmotions

    const currentIndex = options.indexOf(currentEmotion.value)
    const nextEmotion =
      options[(currentIndex + 1) % options.length] ?? 'NEUTRAL'

    setEmotion(nextEmotion)
  }

  function togglePanel() {
    isOpen.value = !isOpen.value

    if (isOpen.value) {
      clearBubble()
    } else {
      showBubbleForEmotion(currentEmotion.value)
    }
  }

  function closePanel(showBubble = true) {
    isOpen.value = false

    if (showBubble && bubblesEnabled.value) {
      showBubbleForEmotion(currentEmotion.value)
    }
  }

  function togglePin() {
    pinOpen.value = !pinOpen.value

    if (pinOpen.value) {
      isOpen.value = true
      clearBubble()
    }
  }

  function toggleBubbles() {
    bubblesEnabled.value = !bubblesEnabled.value

    if (!bubblesEnabled.value) {
      clearBubble()
      return
    }

    showBubbleForEmotion(currentEmotion.value)
  }

  function clearBubble() {
    activeBubble.value = ''

    if (bubbleTimer) {
      clearTimeout(bubbleTimer)
      bubbleTimer = null
    }
  }

  function showBubbleForEmotion(emotion: NarratorEmotion) {
    if (!bubblesEnabled.value || isOpen.value) return

    const row = emotionRows.value.find(
      (entry) => normalizeEmotion(readExpressionValue(entry)) === emotion,
    )
    const message = pickEmotionPhrase(row)

    if (!message) return

    activeBubble.value = message

    if (bubbleTimer) clearTimeout(bubbleTimer)

    bubbleTimer = setTimeout(() => {
      activeBubble.value = ''
      bubbleTimer = null
    }, 7000)
  }

  function pickEmotionPhrase(row?: NarratorEmotionImage | null) {
    const phrases = [
      row?.message,
      ...readStringArray(row?.additionalPhrases),
      ...narratorExtraTexts.value,
    ]
      .filter((phrase): phrase is string => typeof phrase === 'string')
      .map(cleanPublicNarratorText)
      .filter(Boolean)

    const selected = phrases.length
      ? phrases[Math.floor(Math.random() * phrases.length)]
      : fallbackEmotionPhrase({
          emotion: currentEmotion.value,
          narratorName: narratorName.value,
          dreamTitle: activeDream.value?.title,
        })

    return applyNarratorTemplate(selected || '', {
      narratorName: narratorName.value,
      dreamTitle: activeDream.value?.title,
    })
  }

  function selectFirstScenario() {
    const scenarios = dreamScenarios.value
    const firstScenario = scenarios[0]

    if (!firstScenario) {
      selectedScenarioKey.value = ''
      return
    }

    const currentExists = scenarios.some(
      (scenario, index) =>
        scenarioKey(scenario, index) === selectedScenarioKey.value,
    )

    if (!currentExists) {
      selectedScenarioKey.value = scenarioKey(firstScenario, 0)
    }
  }

  function selectScenario(scenario: DreamScenario, index = 0) {
    selectedScenarioKey.value = scenarioKey(scenario, index)
  }

  function scenarioButtonClass(scenario: DreamScenario, index = 0) {
    return scenarioKey(scenario, index) === selectedScenarioKey.value
      ? 'border-primary/50 bg-primary/10'
      : 'border-base-300 hover:bg-base-200'
  }

  async function applyStarterPrompt(starter: NarratorStarterPrompt) {
    isOpen.value = true
    clearBubble()

    if (starter.screen) {
      activeScreen.value = starter.screen
    } else {
      activeScreen.value = 'narrator'
    }

    if (starter.key === 'scenario') {
      setEmotion('PROUD')
    } else {
      setEmotion('EXCITED')
    }

    if (starter.flavor) {
      activeBubble.value = applyNarratorTemplate(starter.flavor, {
        narratorName: narratorName.value,
        dreamTitle: activeDream.value?.title,
      })
    }

    if (starter.prompt) {
      narratorMessage.value = applyNarratorTemplate(starter.prompt, {
        narratorName: narratorName.value,
        dreamTitle: activeDream.value?.title,
      })
    }

    if (starter.action === 'navigate' && starter.path) {
      await navigateTo(starter.path)
    }
  }

  async function navigateWithNarrator(actionOrKey: NarratorNavAction | string) {
    const action =
      typeof actionOrKey === 'string'
        ? findNarratorNavAction(actionOrKey)
        : actionOrKey

    if (!action) return

    if (action.flavor) {
      activeBubble.value = applyNarratorTemplate(action.flavor, {
        narratorName: narratorName.value,
        dreamTitle: activeDream.value?.title,
      })
    }

    if (action.prompt) {
      narratorMessage.value = applyNarratorTemplate(action.prompt, {
        narratorName: narratorName.value,
        dreamTitle: activeDream.value?.title,
      })
    }

    await navigateTo(action.path)
  }

  function prepareBuildPrompt() {
    if (!activeDream.value) {
      activeScreen.value = 'scenarios'
      isOpen.value = true
      return
    }

    activeScreen.value = 'narrator'
    isOpen.value = true
    clearBubble()
    setEmotion('EXCITED')

    narratorMessage.value = [
      `Help me expand the Dream "${activeDream.value.title}".`,
      'Suggest one character, one scenario/location, one related Dream, and one art direction.',
      'Keep it punchy and immediately usable.',
    ].join('\n')
  }

  function prepareStoryPrompt() {
    if (!activeDream.value) {
      activeScreen.value = 'scenarios'
      isOpen.value = true
      return
    }

    activeScreen.value = 'narrator'
    isOpen.value = true
    clearBubble()
    setEmotion('PROUD')

    narratorMessage.value = [
      `Start an interactive opening scene for the Dream "${activeDream.value.title}".`,
      'Use the connected characters and scenarios if they exist.',
      'End with 2 or 3 choices for the user.',
    ].join('\n')
  }

  function prepareScenarioSeedPrompt() {
    if (!activeDream.value) {
      activeScreen.value = 'scenarios'
      isOpen.value = true
      return
    }

    activeScreen.value = 'narrator'
    isOpen.value = true
    clearBubble()
    setEmotion('EXCITED')

    narratorMessage.value = [
      `Create 3 scenario options for the Dream "${activeDream.value.title}".`,
      'Each scenario should include a title, a playable location, a central tension, and one visual hook.',
      'Make them distinct, immediately usable, and weird in a good way.',
    ].join('\n')
  }

  function prepareScenarioStoryPrompt() {
    const dream = activeDream.value
    const scenario = selectedScenario.value

    if (!dream || !scenario) return

    activeScreen.value = 'narrator'
    isOpen.value = true
    clearBubble()
    setEmotion('PROUD')

    narratorMessage.value = [
      `Start an interactive scene for the Dream "${dream.title}".`,
      `Scenario: ${scenarioTitle(scenario)}`,
      scenarioSummary(scenario),
      'Use a vivid opening beat and end with 2 or 3 choices.',
    ]
      .filter(Boolean)
      .join('\n')
  }

  function prepareScenarioBuildPrompt() {
    const dream = activeDream.value
    const scenario = selectedScenario.value

    if (!dream || !scenario) return

    activeScreen.value = 'narrator'
    isOpen.value = true
    clearBubble()
    setEmotion('EXCITED')

    narratorMessage.value = [
      `Remix and expand this scenario for the Dream "${dream.title}".`,
      `Scenario: ${scenarioTitle(scenario)}`,
      scenarioSummary(scenario),
      'Give me one stronger conflict, one strange NPC or character seed, one environmental twist, and one art direction.',
    ]
      .filter(Boolean)
      .join('\n')
  }

  function buildNarratorSystemPrompt() {
    const dream = activeDream.value
    const bot = narratorBot.value

    return [
      bot?.prompt ||
        'You are the workspace Narrator, a focused assistant for building and playing Dream experiences.',
      bot?.personality ? `Personality: ${bot.personality}` : '',
      bot?.narrativeVoice ? `Narrative voice: ${bot.narrativeVoice}` : '',
      bot?.forgeIntro ? `Forge guidance: ${bot.forgeIntro}` : '',
      bot?.botIntro ? `Bot intro: ${bot.botIntro}` : '',
      dream
        ? [
            `Active Dream: ${dream.title}`,
            dream.dreamType ? `Dream type: ${dream.dreamType}` : '',
            dream.pitch || dream.description || dream.flavorText || '',
            dream.Scenarios?.length
              ? `Scenarios: ${dream.Scenarios.map((scenario) =>
                  scenarioTitle(scenario),
                )
                  .filter(Boolean)
                  .join(', ')}`
              : '',
            dream.Characters?.length
              ? `Characters: ${dream.Characters.map(
                  (character) => character.name,
                )
                  .filter(Boolean)
                  .join(', ')}`
              : '',
            dream.Rewards?.length
              ? `Rewards: ${dream.Rewards.map((reward) => reward.name)
                  .filter(Boolean)
                  .join(', ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n')
        : '',
      selectedScenario.value
        ? [
            `Selected scenario: ${scenarioTitle(selectedScenario.value)}`,
            scenarioSummary(selectedScenario.value),
          ]
            .filter(Boolean)
            .join('\n')
        : '',
      'Help build more elements, start stories, and add vivid flavor. Stay scoped to the active Dream. Do not act like a public chatroom.',
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  function buildNarratorMessages(nextUserMessage: string): BotCafeMessage[] {
    const previousMessages = narratorSession.value.flatMap((chat) => {
      const messages: BotCafeMessage[] = [
        {
          role: 'user',
          content: chat.content,
        },
      ]

      if (chat.botResponse) {
        messages.push({
          role: 'assistant',
          content: chat.botResponse,
        })
      }

      return messages
    })

    return [
      {
        role: 'system',
        content: buildNarratorSystemPrompt(),
      },
      ...previousMessages,
      {
        role: 'user',
        content: nextUserMessage,
      },
    ]
  }

  function setStatus(message: string, tone: 'success' | 'error' = 'success') {
    statusMessage.value = message
    statusTone.value = tone
  }

  function clearSession() {
    narratorSessionIds.value = []
    narratorMessage.value = ''
    statusMessage.value = ''
  }

  async function sendNarratorMessage() {
    const dream = activeDream.value
    const bot = narratorBot.value
    const content = narratorMessage.value.trim()

    if (!dream || !bot || !content || isNarratorResponding.value) return

    statusMessage.value = ''
    promptStore.currentPrompt = content
    setEmotion('EXCITED', false)

    try {
      const server = runtimeTextServer.value
      const userId = userStore.userId ?? userStore.user?.id ?? 10

      const payload: ChatRuntimeInput = {
        botId: bot.id,
        botName: bot.name,
        dreamId: dream.id,
        content,
        isPublic: false,
        userId,
        type: 'ToBot',
        recipientId: bot.id,
        characterId: null,
        serverId: server?.id ?? null,
        serverName: server?.title ?? server?.label ?? null,
      } as ChatRuntimeInput

      const messages = buildNarratorMessages(content)
      const newChat = await chatStore.addChat(payload)

      if (!newChat?.id) {
        throw new Error('Failed to create Narrator message.')
      }

      narratorSessionIds.value.push(newChat.id)
      narratorMessage.value = ''

      await chatStore.streamResponse(newChat.id, {
        model: server?.model || 'gpt-4o-mini',
        temperature: 0.82,
        maxTokens: 1400,
        serverId: server?.id ?? null,
        serverName: server?.title ?? server?.label ?? null,
        serverSelectionMode: server ? 'specific' : 'default',
        messages,
        stream: true,
      })

      setEmotion('HAPPY')
    } catch (error) {
      setEmotion('CONFUSED')
      setStatus(
        error instanceof Error
          ? error.message
          : 'Narrator request failed. Check Dream narrator bot and text server settings.',
        'error',
      )
    }
  }

  function disposeTimers() {
    if (bubbleTimer) {
      clearTimeout(bubbleTimer)
      bubbleTimer = null
    }
  }

  function readEmotionImage(row?: NarratorEmotionImage | null) {
    if (!row) return ''

    return (
      row.imagePath ||
      row.ArtImage?.imagePath ||
      row.ArtImage?.path ||
      row.ArtImage?.fileName ||
      ''
    )
  }

  function dreamImage(dream?: DreamWithNarrator | null) {
    if (!dream) return ''

    const artImage = dream.ArtImage as ArtImageLike | null | undefined
    const collectionImage = dream.ArtCollection?.ArtImages?.[0] as
      | ArtImageLike
      | undefined

    return (
      dream.imagePath ||
      dream.highlightImage ||
      artImage?.imagePath ||
      artImage?.path ||
      artImage?.fileName ||
      collectionImage?.imagePath ||
      collectionImage?.path ||
      collectionImage?.fileName ||
      ''
    )
  }

  return {
    isOpen,
    pinOpen,
    bubblesEnabled,
    activeScreen,
    selectedScenarioKey,
    currentEmotion,
    showMoodRing,
    activeBubble,
    narratorMessage,
    statusMessage,
    statusTone,
    narratorSessionIds,
    hasInitialized,
    isDreamWorkspace,
    shouldRender,
    activeDream,
    dreamNarrators,
    dreamScenarios,
    selectedScenario,
    narratorBot,
    emotionRows,
    emotionOptions,
    currentEmotionRow,
    narratorName,
    narratorSummary,
    narratorMenuSummary: narratorMenuSummaryText,
    narratorExtraTexts,
    narratorHoverTitle,
    narratorImage,
    currentEmotionLabel,
    fallbackEmotionIcon,
    activeDreamSummary,
    narratorIntro,
    narratorStarterPrompts,
    runtimeTextServer,
    narratorSession,
    isNarratorResponding,
    canUseNarrator,
    canSendNarrator,
    narratorPlaceholder,
    initialize,
    loadSettings,
    saveSettings,
    setScreen,
    setEmotion,
    cycleEmotion,
    togglePanel,
    closePanel,
    togglePin,
    toggleBubbles,
    clearBubble,
    showBubbleForEmotion,
    pickEmotionPhrase,
    selectFirstScenario,
    selectScenario,
    scenarioButtonClass,
    applyStarterPrompt,
    navigateWithNarrator,
    prepareBuildPrompt,
    prepareStoryPrompt,
    prepareScenarioSeedPrompt,
    prepareScenarioStoryPrompt,
    prepareScenarioBuildPrompt,
    buildNarratorSystemPrompt,
    buildNarratorMessages,
    setStatus,
    clearSession,
    sendNarratorMessage,
    disposeTimers,
  }
})
