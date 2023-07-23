// ~/types/gallery.ts
import { Timestamp } from './utils'
import { Media } from './media'

export interface Gallery {
  id: number
  createdAt: Timestamp
  updatedAt: Timestamp
  name: string
  Media: Media[]
  description?: string
  promoImages?: string
  url?: string
  isNSFW: boolean
  custodian?: string
  userId?: number
}
