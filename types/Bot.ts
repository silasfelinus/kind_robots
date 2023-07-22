// ~/types/bot.ts
import { Image } from './Image'
import { Timestamp, BotType } from './utils'

export interface Bot {
  id: number
  createdAt: Timestamp
  updatedAt: Timestamp
  BotType: BotType
  name: string
  isPublic: boolean
  underConstruction: boolean
  canDelete: boolean
  subtitle: string
  description: string
  avatarImage: string
  botIntro: string
  userIntro: string
  prompt: string
  trainingPath?: string
  theme?: string
  personality: string
  modules?: string
  userId?: number
  Images?: Image[]
}
