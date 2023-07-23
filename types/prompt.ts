// ~/types/prompt.ts
import { Timestamp, ModelType, StringType } from './utils'

export interface Prompt {
  id: number
  createdAt: Timestamp
  updatedAt: Timestamp
  StringType: StringType
  label: string
  content: string
  userId: number
  sender?: ModelType
  senderId?: number
  recipient?: ModelType
  recipientId?: number
}
