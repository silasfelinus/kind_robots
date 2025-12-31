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

export const useConsoleStore = defineStore('consoleStore', () => {
  const messages = ref<ConsoleMessage[]>([])
  const xp = ref(0)
  const level = ref(1)
  const loginStart = ref(Date.now())
  const hasFetched = ref(false)
  const userId = ref<number | null>(null)

  const sessionDuration = computed(() =>
    Math.floor((Date.now() - loginStart.value) / 1000),
  )

  async function initialize() {
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
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('consoleStore')
    if (saved) {
      const data = JSON.parse(saved)
      xp.value = data.xp || 0
      level.value = data.level || 1
    }
  }

  function saveToLocalStorage() {
    localStorage.setItem(
      'consoleStore',
      JSON.stringify({ xp: xp.value, level: level.value }),
    )
  }

  function saveMessagesToLocal() {
    localStorage.setItem(
      'consoleMessages',
      JSON.stringify(messages.value.slice(-100)),
    )
  }

  function loadMessagesFromLocal() {
    const saved = localStorage.getItem('consoleMessages')
    if (saved) messages.value = JSON.parse(saved)
  }

  async function fetchConsoleData() {
    hasFetched.value = true
    try {
      // Optional backend fetch logic
    } catch (error) {
      console.error('ConsoleStore fetch failed', error)
    }
  }

  async function saveConsoleData() {
    try {
      // Optional backend save logic
    } catch (error) {
      console.warn('Could not save console progress')
    }
  }

  function logMessage(text: string, type: ConsoleMessage['type']) {
    messages.value.push({
      id: Date.now(),
      text,
      type,
      timestamp: Date.now(),
    })
    saveMessagesToLocal()
    console.log(`%c[Console XP] ${text}`, 'color: limegreen; font-weight: bold')
  }

  function logRandomMessage() {
    const types = [
      { type: 'fun', message: randomFunLine() },
      { type: 'quote', message: randomQuote() },
      { type: 'trivia', message: randomTrivia() },
      (() => {
        const encounter = useRandomEncounter()
        incrementXP(encounter.xp)
        return { type: 'story', message: encounter.message }
      })(),
    ]
    const selected = types[Math.floor(Math.random() * types.length)]
    logMessage(selected.message, selected.type as ConsoleMessage['type'])
  }

  function incrementXP(amount: number) {
    xp.value += amount
    saveToLocalStorage()

    while (
      level.value < LEVEL_THRESHOLDS.length &&
      xp.value >= LEVEL_THRESHOLDS[level.value]
    ) {
      levelUp()
    }
  }

  function levelUp() {
    level.value++
    logMessage(`🎉 Level up! You're now Level ${level.value}`, 'system')
    saveConsoleData()
  }

  function tickStory() {
    const seconds = sessionDuration.value
    if (seconds === 60) {
      logMessage('🕐 One minute into the void. Bugs are stirring...', 'story')
    } else if (seconds === 300) {
      logMessage('🍕 Five minutes in. Time for a snack break?', 'story')
    } else if (seconds === 600) {
      logMessage('📦 Ten minutes deep. Logs are piling up...', 'story')
    }
  }

  return {
    messages,
    xp,
    level,
    loginStart,
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
  }
})
