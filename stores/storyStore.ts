// /stores/storyStore.ts
// Single source of truth for the live Weirdlandia story session.
// scenario-interact (and anything else) renders from this store;
// no emits or prop-drilling required. Phase is derived:
//   story     — a session is running or has chats
//   configure — a scenario is selected, no session yet
//   browse    — nothing selected
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChatStore } from '@/stores/chatStore'
import { useRewardStore } from '@/stores/rewardStore'
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

type ChatRuntimeInput = Parameters<
  ReturnType<typeof useChatStore>['addChat']
>[0]

type PersistedSession = {
  sessionChatIds: number[]
  storyRunning: boolean
  customDirection: string
}

export const useStoryStore = defineStore('storyStore', () => {
  const scenarioStore = useScenarioStore()
  const characterStore = useCharacterStore()
  const rewardStore = useRewardStore()
  const chatStore = useChatStore()
  const serverStore = useServerStore()
  const userStore = useUserStore()
  const weirdStore = useWeirdStore()

  // ---------- State ----------

  const storyRunning = ref(false)
  const isStartingStory = ref(false)
  const customDirection = ref('')
  const statusMessage = ref('')
  const statusTone = ref<'success' | 'error'>('success')
  const sessionChatIds = ref<number[]>([])
  const isInitialized = ref(false)

  // ---------- Persistence ----------

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

  // ---------- Getters ----------

  const sessionChats = computed<StorySessionChat[]>(() => {
    return chatStore.chats.filter((chat) =>
      sessionChatIds.value.includes(chat.id),
    ) as StorySessionChat[]
  })

  const isResponding = computed(() => {
    return sessionChats.value.some((chat) => !chat.botResponse)
  })

  const isBusy = computed(() => {
    return isStartingStory.value || isResponding.value
  })

  const phase = computed<StoryPhase>(() => {
    if (storyRunning.value || sessionChats.value.length > 0) return 'story'
    if (scenarioStore.selectedScenario) return 'configure'

    return 'browse'
  })

  const canStartStory = computed(() => {
    return Boolean(
      scenarioStore.selectedScenario &&
      characterStore.selectedCharacter &&
      !isBusy.value,
    )
  })

  const canContinueStory = computed(() => {
    return Boolean(
      storyRunning.value &&
      customDirection.value.trim() &&
      !isBusy.value &&
      scenarioStore.selectedScenario &&
      characterStore.selectedCharacter,
    )
  })

  const canSubmitStory = computed(() => {
    return storyRunning.value ? canContinueStory.value : canStartStory.value
  })

  const systemPrompt = computed(() => {
    return [
      'You are the Weirdlandia storyteller for Kind Robots.',
      'Write interactive branching fiction with sharp sensory detail, meaningful consequences, and playful weirdness.',
      'Honor the selected scenario, character, reward, and opening choice.',
      'End every response with 3-5 clear follow-up options.',
      'Each option should invite a different kind of action: cautious, bold, clever, strange, or character-driven.',
      'Do not explain the prompt. Write the story scene directly.',
    ].join('\n')
  })

  const storyPromptPreview = computed(() => {
    if (!scenarioStore.selectedScenario || !characterStore.selectedCharacter) {
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

  // ---------- Status ----------

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

  // ---------- Choice handling ----------

  function pickIntro(intro: string) {
    // Toggle off if it's already the active choice
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

  // ---------- Prompt building ----------

  function buildStoryPrompt() {
    const scenario = scenarioStore.selectedScenario
    const character = characterStore.selectedCharacter
    const reward = rewardStore.selectedReward

    if (!scenario || !character) return ''

    const direction = customDirection.value.trim()

    return [
      `Scenario: ${scenario.title}`,
      `Scenario description: ${scenario.description || 'No description provided'}`,
      `Character: ${character.name || 'Unnamed'}`,
      `Character details: ${character.species || 'Unknown species'}, ${
        character.class || 'Unknown class'
      }, ${character.personality || 'unknown personality'}`,
      `Opening choice: ${scenarioStore.currentChoice || 'None selected'}`,
      reward ? `Reward at stake: ${reward.name}` : '',
      reward
        ? `Reward description: ${reward.description || 'No description provided'}`
        : '',
      reward
        ? `Reward flavor: ${reward.flavorText || 'No flavor text provided'}`
        : '',
      reward ? `Reward effect: ${reward.effect || 'Unknown'}` : '',
      direction ? `Player direction: ${direction}` : '',
      '',
      'Generate the next scene as an interactive branching narrative. Include vivid sensory detail, meaningful consequences, and 3-5 clear follow-up options. Let the player continue with a skill check, inventory item, reward use, or custom prompt.',
    ]
      .filter(Boolean)
      .join('\n')
  }

  function buildNextTurnPrompt() {
    const scenario = scenarioStore.selectedScenario
    const character = characterStore.selectedCharacter
    const reward = rewardStore.selectedReward
    const direction = customDirection.value.trim()

    if (!scenario || !character) return ''

    return [
      `Continue the current Weirdlandia story.`,
      `Scenario: ${scenario.title}`,
      `Character: ${character.name || 'Unnamed'}`,
      reward ? `Reward in play: ${reward.name}` : '',
      reward ? `Reward effect: ${reward.effect || 'Unknown'}` : '',
      `Player action: ${direction}`,
      '',
      'Resolve this action in the ongoing story. Preserve continuity from the previous messages. Include consequences, character-specific reactions, and 3-5 new follow-up options.',
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

  // ---------- Story lifecycle ----------

  async function createAndStreamStoryChat(content: string) {
    const character = characterStore.selectedCharacter

    if (!character) {
      throw new Error('Select a character before launching the story goblin.')
    }

    const payload: ChatRuntimeInput = {
      content,
      userId: userStore.userId ?? userStore.user?.id ?? character.userId ?? 10,
      type: 'Weirdlandia',
      characterId: character.id,
      recipientId: null,
      serverId: serverStore.activeTextServer?.id ?? null,
      isPublic: false,
    }

    const newChat = await chatStore.addChat(payload)

    if (!newChat?.id) {
      throw new Error('Failed to create chat.')
    }

    sessionChatIds.value.push(newChat.id)
    chatStore.selectedChat = newChat
    syncToLocalStorage()

    if (Array.isArray(weirdStore.history)) {
      weirdStore.history.push(newChat)
    }

    if (typeof chatStore.streamResponse !== 'function') {
      throw new Error('chatStore.streamResponse is not available.')
    }

    await chatStore.streamResponse(newChat.id, {
      model: serverStore.activeTextServer?.model || 'gpt-4o-mini',
      temperature: 0.9,
      maxTokens: 2048,
      serverId: serverStore.activeTextServer?.id ?? null,
      messages: buildMessagesForStoryResponse(),
    })

    return newChat
  }

  async function startStory() {
    if (!canStartStory.value) {
      setStatus(
        'Pick a scenario and character before launching the story goblin.',
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

  /** Clear the session but keep the scenario selected → back to configure. */
  function newStory() {
    sessionChatIds.value = []
    storyRunning.value = false
    chatStore.selectedChat = null
    customDirection.value = ''
    clearStatus()

    if (Array.isArray(weirdStore.history)) {
      weirdStore.history = []
    }

    syncToLocalStorage()
  }

  /** End the session and deselect everything → back to browse. */
  function endSession() {
    newStory()
    scenarioStore.deselectScenario()
    scenarioStore.setCurrentChoice('')
  }

  /** Deselect the scenario without touching a non-existent session → browse. */
  function backToBrowse() {
    scenarioStore.deselectScenario()
    scenarioStore.setCurrentChoice('')
    customDirection.value = ''
    clearStatus()
    syncToLocalStorage()
  }

  // ---------- Initialization ----------

  async function initialize() {
    if (isInitialized.value) return

    loadFromLocalStorage()

    await Promise.all([
      chatStore.initialize(),
      ...(serverStore.hasLoaded
        ? []
        : [serverStore.initialize({ fetchRemote: true })]),
    ])

    // Drop session chat ids that no longer exist after the chat fetch
    const knownIds = new Set(chatStore.chats.map((chat) => chat.id))

    sessionChatIds.value = sessionChatIds.value.filter((id) => knownIds.has(id))

    if (sessionChatIds.value.length === 0) {
      storyRunning.value = false
    }

    syncToLocalStorage()
    isInitialized.value = true
  }

  return {
    // state
    storyRunning,
    isStartingStory,
    customDirection,
    statusMessage,
    statusTone,
    sessionChatIds,
    isInitialized,

    // getters
    phase,
    sessionChats,
    isResponding,
    isBusy,
    canStartStory,
    canContinueStory,
    canSubmitStory,
    systemPrompt,
    storyPromptPreview,
    fullSessionMessages,

    // actions
    initialize,
    setStatus,
    clearStatus,
    pickIntro,
    setCustomDirection,
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
