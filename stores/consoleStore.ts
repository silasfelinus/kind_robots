// stores/consoleStore.ts

import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { randomFunLine } from './utils/randomFunLine'
import { randomQuote } from './utils/randomQuote'
import { randomTrivia } from './utils/randomTrivia'
import { randomEncounter } from './utils/randomEncounter'

type ConsoleMessage = {
  id: number
  text: string
  type: 'fun' | 'quote' | 'trivia' | 'story' | 'system'
  timestamp: number
}

type ConsoleState = {
  messages: ConsoleMessage[]
  xp: number
  level: number
  loginStart: number
  hasFetched: boolean
  userId: number | null
}

const LEVEL_THRESHOLDS = [0, 50, 120, 250, 500, 1000]

export const useConsoleStore = defineStore('consoleStore', {
  state: (): ConsoleState => ({
    messages: [],
    xp: 0,
    level: 1,
    loginStart: Date.now(),
    hasFetched: false,
    userId: null,
  }),

  getters: {
    sessionDuration(state) {
      return Math.floor((Date.now() - state.loginStart) / 1000)
    },
  },

  actions: {
    async initialize() {
      const userStore = useUserStore()
      this.userId = userStore.user?.id || null
      this.loginStart = Date.now()

      this.loadFromLocalStorage()
      this.loadMessagesFromLocal()

      if (!this.hasFetched) {
        await this.fetchConsoleData()
      }

      this.logRandomMessage()
      this.incrementXP(10)
    },

    loadFromLocalStorage() {
      const saved = localStorage.getItem('consoleStore')
      if (saved) {
        const data = JSON.parse(saved)
        this.xp = data.xp || 0
        this.level = data.level || 1
      }
    },

    saveToLocalStorage() {
      localStorage.setItem(
        'consoleStore',
        JSON.stringify({ xp: this.xp, level: this.level }),
      )
    },

    saveMessagesToLocal() {
      localStorage.setItem(
        'consoleMessages',
        JSON.stringify(this.messages.slice(-100)),
      )
    },

    loadMessagesFromLocal() {
      const saved = localStorage.getItem('consoleMessages')
      if (saved) this.messages = JSON.parse(saved)
    },

    async fetchConsoleData() {
      this.hasFetched = true
      try {
        // Optional: fetch XP/level from backend via `/api/console/[userId]`
      } catch (error) {
        console.error('ConsoleStore fetch failed', error)
      }
    },

    async saveConsoleData() {
      try {
        // Optional: save XP/level to backend via `/api/console/[userId].post.ts`
      } catch (error) {
        console.warn('Could not save console progress')
      }
    },

    logMessage(text: string, type: ConsoleMessage['type']) {
      this.messages.push({
        id: Date.now(),
        text,
        type,
        timestamp: Date.now(),
      })

      this.saveMessagesToLocal()

      console.log(
        `%c[Console XP] ${text}`,
        'color: limegreen; font-weight: bold',
      )
    },

    logRandomMessage() {
      const types: Array<{ type: ConsoleMessage['type']; message: string }> = [
        { type: 'fun', message: randomFunLine() },
        { type: 'quote', message: randomQuote() },
        { type: 'trivia', message: randomTrivia() },
        (() => {
          const encounter = randomEncounter()
          this.incrementXP(encounter.xp)
          return { type: 'story', message: encounter.message }
        })(),
      ]

      const selected = types[Math.floor(Math.random() * types.length)]
      this.logMessage(selected.message, selected.type)
    },

    incrementXP(amount: number) {
      this.xp += amount
      this.saveToLocalStorage()

      while (
        this.level < LEVEL_THRESHOLDS.length &&
        this.xp >= LEVEL_THRESHOLDS[this.level]
      ) {
        this.levelUp()
      }
    },

    levelUp() {
      this.level++
      this.logMessage(`🎉 Level up! You're now Level ${this.level}`, 'system')
      this.saveConsoleData()
    },

    tickStory() {
      const seconds = this.sessionDuration
      if (seconds === 60) {
        this.logMessage(
          '🕐 One minute into the void. Bugs are stirring...',
          'story',
        )
      }
      if (seconds === 300) {
        this.logMessage('🍕 Five minutes in. Time for a snack break?', 'story')
      }
      if (seconds === 600) {
        this.logMessage('📦 Ten minutes deep. Logs are piling up...', 'story')
      }
    },
  },
})
