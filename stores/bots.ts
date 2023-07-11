/* eslint-disable @typescript-eslint/indent */
// store/bots.ts
import { defineStore } from 'pinia'
import { Bot } from '../types/bot'
import { localBots } from '../botMap'
import { useThemeStore } from './theme'

export const useBotsStore = defineStore('bots', {
  state: () => ({
    bots: localBots as Bot[],
    activeBot: localBots[0] as Bot,
    activeBotId: localBots[0] ? localBots[0].id : 0,
    prompts: localBots.reduce((acc, bot) => ({ ...acc, [bot.id]: bot.prompt }), {}) as Record<
      number,
      string
    >
  }),
  getters: {
    getBots(): Bot[] {
      return this.bots
    },
    getActiveBot(): Bot {
      return this.activeBot
    },
    getActiveBotId(): number {
      return this.activeBotId
    },
    getDefaultBot(): Bot {
      return this.bots[0]
    }
  },
  actions: {
    setActiveBot(bot: Bot) {
      this.activeBot = bot
      this.activeBotId = bot.id

      const themeStore = useThemeStore()

      if (bot.theme) {
        themeStore.changeTheme(bot.theme)
      }
    },
    setActiveBotId(id: number) {
      this.activeBotId = id
      const bot = this.bots.find((bot) => bot.id === id)
      if (bot) this.setActiveBot(bot)
    },
    setBots(bots: Bot[]) {
      this.bots = bots
    },
    resetActiveBot() {
      this.activeBot = this.bots[0]
      this.activeBotId = this.bots[0] ? this.bots[0].id : 0
    },
    setPrompt(botId: number, prompt: string) {
      this.prompts[botId] = prompt
    },
    getPrompts(botId: number): string {
      return this.prompts[botId] || ''
    }
  }
})
