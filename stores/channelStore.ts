import { defineStore } from 'pinia'
import type { Message } from '@prisma/client'
import { useErrorStore, ErrorType } from './errorStore'

interface Channel {
  id: number
  label: string
  description: string | null
  title: string | null
  userId: number | null
  componentId: number | null // Field for component association
  createdAt: Date
  updatedAt: Date | null
}

export const useChannelStore = defineStore({
  id: 'channel',

  state: () => ({
    channels: [] as Channel[],
    messages: [] as Message[],
    currentChannel: null as Channel | null,
    loading: false,
    isInitialized: false,
  }),

  actions: {
    getChannelsForComponent(componentId: number): Channel[] {
      return this.channels.filter(
        (channel) => channel.componentId === componentId,
      )
    },

    async initializeChannels() {
      if (this.isInitialized) return
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch('/api/channels')
        const data = await res.json()

        if (data.success) {
          this.channels = data.channels
          this.isInitialized = true
        } else {
          throw new Error('Failed to fetch channels')
        }
      } catch (error: unknown) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Error initializing channels',
        )
      } finally {
        this.loading = false
      }
    },

    async fetchChannelByComponentId(componentId: number) {
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch(`/api/components/${componentId}/channel`)
        const data = await res.json()

        if (data.success) {
          this.channels = [data.channel] // A component has one channel
        } else {
          throw new Error('Failed to fetch channel for component')
        }
      } catch (error: unknown) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Error fetching channel for component',
        )
      } finally {
        this.loading = false
      }
    },

    setCurrentChannel(channelId: number) {
      this.currentChannel = this.channels.find((ch) => ch.id === channelId) || null
    },

    async removeChannel(channelId: number) {
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch(`/api/channels/${channelId}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          this.channels = this.channels.filter((ch) => ch.id !== channelId)
          if (this.currentChannel?.id === channelId) {
            this.currentChannel = null
          }
        } else {
          throw new Error('Failed to remove channel')
        }
      } catch (error: unknown) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Unknown error occurred while removing channel',
        )
      } finally {
        this.loading = false
      }
    },

    async fetchMessagesByChannelId(channelId: number) {
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch(`/api/channels/${channelId}/messages`)
        const data = await res.json()

        if (data.success) {
          const newMessages = data.messages.filter(
            (message: Message) => !this.messages.some((m) => m.id === message.id),
          )
          this.messages.push(...newMessages)
        } else {
          throw new Error('Failed to fetch messages for channel')
        }
      } catch (error: unknown) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Error fetching messages for channel',
        )
      } finally {
        this.loading = false
      }
    },

    async fetchChannels() {
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch('/api/channels')
        const data = await res.json()
        if (data.success) {
          this.channels = data.channels
        } else {
          throw new Error('Failed to fetch channels')
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Error fetching channels: ' + (error instanceof Error ? error.message : 'Unknown error'),
        )
      } finally {
        this.loading = false
      }
    },

    async createChannel(newChannel: { title: string; label: string }) {
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch('/api/channels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newChannel),
        })
        const data = await res.json()

        if (data.success) {
          this.channels.push(data.channel)
        } else {
          throw new Error('Failed to create channel')
        }
      } catch (error: unknown) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Unknown error occurred while creating a channel',
        )
      } finally {
        this.loading = false
      }
    },

    getMessagesForChannel(channelId: number): Message[] {
      return this.messages.filter((message) => message.channelId === channelId)
    },

    async sendMessage(newMessage: { content: string; channelId: number; userId: number; sender: string }) {
      const errorStore = useErrorStore()
      this.loading = true
      try {
        const res = await fetch(`/api/channels/${newMessage.channelId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newMessage.content,
            userId: newMessage.userId,
            sender: newMessage.sender,
          }),
        })
        const data = await res.json()

        if (data.success) {
          this.messages.push(data.message)
        } else {
          throw new Error('Failed to send message')
        }
      } catch (error: unknown) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Unknown error occurred while sending the message',
        )
      } finally {
        this.loading = false
      }
    },
  },
})

export type { Message, Channel }
