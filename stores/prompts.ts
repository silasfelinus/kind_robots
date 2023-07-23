// store/prompts.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { Prompt } from '@prisma/client'

export const usepromptsStore = defineStore('prompts', {
  state: () => ({
    prompt: [] as Prompt[],
    activepromptId: 0
  }),
  getters: {
    getprompts(): Prompt[] {
      return this.prompt
    },
    getActiveprompt(): Prompt | undefined {
      return this.prompt.find((prompt) => prompt.id === this.activepromptId)
    }
  },
  actions: {
    async fetchprompts(botId: number) {
      const PROMPT_URL = `/api/botcafe/${botId}/prompt`

      try {
        const prompt = await axios.get(PROMPT_URL, {
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!prompt.data) {
          console.error('Received unexpected data:', prompt)
          return
        }
        this.prompt = prompt.data
      } catch (error) {
        console.error('Error fetching prompt:', error)
      }
    },
    addprompt(prompt: Prompt) {
      this.prompt = [...this.prompt, prompt]
    },
    setActivepromptId(id: number) {
      this.activepromptId = id
    },
    resetActiveprompt() {
      this.activepromptId = this.prompt[0] ? this.prompt[0].id : 0
    }
  }
})
