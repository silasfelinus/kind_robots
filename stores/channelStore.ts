import { defineStore } from 'pinia'
import type { Message } from '@prisma/client'
import { performFetch, handleError } from './utils'

interface Channel {
  id: number
  label: string
  description: string | null
  title: string | null
  userId: number | null
  componentId: number | null
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
      this.loading = true
      try {
        const response = await performFetch<{ channels: Channel[] }>(
          '/api/channels',
        )
        if (response.success) {
          this.channels = response.data?.channels || []
          this.isInitialized = true
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'initializing channels')
      } finally {
        this.loading = false
      }
    },

    async fetchChannelByComponentId(componentId: number) {
      this.loading = true
      try {
        const response = await performFetch<{ channel: Channel }>(
          `/api/components/${componentId}/channel`,
        )
        if (response.success && response.data?.channel) {
          this.channels = [response.data.channel] // A component has one channel
        } else if (!response.success) {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'fetching channel for component')
      } finally {
        this.loading = false
      }
    },

    setCurrentChannel(channelId: number) {
      const selectedChannel = this.channels.find((ch) => ch.id === channelId)
      this.currentChannel = selectedChannel ?? null
    },

    async removeChannel(channelId: number) {
      this.loading = true
      try {
        const response = await performFetch(`/api/channels/${channelId}`, {
          method: 'DELETE',
        })
        if (response.success) {
          this.channels = this.channels.filter((ch) => ch.id !== channelId)
          if (this.currentChannel?.id === channelId) {
            this.currentChannel = null
          }
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'removing channel')
      } finally {
        this.loading = false
      }
    },

    async fetchMessagesByChannelId(channelId: number) {
      this.loading = true
      try {
        const response = await performFetch<{ messages: Message[] }>(
          `/api/channels/${channelId}/messages`,
        )
        if (response.success) {
          const newMessages = response.data?.messages.filter(
            (message) => !this.messages.some((m) => m.id === message.id),
          )
          if (newMessages) this.messages.push(...newMessages)
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'fetching messages for channel')
      } finally {
        this.loading = false
      }
    },

    async fetchChannels() {
      this.loading = true
      try {
        const response = await performFetch<{ channels: Channel[] }>(
          '/api/channels',
        )
        if (response.success) {
          this.channels = response.data?.channels || []
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'fetching channels')
      } finally {
        this.loading = false
      }
    },

    async createChannel(newChannel: { title: string; label: string }) {
      this.loading = true
      try {
        const response = await performFetch<{ channel: Channel }>(
          '/api/channels',
          {
            method: 'POST',
            body: JSON.stringify(newChannel),
          },
        )
        if (response.success) {
          const createdChannel = response.data?.channel
          if (createdChannel) this.channels.push(createdChannel)
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'creating a channel')
      } finally {
        this.loading = false
      }
    },

    getMessagesForChannel(channelId: number): Message[] {
      return this.messages.filter((message) => message.channelId === channelId)
    },

    async sendMessage(newMessage: {
      content: string
      channelId: number
      userId: number
      sender: string
    }) {
      this.loading = true
      try {
        const response = await performFetch<{ message: Message }>(
          `/api/channels/${newMessage.channelId}/messages`,
          {
            method: 'POST',
            body: JSON.stringify({
              content: newMessage.content,
              userId: newMessage.userId,
              sender: newMessage.sender,
            }),
          },
        )
        if (response.success) {
          const createdMessage = response.data?.message
          if (createdMessage) this.messages.push(createdMessage)
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'sending message')
      } finally {
        this.loading = false
      }
    },
  },
})

export type { Message, Channel }
