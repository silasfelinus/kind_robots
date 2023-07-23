// ~/types/reaction.ts
import { Timestamp, ModelType } from './utils'
import { User } from './user'

export interface Reaction {
  id: number
  user: User
  userId: number
  createdAt: Timestamp
  updatedAt: Timestamp
  reviewTitle: string
  modelType: ModelType
  modelId: number
  content: string
  rating: number
}
