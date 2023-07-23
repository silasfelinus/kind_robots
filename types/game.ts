// ~/types/quest.ts
import { Timestamp } from './utils'
import { User } from './user'

export interface Game {
  id: number
  createdAt: Timestamp
  updatedAt: Timestamp
  content: string
  category: string
  isFinished: boolean
  user: User
  userId: number
  reward: string
  icon: string
  points: number
  isPrivate: boolean
}
