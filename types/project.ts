// ~/types/project.ts
import { Timestamp } from './utils'

export interface Project {
  id: number
  createdAt: Timestamp
  updatedAt: Timestamp
  name: string
  title: string
  category: string
  content: string
  allowComments: boolean
  description: string
  isPublic: boolean
  hasAdmission: boolean
  paywallDestination: string
  usdFee: number
  portalUrl: string
  pitchUrl: string
  userId: number
}
