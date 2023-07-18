// store/response.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { Bot } from '../types/bot'

interface Response {
  id: number
  role: string
  content: string
}

export const useResponseStore = defineStore('response', {
  state: () => ({
    responses: [] as Response[],
    activeResponseId: 0
  }),
  getters: {
    getResponses(): Response[] {
      return this.responses
    },
    getActiveResponse(): Response | undefined {
      return this.responses.find((response) => response.id === this.activeResponseId)
    }
  },
  actions: {
    async fetchResponses(bot: Bot) {
      const RESPONSE_URL = `/api/botcafe/${bot.id}/responses`

      try {
        const response = await axios.get(RESPONSE_URL, {
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.data) {
          console.error('Received unexpected data:', response)
          return
        }
        this.responses = response.data
      } catch (error) {
        console.error('Error fetching responses:', error)
      }
    },
    addResponse(response: Response) {
      this.responses = [...this.responses, response]
    },
    setActiveResponseId(id: number) {
      this.activeResponseId = id
    },
    resetActiveResponse() {
      this.activeResponseId = this.responses[0] ? this.responses[0].id : 0
    }
  }
})
