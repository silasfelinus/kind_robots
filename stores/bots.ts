/* eslint-disable @typescript-eslint/indent */
// store/bots.ts
import { defineStore } from 'pinia'
import axios, { AxiosError } from 'axios'
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

      // get the themeStore
      const themeStore = useThemeStore()

      // check if the bot has a theme
      if (bot.theme) {
        // call the changeTheme action of themeStore
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
    getPrompt(botId: number): string {
      return this.prompts[botId] || ''
    },
    createChatbotMessages(bot: Bot) {
      if (bot.botType === 'chatbot') {
        console.log('Bot is of type chatbot. Creating messages...')
        return [
          {
            role: 'system',
            content: `You are a helpful ${bot.botType}.`
          },
          {
            role: 'user',
            content: bot.prompt
          }
        ]
      }
      console.log('Bot is not of type chatbot. No messages created.')
      return []
    },
    async sendData(bot: Bot) {
      try {
        const messages = this.createChatbotMessages(bot)
        const payload = {
          model: 'gpt-3.5-turbo',
          messages,
          temperature: bot.temperature,
          max_tokens: bot.maxTokens,
          post: bot.post,
          n: bot.n
        }

        console.log('Data being sent:', payload)
        console.log(
          `Sending data for bot ID ${bot.id} to https://kindrobots.org/api/botcafe/chatbot: `,
          payload
        )

        const response = await axios.post('https://kindrobots.org/api/botcafe/chatbot', payload)
        console.log('Received response from https://kindrobots.org/api/botcafe/chatbot: ', response)

        return response
      } catch (error) {
        let errorMessage
        if (error instanceof AxiosError) {
          errorMessage = error.response
            ? `Error ${error.response.status}: ${error.response.data}`
            : `Failed to send data: ${error.message}`
        } else {
          errorMessage = 'An unknown error occurred'
        }
        console.error(errorMessage)
        throw new Error(errorMessage)
      }
    }
  }
})
