// ~/types/image.ts
import { Timestamp, MediaType } from './utils'

export interface Media {
  id: number
  createdAt: Timestamp
  updatedAt: Timestamp
  path: string
  isNSFW: boolean
  isFavorite: boolean
  isFlagged: boolean
  tags: string
  designer?: string
  description?: string
  negative?: string
  steps?: number
  seed?: number
  sampler?: string
  cfg?: string
  size?: string
  modelHash?: string
  modelName?: string
  template?: string
  negTemplate?: string
  clipData?: string
  deepboroData?: string
  ImageId: number
  userId?: number
  galleryId?: number
  botId?: number
  MediaType: MediaType
}
