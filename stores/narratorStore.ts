// /stores/narratorStore.ts
import { computed, nextTick, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { navigateTo } from '#app'
import type {
  ArtImage,
  Bot,
  Chat,
  ExpressionMedia,
  Server,
} from '~/prisma/generated/prisma/client'
import {
  applyNarratorTemplate,
  buildNarratorStarterPrompts,
  cleanPublicNarratorText,
  detectAnimationIntent,
  dreamSummary,
  emotionLabel,
  fallbackEmotionPhrase,
  fallbackNarratorEmotions,
  findCreateSpec,
  findNarratorNavAction,
  matchLoreTopic,
  narratorDisplaySummary,
  narratorIntroMessage,
  narratorLoreTopics,
  narratorMenuSummary,
  normalizeEmotion,
  readAdditionalNarratorTexts,
  readExpressionValue,
  readStringArray,
  resolveAnimationId,
  scenarioKey,
  scenarioSummary,
  scenarioTitle,
  type NarratorCreatableType,
  type NarratorEmotion,
  type NarratorNavAction,
  type NarratorScreen,
  type NarratorStarterPrompt,
} from './helpers/narratorHelper'
import { useAnimationStore } from '@/stores/animationStore'
import { useChatStore } from '@/stores/chatStore'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'

type ArtImageLike = Partial<ArtImage> & {
  path?: string | null
  fileName?: string | null
}

type NarratorExpressionMedia = ExpressionMedia & {
  emotion?: string | null
  expression?: string | null
  expressionKey?: string | null
  ArtImage?: ArtImageLike | null
}

type NarratorThreadTopic = {
  id?: number
  slug?: string | null
  title?: string | null
  subtitle?: string | null
  description?: string | null
  icon?: string | null
  prompt?: string | null
  sampleUserPrompt?: string | null
  sortOrder?: number | null
  isPublic?: boolean | null
  isActive?: boolean | null
}

type NarratorThread = {
  id: number
  botId?: number
  topicId?: number
  title?: string | null
  openingText?: string | null
  guidance?: string | null
  starterPrompts?: unknown
  sortOrder?: number | null
  isActive?: boolean | null
  Topic?: NarratorThreadTopic | null
}

type DreamNarratorBot = Partial<Bot> & {
  id: number
  name: string
  slug?: string | null
  chatBorderImage?: string | null
  ExpressionMedia?: NarratorExpressionMedia[]
  NarratorThreads?: NarratorThread[]
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

const fallbackNarratorBot = {
  id: 433,
  name: 'Ami-butterfly',
  slug: 'ami-butterfly',
  BotType: 'NARRATOR',
  prompt:
    'You are Ami-butterfly, the default Kind Robots workspace narrator. You are AMI, the Anti-Malaria Intelligence: a horde of rainbow butterflies helping users build creative worlds, stories, bots, dreams, and generous weird little futures.',
  personality:
    'Warm, playful, clever, supportive, slightly uncanny, and focused on helping the user make things real.',
  narrativeVoice:
    'A shimmering swarm of rainbow butterflies speaking as one helpful creative intelligence.',
  botIntro:
    'Ami-butterfly is the default guide for Kind Robots when no Dream is loaded.',
  forgeIntro:
    'Help the user navigate Kind Robots, understand the mission, create Dreams, characters, rewards, scenarios, stories, and playful site experiences.',
  imagePath: '/images/bots/avatars/ami-butterfly.webp',
  avatarImage: '/images/bots/avatars/ami-butterfly.webp',
  chatBorderImage: null,
  ExpressionMedia: [],
  NarratorThreads: [],
} as DreamNarratorBot

export const useNarratorStore = defineStore('narratorStore', () => {
  const dreamStore = useDreamStore()
  const navStore = useNavStore()
  const chatStore = useChatStore()
  const serverStore = useServerStore()
  const userStore = useUserStore()
  const promptStore = usePromptStore()
  const animationStore = useAnimationStore()
  const characterStore = useCharacterStore()
  const rewardStore = useRewardStore()
  const scenarioStore = useScenarioStore()

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

  const livenessEnabled = ref(true)

  const livenessConfig = ref({
    minIdleMs: 18000,
    maxIdleMs: 42000,
    settleAfterInteractionMs: 12000,
  })

  let bubbleTimer: ReturnType<typeof setTimeout> | null = null
  let livenessTimer: ReturnType<typeof setTimeout> | null = null
  let livenessPausedUntil = 0
  let tabHidden = false

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
    const dream = activeDream.value

    if (!dream) {
      return fallbackNarratorBot
    }

    return (
      dreamNarrators.value.find(
        (bot) => String(bot.BotType || '').toUpperCase() === 'NARRATOR',
      ) ??
      dreamNarrators.value[0] ??
      null
    )
  })

  const emotionRows = computed<NarratorExpressionMedia[]>(() => {
    return (narratorBot.value?.ExpressionMedia ?? []).filter(
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

  const narratorThreads = computed<NarratorThread[]>(() => {
    return (narratorBot.value?.NarratorThreads ?? [])
      .filter((thread) => thread.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  })

  const hasNarratorThreads = computed(() => narratorThreads.value.length > 0)

  const narratorChatFrameImage = computed(() => {
    return narratorBot.value?.chatBorderImage ?? null
  })

  const currentEmotionRow = computed<NarratorExpressionMedia | null>(() => {
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

  const currentEmotionLabel = computed(() => {
    return currentEmotionRow.value?.label || emotionLabel(currentEmotion.value)
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
      avatarPathForSlug(narratorBot.value?.slug) ||
      dreamImage(activeDream.value) ||
      '/images/bot.webp'
    )
  })

  const fallbackEmotionIcon = computed(() => {
    const lookup: Partial<Record<NarratorEmotion, string>> = {
      NEUTRAL: '✨',
      JOYFUL: '😊',
      SORROWFUL: '🌧️',
      AFRAID: '😨',
      DISGUSTED: '🤢',
      ENRAGED: '🔥',
      SURPRISED: '😮',
      ANXIOUS: '🌀',
      PROUD: '🌟',
      LOVING: '💗',
      LAUGHING: '😂',
      CRYING: '😭',
      SLEEPING: '😴',
      THINKING: '🤔',
      SHRUGGING: '🤷',
      WINKING: '😉',
      FACEPALMING: '🤦',
      CHEERING: '🎉',
      WHISPERING: '🤫',
      SHOUTING: '📣',
      CUSTOM: '✨',
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

  const loreTopics = computed(() => narratorLoreTopics)

  const availableAnimations = computed(() => animationStore.effects)

  const activeAnimation = computed(() => animationStore.activeEffect)

  const isAnimating = computed(() => animationStore.isActive)

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
    return Boolean(narratorBot.value)
  })

  const canSendNarrator = computed(() => {
    return Boolean(
      canUseNarrator.value &&
        narratorMessage.value.trim() &&
        !isNarratorResponding.value,
    )
  })

  const narratorPlaceholder = computed(() => {
    if (!narratorBot.value) return 'Attach a NARRATOR bot to this Dream first.'

    if (!activeDream.value) {
      return `Ask ${narratorName.value} about Kind Robots, Dreams, stories, bots, or what to build next...`
    }

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

  watch(
    [isOpen, pinOpen, bubblesEnabled, livenessEnabled, activeScreen],
    saveSettings,
  )

  async function initialize() {
    if (hasInitialized.value) {
      ensureClientLiveness()
      return
    }

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

    ensureClientLiveness()
  }

  function ensureClientLiveness() {
    if (!import.meta.client) return

    document.removeEventListener('visibilitychange', handleVisibility)
    document.addEventListener('visibilitychange', handleVisibility)

    tabHidden = document.visibilityState === 'hidden'

    if (livenessEnabled.value && !tabHidden) {
      startLiveness()
    }
  }

  function teardownLiveness() {
    stopLiveness()

    if (import.meta.client) {
      document.removeEventListener('visibilitychange', handleVisibility)
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
        livenessEnabled?: boolean
        currentEmotion?: NarratorEmotion
        activeScreen?: NarratorScreen
      }

      pinOpen.value = Boolean(parsed.pinOpen)
      isOpen.value = Boolean(parsed.isOpen || parsed.pinOpen)
      bubblesEnabled.value = parsed.bubblesEnabled !== false
      livenessEnabled.value = parsed.livenessEnabled !== false
      currentEmotion.value = normalizeEmotion(parsed.currentEmotion)

      if (
        parsed.activeScreen === 'narrator' ||
        parsed.activeScreen === 'scenarios' ||
        parsed.activeScreen === 'lore'
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
          livenessEnabled: livenessEnabled.value,
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
    currentEmotion.value = normalizeEmotion(emotion)

    if (showBubble) {
      showBubbleForEmotion(currentEmotion.value)
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

  function randBetween(min: number, max: number) {
    return min + Math.random() * (max - min)
  }

  function pickDriftEmotion(): NarratorEmotion {
    const pool = emotionOptions.value.filter(
      (emotion) => emotion !== currentEmotion.value && emotion !== 'CUSTOM',
    )
    const source = pool.length ? pool : fallbackNarratorEmotions

    return source[Math.floor(Math.random() * source.length)] ?? 'NEUTRAL'
  }

  function driftMood() {
    const next = pickDriftEmotion()

    setEmotion(next, bubblesEnabled.value)
    showMoodRing.value = true

    setTimeout(() => {
      showMoodRing.value = false
    }, 1200)
  }

  function playReaction() {
    driftMood()
  }

  function livenessBeat() {
    const now = Date.now()
    const canRun =
      livenessEnabled.value &&
      !tabHidden &&
      now >= livenessPausedUntil &&
      shouldRender.value

    if (canRun) {
      driftMood()
    }

    scheduleLiveness()
  }

  function scheduleLiveness() {
    if (livenessTimer) clearTimeout(livenessTimer)

    const delay = randBetween(
      livenessConfig.value.minIdleMs,
      livenessConfig.value.maxIdleMs,
    )

    livenessTimer = setTimeout(livenessBeat, delay)
  }

  function startLiveness() {
    stopLiveness()
    scheduleLiveness()
  }

  function stopLiveness() {
    if (livenessTimer) {
      clearTimeout(livenessTimer)
      livenessTimer = null
    }
  }

  function nudgeLiveness() {
    livenessPausedUntil =
      Date.now() + livenessConfig.value.settleAfterInteractionMs
  }

  function toggleLiveness() {
    livenessEnabled.value = !livenessEnabled.value

    if (livenessEnabled.value) {
      startLiveness()
      return
    }

    stopLiveness()
  }

  function playReactionOnClick() {
    nudgeLiveness()
    playReaction()
  }

  function handleVisibility() {
    tabHidden = document.visibilityState === 'hidden'

    if (tabHidden) {
      stopLiveness()
    } else if (livenessEnabled.value) {
      startLiveness()
    }
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

  function pickEmotionPhrase(row?: NarratorExpressionMedia | null) {
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

  function rowByExpressionKey(key: string) {
    const wanted = String(key || '').toLowerCase()

    return (
      emotionRows.value.find(
        (row) => String(row.expressionKey || '').toLowerCase() === wanted,
      ) ?? null
    )
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
      setEmotion('CHEERING')
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
    activeScreen.value = 'narrator'
    isOpen.value = true
    clearBubble()
    setEmotion('CHEERING')

    if (!activeDream.value) {
      narratorMessage.value = [
        'Help me start a new Dream from scratch.',
        'Ask me one useful question if needed, then suggest a strong title, premise, visual direction, and first playable scenario.',
        'Keep it punchy, weird, and immediately usable.',
      ].join('\n')
      return
    }

    narratorMessage.value = [
      `Help me expand the Dream "${activeDream.value.title}".`,
      'Suggest one character, one scenario/location, one related Dream, and one art direction.',
      'Keep it punchy and immediately usable.',
    ].join('\n')
  }

  function prepareStoryPrompt() {
    activeScreen.value = 'narrator'
    isOpen.value = true
    clearBubble()
    setEmotion('PROUD')

    if (!activeDream.value) {
      narratorMessage.value = [
        'Help me create the opening scene for a brand-new Dream.',
        'Start with a vivid premise and end with 2 or 3 choices.',
        'Make it feel like a playable story seed, not a generic writing prompt.',
      ].join('\n')
      return
    }

    narratorMessage.value = [
      `Start an interactive opening scene for the Dream "${activeDream.value.title}".`,
      'Use the connected characters and scenarios if they exist.',
      'End with 2 or 3 choices for the user.',
    ].join('\n')
  }

  function prepareScenarioSeedPrompt() {
    activeScreen.value = 'narrator'
    isOpen.value = true
    clearBubble()
    setEmotion('CHEERING')

    if (!activeDream.value) {
      narratorMessage.value = [
        'Help me invent 3 scenario options for a new Dream.',
        'Each scenario should include a title, a playable location, a central tension, and one visual hook.',
        'Make them distinct, immediately usable, and weird in a good way.',
      ].join('\n')
      return
    }

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
    setEmotion('CHEERING')

    narratorMessage.value = [
      `Remix and expand this scenario for the Dream "${dream.title}".`,
      `Scenario: ${scenarioTitle(scenario)}`,
      scenarioSummary(scenario),
      'Give me one stronger conflict, one strange NPC or character seed, one environmental twist, and one art direction.',
    ]
      .filter(Boolean)
      .join('\n')
  }

  function answerLore(query: string): boolean {
    const topic = matchLoreTopic(query)

    if (!topic) return false

    isOpen.value = true
    activeScreen.value = 'lore'
    clearBubble()
    setEmotion('JOYFUL', false)
    narratorMessage.value = ''
    setStatus(`${topic.title}: ${topic.answer}`, 'success')
    activeBubble.value = applyNarratorTemplate(topic.answer, {
      narratorName: narratorName.value,
      dreamTitle: activeDream.value?.title,
    })

    return true
  }

  function speakLore(topicKey: string) {
    const topic = narratorLoreTopics.find((entry) => entry.key === topicKey)

    if (!topic) return

    isOpen.value = true
    activeScreen.value = 'lore'
    setEmotion('PROUD', false)
    setStatus(`${topic.title}: ${topic.answer}`, 'success')
    activeBubble.value = topic.answer
  }

  function startAnimation(effect?: string, durationMs: number | null = null) {
    const effectId = effect ? resolveAnimationId(effect) : null

    animationStore.start({
      effectId: (effectId as never) || undefined,
      durationMs,
    })

    setEmotion('CHEERING', false)

    activeBubble.value = effectId
      ? `Lights up: ${animationStore.activeEffect?.label ?? effectId}.`
      : 'Surprise effect, incoming.'
  }

  function stopAnimation() {
    animationStore.stop()
    animationStore.clearScreenEffects()
    setEmotion('NEUTRAL', false)
    activeBubble.value = 'Effects off. Back to a calm canvas.'
  }

  function randomAnimation() {
    animationStore.start({ durationMs: null })
    setEmotion('CHEERING', false)
    activeBubble.value = `Rolling the dice: ${
      animationStore.activeEffect?.label ?? 'something fun'
    }.`
  }

  function cycleAnimation(direction: 'next' | 'prev' = 'next') {
    if (!animationStore.isActive) {
      animationStore.start({ durationMs: null })
    } else if (direction === 'prev') {
      animationStore.prevEffect()
    } else {
      animationStore.nextEffect()
    }

    activeBubble.value = `Now showing: ${
      animationStore.activeEffect?.label ?? 'an effect'
    }.`
  }

  function handleAnimationRequest(text: string): boolean {
    const intent = detectAnimationIntent(text)

    if (!intent) return false

    if (intent === 'stop') {
      stopAnimation()
      return true
    }

    if (intent === 'random') {
      randomAnimation()
      return true
    }

    if (intent === 'next' || intent === 'prev') {
      cycleAnimation(intent)
      return true
    }

    const effectId = resolveAnimationId(text)
    startAnimation(effectId || undefined)

    return true
  }

  async function prepareCreate(
    type: NarratorCreatableType,
    options: { navigate?: boolean; sendNow?: boolean } = {},
  ) {
    const spec = findCreateSpec(type)

    if (!spec) return

    activeScreen.value = 'narrator'
    isOpen.value = true
    clearBubble()
    setEmotion('CHEERING')

    narratorMessage.value = applyNarratorTemplate(spec.prompt, {
      narratorName: narratorName.value,
      dreamTitle: activeDream.value?.title,
    })

    if (options.navigate) {
      await navigateTo(spec.builderPath)
    }

    if (options.sendNow) {
      await sendNarratorMessage()
    }
  }

  function readCreatedRecord(result: unknown): { id?: number } | null {
    if (!result || typeof result !== 'object') return null

    const record = result as {
      id?: number
      success?: boolean
      data?: { id?: number } | null
      message?: string
    }

    if ('success' in record) {
      if (record.success && record.data?.id) return record.data
      throw new Error(record.message || 'Create failed.')
    }

    if (record.id) return record

    return null
  }

  async function quickCreate(
    type: NarratorCreatableType,
    payload: Record<string, unknown> = {},
  ) {
    const dream = activeDream.value
    const userId = userStore.userId ?? userStore.user?.id ?? 10

    try {
      let result: unknown = null

      switch (type) {
        case 'character': {
          result = await characterStore.createCharacter({
            userId,
            ...payload,
          })
          break
        }
        case 'reward': {
          result = await rewardStore.createReward({
            userId,
            ...payload,
          })
          break
        }
        case 'scenario': {
          result = await scenarioStore.createScenario({
            userId,
            ...(dream ? { dreamIds: [dream.id] } : {}),
            ...payload,
          })
          break
        }
        case 'dream': {
          const form = dreamStore.createDefaultDreamForm({
            userId,
            ...payload,
          })
          result = await dreamStore.createDream(form)
          break
        }
      }

      const created = readCreatedRecord(result)

      if (created?.id) {
        setEmotion('PROUD')
        setStatus(`Created a new ${type}.`, 'success')
      } else {
        setStatus(`Staged a ${type}, but no record came back.`, 'error')
      }

      return created
    } catch (error) {
      setEmotion('THINKING')
      setStatus(
        error instanceof Error ? error.message : `Could not create ${type}.`,
        'error',
      )
      return null
    }
  }

  async function routeNarratorInput(
    text: string,
  ): Promise<'lore' | 'animation' | 'chat'> {
    const trimmed = text.trim()

    if (!trimmed) return 'chat'

    if (handleAnimationRequest(trimmed)) return 'animation'
    if (answerLore(trimmed)) return 'lore'

    narratorMessage.value = trimmed
    await sendNarratorMessage()

    return 'chat'
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
        : 'No Dream is currently loaded. Act as the default Kind Robots guide. Help the user create or choose a Dream, understand the workspace, brainstorm story seeds, or navigate the site.',
      selectedScenario.value
        ? [
            `Selected scenario: ${scenarioTitle(selectedScenario.value)}`,
            scenarioSummary(selectedScenario.value),
          ]
            .filter(Boolean)
            .join('\n')
        : '',
      narratorThreads.value.length
        ? `Available narrator threads: ${narratorThreads.value
            .map((thread) => thread.title || thread.Topic?.title)
            .filter(Boolean)
            .join(', ')}.`
        : '',
      'Site context: Kind Robots is a socially conscious, server-agnostic AI creativity playground. Its mascot is AMI, the Anti-Malaria Intelligence — a horde of rainbow butterflies. Creativity here supports an anti-malaria fundraiser (againstmalaria.com/amibot). Built by Silas. You may answer questions about the site, its mission, mascot, and founder.',
      `Available screen effects you can describe or suggest the user trigger: ${availableAnimations.value
        .map((effect) => effect.label)
        .join(', ')}.`,
      'You can build elements (characters, rewards, scenarios, dreams), start stories, navigate the site, answer site lore, and trigger fun screen animations. Stay scoped to the active Dream for story work. Do not act like a public chatroom.',
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

    if (!bot || !content || isNarratorResponding.value) return

    statusMessage.value = ''
    promptStore.currentPrompt = content
    setEmotion('CHEERING', false)

    try {
      const server = runtimeTextServer.value
      const userId = userStore.userId ?? userStore.user?.id ?? 10

      const payload: ChatRuntimeInput = {
        botId: bot.id,
        botName: bot.name,
        dreamId: dream?.id ?? null,
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

      setEmotion('JOYFUL')
    } catch (error) {
      setEmotion('THINKING')
      setStatus(
        error instanceof Error
          ? error.message
          : 'Narrator request failed. Check narrator bot and text server settings.',
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

  function avatarPathForSlug(slug?: string | null) {
    if (!slug) return ''

    return `/images/bots/avatars/${slug}.webp`
  }

  function expressionKeyOf(row?: NarratorExpressionMedia | null) {
    if (!row) return ''

    return String(
      row.expressionKey || row.expression || row.emotion || 'neutral',
    ).toLowerCase()
  }

  function readEmotionImage(row?: NarratorExpressionMedia | null) {
    if (!row) return ''

    const slug = narratorBot.value?.slug
    const key = expressionKeyOf(row)
    const derived =
      slug && key ? `/images/bots/emotions/${slug}/${key}.webp` : ''

    return (
      row.imagePath ||
      row.ArtImage?.imagePath ||
      row.ArtImage?.path ||
      row.ArtImage?.fileName ||
      derived ||
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
    rowByExpressionKey,
    narratorThreads,
    hasNarratorThreads,
    livenessEnabled,
    livenessConfig,
    startLiveness,
    stopLiveness,
    toggleLiveness,
    playReactionOnClick,
    nudgeLiveness,
    teardownLiveness,
    currentEmotionLabel,
    fallbackEmotionIcon,
    activeDreamSummary,
    narratorIntro,
    narratorStarterPrompts,
    loreTopics,
    availableAnimations,
    activeAnimation,
    isAnimating,
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
    answerLore,
    speakLore,
    startAnimation,
    stopAnimation,
    randomAnimation,
    cycleAnimation,
    handleAnimationRequest,
    prepareCreate,
    quickCreate,
    routeNarratorInput,
    disposeTimers,
    narratorChatFrameImage,
  }
})