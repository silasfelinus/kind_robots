// /stores/consoleStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './userStore'
import { randomFunLine } from './utils/randomFunLine'
import { randomQuote } from './utils/randomQuote'
import { randomTrivia } from './utils/randomTrivia'
import { useRandomEncounter } from './utils/randomEncounter'

type ConsoleMessage = {
  id: number
  text: string
  type: 'fun' | 'quote' | 'trivia' | 'story' | 'system'
  timestamp: number
}

const LEVEL_THRESHOLDS = [0, 50, 120, 250, 500, 1000]
const isClient = typeof window !== 'undefined'

export const useConsoleStore = defineStore('consoleStore', () => {
  const messages = ref<ConsoleMessage[]>([])
  const xp = ref(0)
  const level = ref(1)
  const loginStart = ref(Date.now())
  const initialized = ref(false)
  const initializePromise = ref<Promise<void> | null>(null)
  const hasFetched = ref(false)
  const userId = ref<number | null>(null)

  const sessionDuration = computed(() =>
    Math.floor((Date.now() - loginStart.value) / 1000),
  )

  async function initialize(): Promise<void> {
    if (initialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      const userStore = useUserStore()
      userId.value = userStore.user?.id || null
      loginStart.value = Date.now()

      loadFromLocalStorage()
      loadMessagesFromLocal()

      if (!hasFetched.value) {
        await fetchConsoleData()
      }

      logRandomMessage()
      incrementXP(10)
      initialized.value = true
    })()

    try {
      await initializePromise.value
    } finally {
      initializePromise.value = null
    }
  }

  function loadFromLocalStorage(): void {
    if (!isClient) return

    try {
      const saved = localStorage.getItem('consoleStore')
      if (!saved) return

      const data = JSON.parse(saved)
      xp.value = data.xp || 0
      level.value = data.level || 1
    } catch (error) {
      console.warn(
        '[consoleStore] Failed to load consoleStore from localStorage',
        error,
      )
    }
  }

  function saveToLocalStorage(): void {
    if (!isClient) return

    try {
      localStorage.setItem(
        'consoleStore',
        JSON.stringify({ xp: xp.value, level: level.value }),
      )
    } catch (error) {
      console.warn(
        '[consoleStore] Failed to save consoleStore to localStorage',
        error,
      )
    }
  }

  function saveMessagesToLocal(): void {
    if (!isClient) return

    try {
      localStorage.setItem(
        'consoleMessages',
        JSON.stringify(messages.value.slice(-100)),
      )
    } catch (error) {
      console.warn(
        '[consoleStore] Failed to save consoleMessages to localStorage',
        error,
      )
    }
  }

  function loadMessagesFromLocal(): void {
    if (!isClient) return

    try {
      const saved = localStorage.getItem('consoleMessages')
      if (!saved) return
      messages.value = JSON.parse(saved)
    } catch (error) {
      console.warn(
        '[consoleStore] Failed to load consoleMessages from localStorage',
        error,
      )
    }
  }

  async function fetchConsoleData(): Promise<void> {
    if (hasFetched.value) return

    hasFetched.value = true

    try {
      // Optional backend fetch logic
    } catch (error) {
      console.error('ConsoleStore fetch failed', error)
      hasFetched.value = false
    }
  }

  async function saveConsoleData(): Promise<void> {
    try {
      // Optional backend save logic
    } catch (error) {
      console.warn('Could not save console progress')
    }
  }

  function logMessage(text: string, type: ConsoleMessage['type']): void {
    messages.value.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      text,
      type,
      timestamp: Date.now(),
    })

    saveMessagesToLocal()
    console.log(`%c[Console XP] ${text}`, 'color: limegreen; font-weight: bold')
  }

  function logRandomMessage(): void {
    const encounter = useRandomEncounter()
    const types: Array<{ type: ConsoleMessage['type']; message: string }> = [
      { type: 'fun', message: randomFunLine() },
      { type: 'quote', message: randomQuote() },
      { type: 'trivia', message: randomTrivia() },
      { type: 'story', message: encounter.message },
    ]

    const selected = types[Math.floor(Math.random() * types.length)]
    if (selected.type === 'story') {
      incrementXP(encounter.xp)
    }

    logMessage(selected.message, selected.type)
  }

  function incrementXP(amount: number): void {
    xp.value += amount
    saveToLocalStorage()

    while (
      level.value < LEVEL_THRESHOLDS.length &&
      xp.value >= LEVEL_THRESHOLDS[level.value]
    ) {
      levelUp()
    }
  }

  function levelUp(): void {
    level.value++
    logMessage(`🎉 Level up! You're now Level ${level.value}`, 'system')
    saveConsoleData()
  }

  function tickStory(): void {
    const seconds = sessionDuration.value

    if (seconds === 60) {
      logMessage('🕐 One minute into the void. Bugs are stirring...', 'story')
    } else if (seconds === 300) {
      logMessage('🍕 Five minutes in. Time for a snack break?', 'story')
    } else if (seconds === 600) {
      logMessage('📦 Ten minutes deep. Logs are piling up...', 'story')
    }
  }

  function resetConsoleState(): void {
    messages.value = []
    xp.value = 0
    level.value = 1
    loginStart.value = Date.now()
    hasFetched.value = false
    userId.value = null
    initialized.value = false
    initializePromise.value = null
  }

  return {
    messages,
    xp,
    level,
    loginStart,
    initialized,
    initializePromise,
    hasFetched,
    userId,
    sessionDuration,
    initialize,
    loadFromLocalStorage,
    saveToLocalStorage,
    saveMessagesToLocal,
    loadMessagesFromLocal,
    fetchConsoleData,
    saveConsoleData,
    logMessage,
    logRandomMessage,
    incrementXP,
    levelUp,
    tickStory,
    resetConsoleState,
  }
})
