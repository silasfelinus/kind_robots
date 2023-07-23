// ~/stores/reactionStore.ts
import { defineStore } from 'pinia'
import { Reaction as ReactionRecord } from '@prisma/client'
import {
  fetchReactions,
  fetchReactionById,
  addReactions,
  updateReaction,
  deleteReaction
} from '../server/api/reactions'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Reaction = ReactionRecord

interface ReactionState {
  reactions: Reaction[]
  selectedReaction: Reaction | null
}

export const useReactionStore = defineStore({
  id: 'reactions',
  state: (): ReactionState => ({
    reactions: [],
    selectedReaction: null
  }),
  getters: {
    getSelectedReaction(): Reaction | null {
      return this.selectedReaction
    }
  },
  actions: {
    async fetchReactions(page = 1, pageSize = 10): Promise<void> {
      await errorStore.handleError(
        async () => {
          this.reactions = await fetchReactions(page, pageSize)
          statusStore.setStatus(StatusType.SUCCESS, 'Reactions fetched successfully.')
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch reactions.'
      )
    },
    async fetchReactionById(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const reaction = await fetchReactionById(id)
          if (reaction) {
            const reactionIndex = this.reactions.findIndex(
              (existingReaction) => existingReaction.id === id
            )
            if (reactionIndex !== -1) {
              this.reactions.splice(reactionIndex, 1, reaction)
            } else {
              this.reactions.push(reaction)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch reaction by id.'
      )
    },
    async addReactions(reactionData: Partial<Reaction>[]): Promise<void> {
      await errorStore.handleError(
        async () => {
          const { reactions: newReactions } = await addReactions(reactionData)
          this.reactions.push(...newReactions)
          statusStore.setStatus(
            StatusType.SUCCESS,
            `${newReactions.length} reaction(s) added successfully.`
          )
        },
        ErrorType.NETWORK_ERROR,
        'Failed to add reactions.'
      )
    },
    async updateReaction(id: number, data: Partial<Reaction>): Promise<void> {
      await errorStore.handleError(
        async () => {
          const updatedReaction = await updateReaction(id, data)
          if (updatedReaction) {
            const reactionIndex = this.reactions.findIndex((reaction) => reaction.id === id)
            if (reactionIndex !== -1) {
              this.reactions.splice(reactionIndex, 1, updatedReaction)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to update reaction.'
      )
    },
    async deleteReaction(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const deleteSuccess = await deleteReaction(id)
          if (deleteSuccess) {
            const reactionIndex = this.reactions.findIndex((reaction) => reaction.id === id)
            if (reactionIndex !== -1) {
              this.reactions.splice(reactionIndex, 1)
              statusStore.setStatus(StatusType.SUCCESS, 'Reaction deleted successfully.')
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to delete reaction.'
      )
    },
    selectReaction(reactionId: number): void {
      const reaction = this.reactions.find((reaction) => reaction.id === reactionId)
      if (reaction) {
        this.selectedReaction = reaction
      } else {
        throw new Error('Cannot select reaction that does not exist')
      }
    },
    deselectReaction(): void {
      this.selectedReaction = null
    }
  }
})
