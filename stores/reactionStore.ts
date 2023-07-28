// ~/stores/reactionStore.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { Reaction } from '@prisma/client' // Import the Reaction type based on your actual types file
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'
import { reactionData } from './seeds/seedReactions' // Assuming you have a seeds file for Reaction data

const errorStore = useErrorStore()
const statusStore = useStatusStore()

interface ReactionStoreState {
  reactions: Reaction[]
  currentReaction: Reaction | null
  totalReactions: number
  errors: string[]
  page: number
  pageSize: number
}

export const useReactionStore = defineStore({
  id: 'reactions',
  state: (): ReactionStoreState => ({
    reactions: [],
    currentReaction: null,
    totalReactions: 0,
    errors: [],
    page: 1,
    pageSize: 100
  }),
  actions: {
    async loadStore(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Loading reaction store...')
      try {
        // Get the current count of reactions
        await this.countReactions()
        if (this.totalReactions === 0) {
          await this.seedReactions()
        }

        // Load other store data
        await this.getReactions(this.page, this.pageSize)

        statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.reactions.length} reactions`)
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error initializing reaction store: ' + error)
      }
    },
    async getReactions(page = 1, pageSize = 10): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching reactions...')
      try {
        const { data } = await axios.get(`/api/reactions?page=${page}&pageSize=${pageSize}`)
        this.reactions = [...this.reactions, ...data]
        this.page++
        statusStore.setStatus(StatusType.SUCCESS, `Fetched ${this.reactions.length} reactions`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch reactions: ' + error)
      }
    },
    async getReactionById(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching reaction with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/reactions/${id}`)
        this.currentReaction = data
        statusStore.setStatus(StatusType.SUCCESS, `Fetched reaction with id ${id}`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch reaction by id: ' + error)
      }
    },
    async addReactions(reactionData: Partial<Reaction>[]): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Adding new reactions...')
      try {
        const { data } = await axios.post(`/api/reactions`, reactionData)
        this.reactions = [...this.reactions, ...data.reactions]
        this.errors = data.errors
        statusStore.setStatus(StatusType.SUCCESS, `Added ${this.reactions.length} reactions`)
        // Update the total reactions count after adding new reactions
        await this.countReactions()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to add reactions: ' + error)
      }
    },
    async updateReaction(id: number, data: Partial<Reaction>): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Updating reaction with id ${id}...`)
      try {
        const { data: updatedReaction } = await axios.put(`/api/reactions/${id}`, data)
        this.currentReaction = updatedReaction
        statusStore.setStatus(StatusType.SUCCESS, `Updated reaction with id ${id}`)
        // Fetch the updated list of reactions after updating a reaction
        await this.getReactions()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to update reaction: ' + error)
      }
    },
    async deleteReaction(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Deleting reaction with id ${id}...`)
      try {
        await axios.delete(`/api/reactions/${id}`)
        statusStore.setStatus(StatusType.SUCCESS, `Deleted reaction with id ${id}`)
        // Fetch the updated list of reactions and total reactions count after deleting a reaction
        await this.getReactions()
        await this.countReactions()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to delete reaction: ' + error)
      }
    },
    async randomReaction(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching a random reaction...')
      try {
        const { data } = await axios.get(`/api/reactions/random`)
        this.currentReaction = data
        statusStore.setStatus(StatusType.SUCCESS, 'Fetched a random reaction')
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch a random reaction: ' + error)
      }
    },
    async countReactions(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Counting reactions...')
      try {
        const { data } = await axios.get(`/api/reactions/count`)
        this.totalReactions = data
        statusStore.setStatus(
          StatusType.SUCCESS,
          `Counted a total of ${this.totalReactions} reactions`
        )
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to count reactions: ' + error)
      }
    },
    async seedReactions(): Promise<void> {
      // If there are no reactions, load them
      statusStore.setStatus(StatusType.INFO, 'Seeding reactions...')
      try {
        await this.addReactions(reactionData)
        statusStore.setStatus(StatusType.SUCCESS, 'Reactions successfully seeded.')
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error loading reactions: ' + error)
      }

      // Fetch the updated list of reactions and total reactions count after seeding
      await this.getReactions()
      await this.countReactions()
    }
  }
})
