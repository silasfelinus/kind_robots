/* eslint-disable @typescript-eslint/indent */
// store/bots.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { Bot } from '@prisma/client'
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
    async sendChat(bot: Bot) {
      const CHAT_URL = '/api/botcafe/chat'

      // create API payload
      const apiPayload = {
        messages: [
          { role: 'system', content: 'you are' + bot.name + 'a helpful' + bot.botType },
          { role: 'user', content: bot.intro + ' ' + bot.currentPrompt }
        ],
        model: bot.model || 'gpt-3.5-turbo',
        maxTokens: bot.maxTokens || 100,
        temperature: bot.temperature || 0.0,
        n: bot.n || 1
      }

      // send the API request
      try {
        const response = await axios.post(CHAT_URL, apiPayload, {
          headers: {
            'Content-Type': 'application/json'
          }
        })

        // check if response data or choices in response data is undefined
        if (!response.data) {
          console.error('Received unexpected data:', response)
          return
        }
        return response.data
      } catch (error) {
        console.error('Error sending chat:', error)
      }
    },
    setActiveBot(bot: Bot) {
      this.activeBot = bot

      const themeStore = useThemeStore()

      if (bot.theme) {
        themeStore.changeTheme(bot.theme)
      }
    },
    setActiveBotId(id: number) {
      this.activeBotId = id
      const bot = this.bots.find((bot) => bot.id === id)
      if (bot) {
        this.activeBot = bot

        const themeStore = useThemeStore()

        if (bot.theme) {
          themeStore.changeTheme(bot.theme)
        }
      }
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
