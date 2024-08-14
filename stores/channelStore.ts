import { defineStore } from 'pinia'
import type { Channel, Message } from '@prisma/client'
import { useErrorStore } from './../stores/errorStore' // Import errorStore
import { useUserStore } from './../stores/userStore'

export const useChannelStore = defineStore({
  id: 'channel',

  state: () => ({
    channels: [] as Channel[],
    messages: [] as Message[],
    isInitialized: false as boolean,
    currentChannel: null as Channel | null,
  }),

  actions: {
    async initializeChannels() {
      if (!this.isInitialized) {
        const errorStore = useErrorStore() // Use errorStore
        try {
          await this.fetchChannels()
          this.isInitialized = true
        } catch {
          errorStore.setError(
            ErrorType.UNKNOWN_ERROR,
            'Error initializing channels',
          )
          console.error(
            'Error initializing channels:',
            errorStore.getErrors().slice(-1)[0]?.message,
          )
        }
      }
    },

    setCurrentChannel(channelId: number) {
      const channel = this.channels.find((ch) => ch.id === channelId)
      if (channel) {
        this.currentChannel = channel
      }
    },

    async createOrUpdateChannel(channel: Partial<Channel>) {
      const userStore = useUserStore()
      const userId = userStore.userId
      const errorStore = useErrorStore() // Use errorStore

      try {
        const method = channel.id ? 'PATCH' : 'POST'
        const url = channel.id ? `/api/channels/${channel.id}` : '/api/channels'
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...channel, userId }),
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
      } catch {
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          'Error creating or updating channel',
        )
        console.error(
          'Error creating or updating channel:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    clearCurrentChannel() {
      this.currentChannel = null
    },

    async fetchCurrentChannelWithMessages(channelId: number) {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const res = await fetch(`/api/channels/${channelId}`)
        const data = await res.json()
        if (data.success) {
          this.currentChannel = data.channel
        }
      } catch {
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          'Error fetching current channel with messages',
        )
        console.error(
          'Error fetching current channel with messages:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    async fetchChannels() {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const res = await fetch('/api/channels')
        const data = await res.json()
        if (data.success) {
          this.channels = data.channels
        }
      } catch {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error fetching channels')
        console.error(
          'Error fetching channels:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    async removeChannel(id: number) {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const res = await fetch(`/api/channels/${id}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          this.channels = this.channels.filter((channel) => channel.id !== id)
        }
      } catch {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error removing channel')
        console.error(
          'Error removing channel:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    async fetchMessages() {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const res = await fetch('/api/messages')
        const data = await res.json()
        if (data.success) {
          this.messages = data.messages
        }
      } catch {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error fetching messages')
        console.error(
          'Error fetching messages:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    async createMessage(message: Partial<Message>) {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        })
        const data = await res.json()
        if (data.success) {
          this.messages.push(data.message)
        }
      } catch {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error creating message')
        console.error(
          'Error creating message:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    async updateMessage(message: Message) {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const res = await fetch(`/api/messages/${message.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        })
        const data = await res.json()
        if (data.success) {
          const index = this.messages.findIndex((msg) => msg.id === message.id)
          if (index !== -1) {
            this.messages[index] = data.message
          }
        }
      } catch {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error updating message')
        console.error(
          'Error updating message:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    async removeMessage(id: number) {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const res = await fetch(`/api/messages/${id}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          this.messages = this.messages.filter((message) => message.id !== id)
        }
      } catch {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error removing message')
        console.error(
          'Error removing message:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },
  },
})

export type { Channel, Message }
