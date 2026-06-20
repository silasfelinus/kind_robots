import { computed, ref, watch } from 'vue'
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

type ArtImageLike = Partial<ArtImage> & {
  path?: string | null
  fileName?: string | null
}

type NarratorExpressionMedia = ExpressionMedia & {
  // tolerate old + new field shapes during migration
  emotion?: string | null
  expression?: string | null
  expressionKey?: string | null
  videoPath?: string | null
  ArtImage?: ArtImageLike | null
}

type DreamNarratorBot = Partial<Bot> & {
  id: number
  name: string
  slug?: string | null
  ExpressionMedia?: NarratorExpressionMedia[]
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
  const animationStore = useAnimationStore()

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

  // ── Liveness system: ambient mood drift + occasional reaction videos ──
  // Global toggle (persisted with other settings).
  const livenessEnabled = ref(true)

  // Tunable config — adjust to taste. All times in milliseconds.
  const livenessConfig = ref({
    // Idle heartbeat window: next event fires somewhere in [min, max].
    minIdleMs: 18000,
    maxIdleMs: 42000,
    // Of each heartbeat, chance (0..1) it's a VIDEO reaction vs a mood drift.
    videoChance: 0.35,
    // How long a reaction video plays before settling back to the still.
    videoDurationMs: 4500,
    // Pause liveness for this long after any manual interaction.
    settleAfterInteractionMs: 12000,
  })

  // True while a reaction loop is actively shown in the hero portrait.
  const playingVideo = ref(false)

  let livenessTimer: ReturnType<typeof setTimeout> | null = null
  let videoStopTimer: ReturnType<typeof setTimeout> | null = null
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

  const currentEmotionRow = computed<NarratorExpressionMedia | null>(() => {
    // Match on the normalized expression first (covers all canonical values).
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

  // Resolve a specific row by its expressionKey (needed for CUSTOM actions,
  // where multiple rows share expression = CUSTOM but differ by key).
  function rowByExpressionKey(key: string) {
    const wanted = String(key || '').toLowerCase()
    return (
      emotionRows.value.find(
        (row) => String(row.expressionKey || '').toLowerCase() === wanted,
      ) ?? null
    )
  }

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
      avatarPathForSlug(narratorBot.value?.slug) ||
      dreamImage(activeDream.value) ||
      '/images/bot.webp'
    )
  })

  // Reaction loop for the current expression, if one exists (else empty -> UI shows still).
  const narratorVideo = computed(() => {
    // Only surface the loop while actively playing (click or ambient beat).
    if (!playingVideo.value) return ''
    return readEmotionVideo(currentEmotionRow.value)
  })

  const currentEmotionLabel = computed(() => {
    return currentEmotionRow.value?.label || emotionLabel(currentEmotion.value)
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

  watch(
    [isOpen, pinOpen, bubblesEnabled, livenessEnabled, activeScreen],
    saveSettings,
  )

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

    if (import.meta.client) {
      document.addEventListener('visibilitychange', handleVisibility)
      tabHidden = document.visibilityState === 'hidden'
      if (livenessEnabled.value && !tabHidden) startLiveness()
    }
  }

  // Tear down timers + listeners (call from component onUnmounted/onScopeDispose).
  function teardownLiveness() {
    stopLiveness()
    if (videoStopTimer) {
      clearTimeout(videoStopTimer)
      videoStopTimer = null
    }
    playingVideo.value = false
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

  // ── Liveness engine ───────────────────────────────────────────────────────

  function randBetween(min: number, max: number) {
    return min + Math.random() * (max - min)
  }

  // Rows that actually have a playable reaction video.
  const videoRows = computed(() =>
    emotionRows.value.filter((row) => Boolean(readEmotionVideo(row))),
  )

  // Pick a mood to drift to. Prefers the bot's known expressions, falls back
  // to the full emotion list (image gracefully falls back to neutral if absent).
  function pickDriftEmotion(): NarratorEmotion {
    const pool = emotionOptions.value.filter(
      (e) => e !== currentEmotion.value && e !== 'CUSTOM',
    )
    const source = pool.length ? pool : fallbackNarratorEmotions
    return source[Math.floor(Math.random() * source.length)] ?? 'NEUTRAL'
  }

  // Drift to a new mood (swaps the still image to that mood if available).
  function driftMood() {
    const next = pickDriftEmotion()
    setEmotion(next, bubblesEnabled.value)
    showMoodRing.value = true
    setTimeout(() => (showMoodRing.value = false), 1200)
  }

  // Play a reaction video for the current (or a random video-having) expression,
  // then settle back to the still.
  function playReaction(row?: NarratorExpressionMedia | null) {
    const target =
      row ||
      (readEmotionVideo(currentEmotionRow.value)
        ? currentEmotionRow.value
        : videoRows.value[Math.floor(Math.random() * videoRows.value.length)])

    if (!target || !readEmotionVideo(target)) {
      // No video to play — drift instead so the beat isn't wasted.
      driftMood()
      return
    }

    // Align current emotion to the row so the hero shows the right loop.
    const rowEmotion = normalizeEmotion(readExpressionValue(target))
    if (rowEmotion !== 'CUSTOM') setEmotion(rowEmotion, false)

    playingVideo.value = true
    if (videoStopTimer) clearTimeout(videoStopTimer)
    videoStopTimer = setTimeout(() => {
      playingVideo.value = false
      videoStopTimer = null
    }, livenessConfig.value.videoDurationMs)
  }

  // One heartbeat: decide drift vs video, then schedule the next.
  function livenessBeat() {
    const now = Date.now()
    const canRun =
      livenessEnabled.value &&
      !tabHidden &&
      now >= livenessPausedUntil &&
      shouldRender.value

    if (canRun) {
      const wantVideo =
        videoRows.value.length > 0 &&
        Math.random() < livenessConfig.value.videoChance
      if (wantVideo) playReaction()
      else driftMood()
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

  // Manual interaction: pause ambient drift briefly so it doesn't fight the user.
  function nudgeLiveness() {
    livenessPausedUntil =
      Date.now() + livenessConfig.value.settleAfterInteractionMs
  }

  function toggleLiveness() {
    livenessEnabled.value = !livenessEnabled.value
    if (livenessEnabled.value) startLiveness()
    else {
      stopLiveness()
      playingVideo.value = false
      if (videoStopTimer) {
        clearTimeout(videoStopTimer)
        videoStopTimer = null
      }
    }
  }

  // Click the portrait -> play its reaction now (and settle ambient timing).
  function playReactionOnClick() {
    nudgeLiveness()
    playReaction(currentEmotionRow.value)
  }

  // Tab visibility: pause when hidden, resume when shown.
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
    if (!activeDream.value) {
      activeScreen.value = 'scenarios'
      isOpen.value = true
      return
    }

    activeScreen.value = 'narrator'
    isOpen.value = true
    clearBubble()
    setEmotion('CHEERING')

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
    setEmotion('CHEERING')

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

  // ── Site lore / founder Q&A ───────────────────────────────────────────────
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

  // ── Animation control ─────────────────────────────────────────────────────
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

    // 'start' — try to resolve a named effect from the phrase.
    const effectId = resolveAnimationId(text)
    startAnimation(effectId || undefined)

    return true
  }

  // ── Object creation ───────────────────────────────────────────────────────
  // Stages a drafting prompt for the given type and routes to its builder.
  // Set sendNow to also fire the Narrator chat request immediately.
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

  // Direct create path. Wire these to your real store methods.
  // Each store method is expected to accept a partial payload and return the
  // created record (with an id). Adjust names to match your stores.
  async function quickCreate(
    type: NarratorCreatableType,
    payload: Record<string, unknown> = {},
  ) {
    const dream = activeDream.value
    const userId = userStore.userId ?? userStore.user?.id ?? 10

    const base = {
      userId,
      ...(dream ? { dreamId: dream.id } : {}),
      ...payload,
    }

    try {
      let created: { id?: number } | null = null

      switch (type) {
        case 'character': {
          // e.g. characterStore.createCharacter(base)
          created = await callStoreCreate(
            'characterStore',
            'createCharacter',
            base,
          )
          break
        }
        case 'reward': {
          // e.g. rewardStore.createReward(base)
          created = await callStoreCreate('rewardStore', 'createReward', base)
          break
        }
        case 'scenario': {
          // e.g. scenarioStore.createScenario(base)
          created = await callStoreCreate(
            'scenarioStore',
            'createScenario',
            base,
          )
          break
        }
        case 'dream': {
          // e.g. dreamStore.createDream(base)
          created = await callStoreCreate('dreamStore', 'createDream', base)
          break
        }
      }

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

  // Thin indirection so wiring stays in one place. Replace the body with
  // direct imports/calls to your real stores when ready.
  async function callStoreCreate(
    _storeName: string,
    _method: string,
    _payload: Record<string, unknown>,
  ): Promise<{ id?: number } | null> {
    // TODO(silas): wire to real store create methods, e.g.:
    //   const store = useCharacterStore()
    //   return store.createCharacter(_payload)
    throw new Error(
      `Wire ${_storeName}.${_method}() into callStoreCreate to enable direct creation.`,
    )
  }

  // ── Unified intent router ─────────────────────────────────────────────────
  // Lets a single user line trigger lore answers or animation control before
  // falling back to a normal Narrator chat turn.
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
        : '',
      selectedScenario.value
        ? [
            `Selected scenario: ${scenarioTitle(selectedScenario.value)}`,
            scenarioSummary(selectedScenario.value),
          ]
            .filter(Boolean)
            .join('\n')
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

    if (!dream || !bot || !content || isNarratorResponding.value) return

    statusMessage.value = ''
    promptStore.currentPrompt = content
    setEmotion('CHEERING', false)

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

      setEmotion('JOYFUL')
    } catch (error) {
      setEmotion('THINKING')
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

  // Slug-based path conventions (files live under /images/bots/<kind>/<slug>/...).
  // Avatars: /images/bots/avatars/<slug>.webp
  // Emotions/actions stills: /images/bots/emotions/<slug>/<key>.webp
  // Reaction loops:          /images/bots/reactions/<slug>/<key>.webp
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

  // Reaction video for the current expression row, if one exists or can be derived.
  function readEmotionVideo(row?: NarratorExpressionMedia | null) {
    if (!row) return ''
    if (row.videoPath) return row.videoPath
    const slug = narratorBot.value?.slug
    const key = expressionKeyOf(row)
    if (slug && key) return `/images/bots/reactions/${slug}/${key}.webp`
    return ''
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
    narratorVideo,
    rowByExpressionKey,
    // liveness system
    livenessEnabled,
    livenessConfig,
    playingVideo,
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
  }
})
