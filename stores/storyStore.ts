// /stores/storyStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import { useWeirdStore } from '@/stores/weirdStore'

const isClient = typeof window !== 'undefined'

const storySessionStorageKey = 'storySession'

export type StoryPhase = 'browse' | 'configure' | 'story'

export type StorySessionChat = {
  id: number
  content: string
  botResponse?: string | null
}

export type StoryMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type StoryReplyOption = {
  id: string
  label: string
  text: string
  raw: string
}

export type StoryDisplayChat = StorySessionChat & {
  displayResponse: string
  replyOptions: StoryReplyOption[]
  isStreaming: boolean
  isInterrupted: boolean
}

type ChatRuntimeInput = Parameters<
  ReturnType<typeof useChatStore>['addChat']
>[0]

type PersistedSession = {
  sessionChatIds: number[]
  storyRunning: boolean
  customDirection: string
}

function normalizeChoiceText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

function stripMarkdown(value: string): string {
  return value
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .replace(/^\s*[-*]\s+/, '')
    .trim()
}

function cleanOptionText(value: string): string {
  return stripMarkdown(value)
    .replace(/^["“”]+|["“”]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isOptionLine(line: string): boolean {
  const trimmed = line.trim()

  return (
    /^\d+[.)]\s+/.test(trimmed) ||
    /^[A-Ea-e][.)]\s+/.test(trimmed) ||
    /^[-*]\s+\*\*.+\*\*/.test(trimmed)
  )
}

function isChoiceHeader(line: string): boolean {
  const clean = stripMarkdown(line).toLowerCase()

  return (
    clean.includes('what do you do next') ||
    clean.includes('what will you do') ||
    clean.includes('choose your next') ||
    clean.includes('next options') ||
    clean.includes('options')
  )
}

function optionFromLine(line: string, index: number): StoryReplyOption | null {
  const trimmed = line.trim()

  const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)$/)
  const lettered = trimmed.match(/^([A-Ea-e])[.)]\s+(.+)$/)
  const bulleted = trimmed.match(/^[-*]\s+(.+)$/)

  const label = numbered?.[1]
    ? `Option ${numbered[1]}`
    : lettered?.[1]
      ? `Option ${lettered[1].toUpperCase()}`
      : `Option ${index + 1}`

  const raw = numbered?.[2] || lettered?.[2] || bulleted?.[1] || ''

  if (!raw) return null

  const text = cleanOptionText(raw)

  if (!text) return null

  return {
    id: `${index}-${text.slice(0, 32).replace(/[^a-z0-9]+/gi, '-')}`,
    label,
    text,
    raw: trimmed,
  }
}

function parseStoryReplyOptions(text?: string | null): StoryReplyOption[] {
  if (!text) return []

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const firstHeaderIndex = lines.findIndex(isChoiceHeader)
  const searchLines =
    firstHeaderIndex >= 0 ? lines.slice(firstHeaderIndex + 1) : lines

  return searchLines
    .map((line, index) => optionFromLine(line, index))
    .filter((option): option is StoryReplyOption => Boolean(option))
    .slice(0, 5)
}

function storyTextWithoutReplyOptions(text?: string | null): string {
  if (!text) return ''

  const lines = text.split('\n')
  const firstChoiceHeaderIndex = lines.findIndex(isChoiceHeader)
  const firstOptionIndex = lines.findIndex(isOptionLine)

  const cutIndex =
    firstChoiceHeaderIndex >= 0
      ? firstChoiceHeaderIndex
      : firstOptionIndex >= 0
        ? firstOptionIndex
        : -1

  if (cutIndex < 0) return text.trim()

  return lines.slice(0, cutIndex).join('\n').trim()
}

