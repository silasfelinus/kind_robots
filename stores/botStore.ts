// ~/stores/botStore.ts
import { defineStore } from 'pinia'
import { Bot, fetchBots, fetchBotById, addBots, updateBot, deleteBot } from '../server/api/bots'

interface BotState {
  bots: Bot[]
  selectedBots: Bot[]
  activeBot: Bot | null
}

export const useBotStore = defineStore({
  id: 'bots',
  state: (): BotState => ({
    bots: [],
    selectedBots: [],
    activeBot: null
  }),
  getters: {
    getBots(): Bot[] {
      return this.bots
    },
    getActiveBot(): Bot | null {
      return this.activeBot
    },
    getSelectedBots(): Bot[] {
      return this.selectedBots
    }
  },
  actions: {
    async fetchBots(page = 1, pageSize = 10): Promise<void> {
      try {
        this.bots = await fetchBots(page, pageSize)
      } catch (error) {
        throw new Error('Failed to fetch bots.')
      }
    },
    async fetchBotById(id: number): Promise<void> {
      try {
        const bot = await fetchBotById(id)
        if (bot) {
          const botIndex = this.bots.findIndex((existingBot) => existingBot.id === id)
          if (botIndex !== -1) {
            this.bots.splice(botIndex, 1, bot)
          } else {
            this.bots.push(bot)
          }
        }
      } catch (error) {
        throw new Error('Failed to fetch bot by id.')
      }
    },
    async addBots(botsData: Partial<Bot>[]): Promise<void> {
      try {
        const { bots: newBots } = await addBots(botsData)
        this.bots.push(...newBots)
      } catch (error) {
        throw new Error('Failed to add bots.')
      }
    },
    async updateBot(id: number, data: Partial<Bot>): Promise<void> {
      try {
        const updatedBot = await updateBot(id, data)
        if (updatedBot) {
          const botIndex = this.bots.findIndex((bot) => bot.id === id)
          if (botIndex !== -1) {
            this.bots.splice(botIndex, 1, updatedBot)
          }
        }
      } catch (error) {
        throw new Error('Failed to update bot.')
      }
    },
    async deleteBot(id: number): Promise<void> {
      try {
        await deleteBot(id)
        const botIndex = this.bots.findIndex((bot) => bot.id === id)
        if (botIndex !== -1) {
          this.bots.splice(botIndex, 1)
        }
      } catch (error) {
        throw new Error('Failed to delete bot.')
      }
    },
    selectBot(botId: number): void {
      const bot = this.bots.find((bot) => bot.id === botId)
      if (bot) {
        this.selectedBots.push(bot)
        this.activeBot = bot
      } else {
        throw new Error('Cannot select bot that does not exist')
      }
    },
    setActiveBot(botId: number): void {
      const bot = this.bots.find((bot) => bot.id === botId)
      if (bot) {
        this.activeBot = bot
      } else {
        throw new Error('Cannot set active bot that does not exist')
      }
    },
    deselectBot(botId: number): void {
      const botIndex = this.selectedBots.findIndex((bot) => bot.id === botId)
      if (botIndex !== -1) {
        this.selectedBots.splice(botIndex, 1)
        this.activeBot = this.selectedBots.slice(-1)[0] || null
      } else {
        throw new Error('Cannot deselect bot that is not selected')
      }
    },
    randomBot(): void {
      const randomIndex = Math.floor(Math.random() * this.bots.length)
      this.activeBot = this.bots[randomIndex]
    },
    setBots(bots: Bot[]) {
      this.bots.splice(0, this.bots.length, ...bots)
    }
  }
})
