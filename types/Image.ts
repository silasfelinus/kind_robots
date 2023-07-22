// ~/types/image.ts
import { Timestamp } from './utils'

export interface Image {
  id: number
  createdAt: Timestamp
  updatedAt: Timestamp
  path: string
  isNSFW: boolean
  isFavorite: boolean
  isFlagged: boolean
  tags: string
  designer?: string
  exifDataId?: number
  userId?: number
  galleryId?: number
  botId?: number
}

export interface ExifData {
  id: number
  createdAt: Timestamp
  updatedAt: Timestamp
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
  clip?: string
  deepboro?: string
  ImageId: number
}
