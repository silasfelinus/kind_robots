// stores/consoleStore.ts

import { defineStore } from 'pinia'
import { useUserStore } from './userStore'

type ConsoleMessage = {
  id: number
  text: string
  type: 'fun' | 'holiday' | 'story' | 'system'
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
    async init() {
      const userStore = useUserStore()
      this.userId = userStore.user?.id || null

      this.loginStart = Date.now()
      this.loadFromLocalStorage()

      if (!this.hasFetched) {
        await this.fetchConsoleData()
      }

      this.logRandomMessage()
      this.logSeasonalMessage()
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

      console.log(
        `%c[Console XP] ${text}`,
        'color: limegreen; font-weight: bold',
      )
    },

    logRandomMessage() {
      const funLines = [
        '🛠️ Debugger gnomes deployed!',
        '🐛 A bug got squashed. RIP.',
        '🧠 Brain mode activated. You are now thinking in code.',
        '⚡ Lightning struck your console… it got smarter.',
        '😴 The hamsters powering your app fell asleep again!',
        '🚀 You launched another log! Boom!',
      ]

      const random = funLines[Math.floor(Math.random() * funLines.length)]
      this.logMessage(random, 'fun')
    },

    logSeasonalMessage() {
      const now = new Date()
      const month = now.getMonth()
      const date = now.getDate()

      if (month === 11 && date === 25) {
        this.logMessage('🎄 Debug-mas cheer! All bugs on holiday.', 'holiday')
      } else if (month === 9 && date === 31) {
        this.logMessage('🎃 Boo! A spooky bug just escaped.', 'holiday')
      } else if (month === 6 && date === 4) {
        this.logMessage('🧨 Happy Independence Day of Debugging!', 'holiday')
      }
    },

    incrementXP(amount: number) {
      this.xp += amount
      this.saveToLocalStorage()

      if (this.xp >= LEVEL_THRESHOLDS[this.level]) {
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
