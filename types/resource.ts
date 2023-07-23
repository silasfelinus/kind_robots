// ~/types/resource.ts
import { Timestamp, ResourceType } from './utils'
import { User } from './user'

export interface Resource {
  id: number
  createdAt: Timestamp
  updatedAt: Timestamp
  user: User
  userId: number
  name: string
  isNSFW: boolean
  customLabel: string
  imagePath: string
  customUrl: string
  civitaiUrl: string
  huggingUrl: string
  localPath: string
  description: string
  resourceType: ResourceType
}
