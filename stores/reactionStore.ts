// ~/store/reactions.ts
import { defineStore } from 'pinia'
import { Reaction as ReactionRecord } from '@prisma/client'
import axios from 'axios'

export type Reaction = ReactionRecord

interface ReactionState {
  reactions: Reaction[]
  currentReaction: Reaction | null
  totalReactions: number
  errors: string[]
}

export const useReactionStore = defineStore({
  id: 'reactions',
  state: (): ReactionState => ({
    reactions: [],
    currentReaction: null,
    totalReactions: 0,
    errors: []
  }),
  actions: {
    async getReactions(page = 1, pageSize = 10) {
      const { data } = await axios.get(`/api/reactions?page=${page}&pageSize=${pageSize}`)
      this.reactions = data
    },
    async getReactionById(id: number) {
      const { data } = await axios.get(`/api/reactions/${id}`)
      this.currentReaction = data
    },
    async addReactions(reactionData: Partial<Reaction>[]) {
      const { data } = await axios.post(`/api/reactions`, reactionData)
      this.reactions = data.reactions
      this.errors = data.errors

      // Update the total reactions count after adding new reactions
      await this.countReactions()
    },
    async updateReaction(id: number, data: Partial<Reaction>) {
      const { data: updatedReaction } = await axios.put(`/api/reactions/${id}`, data)
      this.currentReaction = updatedReaction

      // Fetch the updated list of reactions after updating a reaction
      await this.getReactions()
    },
    async deleteReaction(id: number) {
      await axios.delete(`/api/reactions/${id}`)

      // Fetch the updated list of reactions and total reactions count after deleting a reaction
      await this.getReactions()
      await this.countReactions()
    },
    async randomReaction() {
      const { data } = await axios.get(`/api/reactions/random`)
      this.currentReaction = data
    },
    async countReactions() {
      const { data } = await axios.get(`/api/reactions/count`)
      this.totalReactions = data
    }
  }
})
