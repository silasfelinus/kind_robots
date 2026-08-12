// /stores/consoleStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
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
  const initialized = ref(false)

  const sessionDuration = computed(() =>
    Math.floor((Date.now() - loginStart.value) / 1000),
  )

  async function initialize(): Promise<void> {
    if (initialized.value) return

    loginStart.value = Date.now()
    logRandomMessage()
    incrementXP(10)
    initialized.value = true
  }

  function logMessage(text: string, type: ConsoleMessage['type']): void {
    messages.value.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      text,
      type,
      timestamp: Date.now(),
    })

    console.log(`%c[Kind Robots] ${text}`, 'color: limegreen; font-weight: bold')
  }

  function logRandomMessage(): void {
    const encounter = useRandomEncounter()
    const types: Array<{ type: ConsoleMessage['type']; message: string }> = [
      { type: 'fun', message: randomFunLine() ?? 'Something silly happens.' },
      { type: 'quote', message: randomQuote() ?? 'A mysterious quote echoes.' },
      { type: 'trivia', message: randomTrivia() ?? 'A strange fact appears.' },
      { type: 'story', message: encounter.message },
    ]

    const selected = types[Math.floor(Math.random() * types.length)]

    if (!selected) {
      logMessage('The console stares back in silence.', 'system')
      return
    }

    if (selected.type === 'story') {
      incrementXP(encounter.xp)
    }

    logMessage(selected.message, selected.type)
  }

  function incrementXP(amount: number): void {
    xp.value += amount

    while (
      level.value < LEVEL_THRESHOLDS.length &&
      xp.value >= (LEVEL_THRESHOLDS[level.value] ?? 0)
    ) {
      levelUp()
    }
  }

  function levelUp(): void {
    level.value++
    logMessage(`🎉 Level up! You're now Level ${level.value}`, 'system')
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
    initialized.value = false
  }

  return {
    messages,
    xp,
    level,
    loginStart,
    initialized,
    sessionDuration,
    initialize,
    logMessage,
    logRandomMessage,
    incrementXP,
    levelUp,
    tickStory,
    resetConsoleState,
  }
})