export const useStoryStore = defineStore('storyStore', () => {
  const scenarioStore = useScenarioStore()
  const chatStore = useChatStore()
  const serverStore = useServerStore()
  const userStore = useUserStore()
  const weirdStore = useWeirdStore()

  const storyRunning = ref(false)
  const isStartingStory = ref(false)
  const activeStreamingChatId = ref<number | null>(null)
  const customDirection = ref('')
  const statusMessage = ref('')
  const statusTone = ref<'success' | 'error'>('success')
  const sessionChatIds = ref<number[]>([])
  const isInitialized = ref(false)

  function syncToLocalStorage() {
    if (!isClient) return

    try {
      localStorage.setItem(
        storySessionStorageKey,
        JSON.stringify({
          sessionChatIds: sessionChatIds.value,
          storyRunning: storyRunning.value,
          customDirection: customDirection.value,
        } satisfies PersistedSession),
      )
    } catch {}
  }

  function loadFromLocalStorage() {
    if (!isClient) return

    try {
      const raw = localStorage.getItem(storySessionStorageKey)

      if (!raw) return

      const parsed = JSON.parse(raw) as Partial<PersistedSession>

      if (Array.isArray(parsed.sessionChatIds)) {
        sessionChatIds.value = parsed.sessionChatIds.filter(
          (id): id is number => Number.isInteger(id),
        )
      }

      storyRunning.value = Boolean(parsed.storyRunning)
      customDirection.value =
        typeof parsed.customDirection === 'string' ? parsed.customDirection : ''
    } catch {}
  }

  const sessionChats = computed<StorySessionChat[]>(() => {
    return chatStore.chats.filter((chat) =>
      sessionChatIds.value.includes(chat.id),
    ) as StorySessionChat[]
  })

  const storyDisplayChats = computed<StoryDisplayChat[]>(() => {
    return sessionChats.value.map((chat) => {
      const isStreaming = activeStreamingChatId.value === chat.id
      const botResponse = chat.botResponse || ''
      const isInterrupted = !isStreaming && !botResponse.trim()

      return {
        ...chat,
        isStreaming,
        isInterrupted,
        displayResponse: isInterrupted
          ? 'The Weirdlandia response was interrupted by a reload. Choose an action below or resubmit a turn to continue.'
          : isStreaming
            ? botResponse
            : storyTextWithoutReplyOptions(botResponse),
        replyOptions:
          isStreaming || isInterrupted
            ? []
            : parseStoryReplyOptions(botResponse),
      }
    })
  })

  const latestReplyOptions = computed<StoryReplyOption[]>(() => {
    const latest = [...storyDisplayChats.value]
      .reverse()
      .find((chat) => chat.replyOptions.length)

    return latest?.replyOptions ?? []
  })

  const isResponding = computed(() => activeStreamingChatId.value !== null)

  const isBusy = computed(() => {
    return isStartingStory.value || isResponding.value
  })

  const phase = computed<StoryPhase>(() => {
    if (storyRunning.value || sessionChats.value.length > 0) return 'story'
    if (scenarioStore.selectedScenario) return 'configure'

    return 'browse'
  })

  const hasLaunchDirection = computed(() => {
    return Boolean(scenarioStore.currentChoice || customDirection.value.trim())
  })

  const canStartStory = computed(() => {
    return Boolean(
      scenarioStore.selectedScenario &&
      hasLaunchDirection.value &&
      !isBusy.value,
    )
  })

  const canContinueStory = computed(() => {
    return Boolean(
      storyRunning.value &&
      customDirection.value.trim() &&
      !isBusy.value &&
      scenarioStore.selectedScenario,
    )
  })

  const canSubmitStory = computed(() => {
    return storyRunning.value ? canContinueStory.value : canStartStory.value
  })

  const systemPrompt = computed(() => {
    return [
      'You are the Weirdlandia storyteller for Kind Robots.',
      'Write interactive branching fiction with sharp sensory detail, meaningful consequences, and playful weirdness.',
      'Honor the selected scenario and opening choice.',
      'Do not explain the prompt. Write the story scene directly.',
      'End every response with a section titled "What do you do next?" followed by 3-5 numbered options, one option per line.',
      'Each numbered option should be short, clickable, and invite a different kind of action: cautious, bold, clever, strange, or emotionally revealing.',
    ].join('\n')
  })

  const storyPromptPreview = computed(() => {
    if (!scenarioStore.selectedScenario) {
      return ''
    }

    return storyRunning.value ? buildNextTurnPrompt() : buildStoryPrompt()
  })

  const fullSessionMessages = computed<StoryMessage[]>(() => {
    return sessionChats.value.flatMap((chat) => {
      const messages: StoryMessage[] = [
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
  })

  function selectedReplyMatches(option: StoryReplyOption): boolean {
    return (
      normalizeChoiceText(customDirection.value) ===
      normalizeChoiceText(option.text)
    )
  }

  function setStatus(
    messageText: string,
    tone: 'success' | 'error' = 'success',
  ) {
    statusMessage.value = messageText
    statusTone.value = tone
  }

  function clearStatus() {
    statusMessage.value = ''
  }

  function pickIntro(intro: string) {
    if (scenarioStore.currentChoice === intro) {
      scenarioStore.setCurrentChoice('')

      if (customDirection.value === intro) {
        customDirection.value = ''
      }

      syncToLocalStorage()
      return
    }

    scenarioStore.setCurrentChoice(intro)
    customDirection.value = intro
    syncToLocalStorage()
  }

  function setCustomDirection(value: string) {
    customDirection.value = value
    syncToLocalStorage()
  }

  function selectReplyOption(option: StoryReplyOption | string) {
    const text = typeof option === 'string' ? option : option.text

    if (
      normalizeChoiceText(customDirection.value) === normalizeChoiceText(text)
    ) {
      customDirection.value = ''
    } else {
      customDirection.value = text
    }

    syncToLocalStorage()
  }

  function buildStoryPrompt() {
    const scenario = scenarioStore.selectedScenario

    if (!scenario) return ''

    const direction = customDirection.value.trim()

    return [
      `Scenario: ${scenario.title}`,
      `Scenario description: ${scenario.description || 'No description provided'}`,
      `Opening choice: ${scenarioStore.currentChoice || 'None selected'}`,
      direction ? `Player direction: ${direction}` : '',
      '',
      'Generate the opening scene as an interactive branching narrative. Include vivid sensory detail, meaningful consequences, and a section titled "What do you do next?" with 3-5 numbered follow-up options. Keep the focus on the scenario, the player’s chosen opening, and the immediate situation.',
    ]
      .filter(Boolean)
      .join('\n')
  }

  function buildNextTurnPrompt() {
    const scenario = scenarioStore.selectedScenario
    const direction = customDirection.value.trim()

    if (!scenario) return ''

    return [
      'Continue the current Weirdlandia story.',
      `Scenario: ${scenario.title}`,
      `Player action: ${direction}`,
      '',
      'Resolve this action in the ongoing story. Preserve continuity from the previous messages. Include consequences and a section titled "What do you do next?" with 3-5 new numbered follow-up options.',
    ]
      .filter(Boolean)
      .join('\n')
  }

  function buildMessagesForStoryResponse(): StoryMessage[] {
    return [
      {
        role: 'system',
        content: systemPrompt.value,
      },
      ...fullSessionMessages.value,
    ]
  }

  async function createAndStreamStoryChat(content: string) {
    const activeTextServer = serverStore.activeTextServer

    const payload: ChatRuntimeInput = {
      content,
      userId: userStore.userId ?? userStore.user?.id ?? 10,
      type: 'Weirdlandia',
      characterId: null,
      recipientId: null,
      serverId: activeTextServer?.id ?? null,
      serverName: activeTextServer?.label || activeTextServer?.title || null,
      isPublic: false,
    }

    const newChat = await chatStore.addChat(payload)

    if (!newChat?.id) {
      throw new Error('Failed to create chat.')
    }

    sessionChatIds.value.push(newChat.id)
    chatStore.selectedChat = newChat
    activeStreamingChatId.value = newChat.id
    syncToLocalStorage()

    if (Array.isArray(weirdStore.history)) {
      weirdStore.history.push(newChat)
    }

    if (typeof chatStore.streamResponse !== 'function') {
      throw new Error('chatStore.streamResponse is not available.')
    }

    try {
      await chatStore.streamResponse(newChat.id, {
        model: activeTextServer?.model || 'gpt-4o-mini',
        temperature: 0.9,
        maxTokens: 2048,
        stream: true,
        serverId: activeTextServer?.id ?? null,
        serverName: activeTextServer?.label || activeTextServer?.title || null,
        serverSelectionMode: activeTextServer ? 'specific' : 'default',
        generationRequirement: {
          provider:
            activeTextServer?.serverType === 'ANTHROPIC'
              ? 'anthropic'
              : activeTextServer?.serverType === 'OLLAMA'
                ? 'ollama'
                : activeTextServer?.serverType === 'OPENAI'
                  ? 'openai'
                  : 'any',
        },
        messages: buildMessagesForStoryResponse(),
      })
    } finally {
      activeStreamingChatId.value = null
    }

    return newChat
  }

  async function startStory() {
    if (!canStartStory.value) {
      setStatus(
        'Pick a scenario opening or write a direction before launching the story goblin.',
        'error',
      )
      return
    }

    const content = buildStoryPrompt()

    if (!content.trim()) {
      setStatus('Could not build story prompt.', 'error')
      return
    }

    isStartingStory.value = true
    clearStatus()

    try {
      await createAndStreamStoryChat(content)
      storyRunning.value = true
      customDirection.value = ''
      syncToLocalStorage()
    } catch (error) {
      console.error('Error starting the story:', error)
      setStatus(
        error instanceof Error ? error.message : 'Error starting the story.',
        'error',
      )
    } finally {
      isStartingStory.value = false
    }
  }

  async function continueStory() {
    if (!canContinueStory.value) {
      setStatus('Choose or type the next action before continuing.', 'error')
      return
    }

    const content = buildNextTurnPrompt()

    if (!content.trim()) {
      setStatus('Could not build next-turn prompt.', 'error')
      return
    }

    isStartingStory.value = true
    clearStatus()

    try {
      await createAndStreamStoryChat(content)
      customDirection.value = ''
      syncToLocalStorage()
    } catch (error) {
      console.error('Error continuing the story:', error)
      setStatus(
        error instanceof Error ? error.message : 'Error continuing the story.',
        'error',
      )
    } finally {
      isStartingStory.value = false
    }
  }

  async function submitStoryTurn() {
    if (storyRunning.value) {
      await continueStory()
      return
    }

    await startStory()
  }

  function newStory() {
    sessionChatIds.value = []
    storyRunning.value = false
    activeStreamingChatId.value = null
    chatStore.selectedChat = null
    customDirection.value = ''
    clearStatus()

    if (Array.isArray(weirdStore.history)) {
      weirdStore.history = []
    }

    syncToLocalStorage()
  }

  function endSession() {
    newStory()
    scenarioStore.deselectScenario()
    scenarioStore.setCurrentChoice('')
  }

  function backToBrowse() {
    scenarioStore.deselectScenario()
    scenarioStore.setCurrentChoice('')
    customDirection.value = ''
    clearStatus()
    syncToLocalStorage()
  }

  async function initialize() {
    if (isInitialized.value) return

    loadFromLocalStorage()

    await Promise.all([
      chatStore.initialize(),
      ...(serverStore.hasLoaded
        ? []
        : [serverStore.initialize({ fetchRemote: true })]),
    ])

    const knownIds = new Set(chatStore.chats.map((chat) => chat.id))

    sessionChatIds.value = sessionChatIds.value.filter((id) => knownIds.has(id))

    if (sessionChatIds.value.length === 0) {
      storyRunning.value = false
    }

    activeStreamingChatId.value = null
    syncToLocalStorage()
    isInitialized.value = true
  }

  return {
    storyRunning,
    isStartingStory,
    activeStreamingChatId,
    customDirection,
    statusMessage,
    statusTone,
    sessionChatIds,
    isInitialized,

    phase,
    sessionChats,
    storyDisplayChats,
    latestReplyOptions,
    isResponding,
    isBusy,
    hasLaunchDirection,
    canStartStory,
    canContinueStory,
    canSubmitStory,
    systemPrompt,
    storyPromptPreview,
    fullSessionMessages,

    initialize,
    setStatus,
    clearStatus,
    pickIntro,
    setCustomDirection,
    selectReplyOption,
    selectedReplyMatches,
    parseStoryReplyOptions,
    storyTextWithoutReplyOptions,
    buildStoryPrompt,
    buildNextTurnPrompt,
    buildMessagesForStoryResponse,
    submitStoryTurn,
    startStory,
    continueStory,
    newStory,
    endSession,
    backToBrowse,
    syncToLocalStorage,
    loadFromLocalStorage,
  }
})
