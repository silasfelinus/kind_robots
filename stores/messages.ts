// store/matchmaker.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { Message } from '@prisma/client'

export const useMessagesStore = defineStore('messages', {
  state: () => ({
    message: [] as Message[],
    activeMessageId: 0
  }),
  getters: {
    getMessages(): Message[] {
      return this.message
    },
    getActiveMessage(): Message | undefined {
      return this.message.find((Message) => Message.id === this.activeMessageId)
    }
  },
  actions: {
    async fetchMessages(bot: Bot) {
      const MESSAGE_URL = `/api/botcafe/${bot.id}/message`

      try {
        const Message = await axios.get(MESSAGE_URL, {
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!Message.data) {
          console.error('Received unexpected data:', Message)
          return
        }
        this.message = Message.data
      } catch (error) {
        console.error('Error fetching message:', error)
      }
    },
    addMessage(message: Message) {
      this.message = [...this.message, message]
    },
    setActiveMessageId(id: number) {
      this.activeMessageId = id
    },
    resetActiveMessage() {
      this.activeMessageId = this.message[0] ? this.message[0].id : 0
    }
  }
})
