// ~/types/gallery.ts
import { Timestamp } from './utils'
import { Image } from './Image'

export interface Gallery {
  id: number
  createdAt: Timestamp
  updatedAt: Timestamp
  name: string
  Images: Image[]
  description?: string
  promoImages?: string
  url?: string
  isNSFW: boolean
  custodian?: string
  userId?: number
}
