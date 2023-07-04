export interface Bot {
  id: number
  name: string
  botType: string
  description: string
  avatarImage?: string
  model?: string
  post?: string
  temperature?: number
  maxTokens?: number
  prompt: string
  image?: string
  mask?: string
  style?: string
  n?: number
  createdAt?: Date
  updatedAt?: Date
  intro?: string
  size?: string
}
