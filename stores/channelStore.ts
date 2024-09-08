import { defineStore } from 'pinia'
import type { Channel, Message, Reaction } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore'
import { useArtStore } from './../stores/artStore'
import { useGalleryStore } from './../stores/galleryStore'
import { useUserStore } from './../stores/userStore'
import { usePromptStore } from './../stores/promptStore'
import { usePitchStore } from './../stores/pitchStore'
import { useComponentStore } from './../stores/componentStore'
import { useTagStore } from './../stores/tagStore'

export const useChannelStore = defineStore({
  id: 'channel',

  state: () => ({
    channels: [] as Channel[],
    messages: [] as Message[],
    reactions: [] as Reaction[],
    isInitialized: false as boolean,
    currentChannel: null as Channel | null,
    loading: false,
    defaultChannels: {
      general: 1, // Hardset channel "general" as ID 1
      user: null,
      gallery: null,
      art: null,
      prompt: null,
      pitch: null,
      component: null,
      tag: null,
    },
  }),

  getters: {
    // Computed channel for the Art Store
    artChannel: (state) => {
      const artStore = useArtStore()
      const artChannelId = artStore.selectedArt?.channelId
      return state.channels.find(channel => channel.id === artChannelId) || null
    },

    // Computed channel for the Gallery Store
    galleryChannel: (state) => {
      const galleryStore = useGalleryStore()
      const galleryChannelId = galleryStore.currentGallery?.channelId
      return state.channels.find(channel => channel.id === galleryChannelId) || null
    },

    userChannel: (state) => {
      const userStore = useUserStore()
      const user = userStore.user
      const userChannelId = user?.Channels?.[0]?.id // Assuming the first channel is the user's private channel
      return state.channels.find(channel => channel.id === userChannelId) || null
    },
    

    // Computed channel for the Prompt Store
    promptChannel: (state) => {
      const promptStore = usePromptStore()
      const promptChannelId = promptStore.selectedPrompt?.channelId
      return state.channels.find(channel => channel.id === promptChannelId) || null
    },

    // Computed channel for the Pitch Store
    pitchChannel: (state) => {
      const pitchStore = usePitchStore()
      const pitchChannelId = pitchStore.selectedPitch?.channelId
      return state.channels.find(channel => channel.id === pitchChannelId) || null
    },

    // Computed channel for the Component Store
    componentChannel: (state) => {
      const componentStore = useComponentStore()
      const componentChannelId = componentStore.selectedComponent?.channelId
      return state.channels.find(channel => channel.id === componentChannelId) || null
    },

    // Computed channel for the Tag Store
    tagChannel: (state) => {
      const tagStore = useTagStore()
      const tagChannelId = tagStore.selectedTag?.channelId
      return state.channels.find(channel => channel.id === tagChannelId) || null
    },
  },

  actions: {
    // Set the default channels by their ID (removed `playerId`)
    setDefaultChannels({
      generalId = 1,
      userId = null,
      galleryId = null,
      artId = null,
      promptId = null,
      pitchId = null,
      componentId = null,
      tagId = null,
    }) {
      this.defaultChannels = {
        general: generalId,
        user: userId,
        gallery: galleryId,
        art: artId,
        prompt: promptId,
        pitch: pitchId,
        component: componentId,
        tag: tagId,
      }
    },

    // Initialize channels and set the default ones
    async initializeChannels() {
      if (this.isInitialized) return
      const errorStore = useErrorStore()

      await errorStore.handleError(
        async () => {
          await this.fetchChannels()
          this.currentChannel = this.channels.find(
            (channel) => channel.id === this.defaultChannels.general,
          ) || null
          this.isInitialized = true
        },
        ErrorType.UNKNOWN_ERROR,
        'Error initializing channels',
      )
    },

    // Method to set the current active channel by ID
    setCurrentChannel(channelId: number) {
      const channel = this.channels.find((ch) => ch.id === channelId)
      if (channel) this.currentChannel = channel
    },

    // Fetch channels associated with a specific component
    async fetchChannelsByComponentId(componentId: number) {
      const errorStore = useErrorStore()
      this.loading = true
      return errorStore
        .handleError(
          async () => {
            const res = await fetch(`/api/components/${componentId}/channels`)
            const data = await res.json()

            if (data.success) {
              this.channels = data.channels
            } else {
              throw new Error(data.message || 'Failed to fetch channels')
            }
          },
          ErrorType.NETWORK_ERROR,
          'Error fetching channels',
        )
        .finally(() => {
          this.loading = false
        })
    },

    // Fetch messages for a specific channel
    async fetchMessagesByChannelId(channelId: number) {
      const errorStore = useErrorStore()
      this.loading = true
      return errorStore
        .handleError(
          async () => {
            const res = await fetch(`/api/channels/${channelId}/messages`)
            const data = await res.json()

            if (data.success) {
              this.messages.push(...data.messages)
            } else {
              throw new Error(data.message || 'Failed to fetch messages')
            }
          },
          ErrorType.NETWORK_ERROR,
          'Error fetching messages',
        )
        .finally(() => {
          this.loading = false
        })
    },

    // Fetch all available channels
    async fetchChannels() {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const res = await fetch('/api/channels')
          const data = await res.json()

          if (data.success) {
            this.channels = data.channels
          }
        },
        ErrorType.NETWORK_ERROR,
        'Error fetching channels',
      )
    },

    // Remove a channel by its ID
    async removeChannel(id: number) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' })
          if (res.ok) {
            this.channels = this.channels.filter((channel) => channel.id !== id)
          }
        },
        ErrorType.UNKNOWN_ERROR,
        'Error removing channel',
      )
    },
  },
})

export type { Channel, Message, Reaction }
