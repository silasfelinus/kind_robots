export const useReactionStore = defineStore('reactionStore', {
  state: () => ({
    reactions: [] as Reaction[],
    loading: false,
    error: null as string | null,
    channels: [] as Channel[], // Store channels related to reactions
  }),

  getters: {
    getReactionsByComponentId: (state) => (componentId: number) =>
      state.reactions.filter((reaction: Reaction) => reaction.componentId === componentId),

    getUserReactionForComponent:
      (state) => (componentId: number, userId: number) =>
        state.reactions.find(
          (reaction: Reaction) =>
            reaction.componentId === componentId && reaction.userId === userId,
        ),

    getChannelsForComponent: (state) => (componentId: number) =>
      state.channels.filter((channel: Channel) =>
        state.reactions.some(
          (reaction: Reaction) =>
            reaction.componentId === componentId &&
            reaction.channelId === channel.id,
        ),
      ),
  },

  actions: {
    async fetchReactionsByComponentId(componentId: number) {
      this.loading = true
      try {
        const res = await fetch(`/api/components/${componentId}/reactions`)
        const data = await res.json()

        if (data.success) {
          this.reactions = data.reactions
        } else {
          throw new Error('Failed to fetch reactions')
        }
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch reactions'
      } finally {
        this.loading = false
      }
    },

    async fetchReactionsByArtId(artId: number) {
      this.loading = true
      try {
        const response = await fetch(`/api/reactions/art/${artId}`)
        if (!response.ok) throw new Error('Failed to fetch reactions')
        const data = await response.json()
        this.reactions = data.reactions
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Failed to fetch reactions'
      } finally {
        this.loading = false
      }
    },

    async createReactionWithChannel(
      reactionData: Partial<Reaction>,
      comment: { title: string; description: string },
    ) {
      try {
        const channelResponse = await fetch('/api/channels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            label: `Reaction-Component-${Date.now()}`,
            title: comment.title,
            description: comment.description,
          }),
        })

        const newChannel = await channelResponse.json()

        const reactionResponse = await fetch('/api/reactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...reactionData,
            channelId: newChannel.id,
          }),
        })

        const newReaction = await reactionResponse.json()
        this.reactions.push(newReaction)
        this.channels.push(newChannel)
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : 'Failed to create reaction with channel'
      }
    },

    async fetchChannelsByComponentId(componentId: number) {
      try {
        const response = await fetch(`/api/channels/component/${componentId}`)
        const data = await response.json()
        this.channels = data.channels
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Failed to fetch channels'
      }
    },

    async createReaction(reactionData: Partial<Reaction>) {
      this.loading = true
      try {
        const response = await fetch('/api/reactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reactionData),
        })
        if (!response.ok) {
          throw new Error('Failed to create reaction')
        }
        const newReaction = await response.json()
        this.reactions.push(newReaction)
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        this.loading = false
      }
    },

    async updateReaction(reactionId: number, reactionData: Partial<Reaction>) {
      this.loading = true
      try {
        const response = await fetch(`/api/reactions/${reactionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reactionData),
        })
        if (!response.ok) {
          throw new Error('Failed to update reaction')
        }
        const updatedReaction = await response.json()
        const index = this.reactions.findIndex((r: Reaction) => r.id === reactionId)
        if (index !== -1) {
          this.reactions[index] = updatedReaction
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        this.loading = false
      }
    },

    async deleteReaction(reactionId: number) {
      this.loading = true
      try {
        const response = await fetch(`/api/reactions/${reactionId}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          throw new Error('Failed to delete reaction')
        }
        this.reactions = this.reactions.filter(
          (reaction: Reaction) => reaction.id !== reactionId,
        )
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        this.loading = false
      }
    },
  },
})
