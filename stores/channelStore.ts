import { defineStore } from 'pinia'
import { Channel, Message } from '@prisma/client'
import { errorHandler } from '../server/api/utils/error'
import { useUserStore } from '@/stores/userStore'

export const useChannelStore = defineStore({
  id: 'channel',

  state: () => ({
    channels: [],
    messages: [],
    isInitialized: false,
    currentChannel: null as Channel | null
  }),

  actions: {
    async initializeChannels() {
      if (!isInitialized) {
        try {
          await this.fetchChannels()
          isInitiliazed = true
        } catch (error: any) {
          const handledError = errorHandler(error)
          console.error('Error initializing channels:', handledError.message)
        }
      }
    },
    setCurrentChannel(channelId: number) {
      const channel = this.channels.find((ch) => ch.id === channelId)
      if (channel) {
        this.currentChannel = channel
      }
    },

    // Method to clear the current channel
    clearCurrentChannel() {
      this.currentChannel = null
    },

    // Method to fetch the current channel with its messages
    async fetchCurrentChannelWithMessages(channelId: number) {
      try {
        const res = await fetch(`/api/channels/${channelId}/messages`)
        const channelWithMessages = await res.json()
        this.currentChannel = channelWithMessages
      } catch (error: any) {
        throw errorHandler(error)
      }
    },

    async fetchChannels() {
      try {
        const res = await fetch('/api/channels')
        this.channels = await res.json()
      } catch (error: any) {
        throw errorHandler(error)
      }
    },
    async createOrUpdateChannel(channel) {
      const userStore = useUserStore()
      const userId = userStore.userId
      try {
        const method = channel.id ? 'PATCH' : 'POST'
        const url = channel.id ? `/api/channels/${channel.id}` : '/api/channels'
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...channel, userId })
        })
        const updatedChannel = await res.json()
        if (channel.id) {
          const index = this.channels.findIndex((ch) => ch.id === channel.id)
          if (index !== -1) {
            this.channels[index] = updatedChannel
          }
        } else {
          this.channels.push(updatedChannel)
        }
      } catch (error: any) {
        throw errorHandler(error)
      }
    },
    async removeChannel(id) {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        this.channels = this.channels.filter((channel) => channel.id !== id)
      }
    },
    async fetchMessages() {
      const res = await fetch('/api/messages')
      this.messages = await res.json()
    },
    async createOrUpdateMessage(message) {
      const method = message.id ? 'PATCH' : 'POST'
      const url = message.id ? `/api/messages/${message.id}` : '/api/messages'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      })
      const updatedMessage = await res.json()
      if (message.id) {
        const index = this.messages.findIndex((msg) => msg.id === message.id)
        if (index !== -1) {
          this.messages[index] = updatedMessage
        }
      } else {
        this.messages.push(updatedMessage)
      }
    },
    async removeMessage(id) {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        this.messages = this.messages.filter((message) => message.id !== id)
      }
    },
    async sendMessageToChannel({ label, channelId, message }) {
      let targetChannelId = channelId
      if (!targetChannelId && label) {
        const targetChannel = this.channels.find((ch) => ch.label === label)
        if (targetChannel) {
          targetChannelId = targetChannel.id
        } else {
          const res = await fetch('/api/channels', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ label, userId: 0, description: `${label} channel` })
          })
          const newChannel = await res.json()
          this.channels.push(newChannel)
          targetChannelId = newChannel.id
        }
      }
      if (targetChannelId) {
        await this.createOrUpdateMessage({ ...message, channelId: targetChannelId })
      }
    }
  }
})

export type { Channel, Message }
