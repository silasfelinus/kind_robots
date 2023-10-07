// ~/stores/seeds/seedResources.ts
import { Resource, ResourceType } from '@prisma/client'

// Current ResourceTypes
//    CHECKPOINT
//   EMBEDDING
//   LORA
//   LYCORIS
//    HYPERNETWORK
//   CONTROLNET
//   URL

export const resourceData: Partial<Resource>[] = [
  {
    name: 'Cafe Lola',
    isMature: true,
    MediaPath: '/images/avatars.bot1.jpg',
    localPath: 'https://lola.acrocatranch.com',
    description: 'private access only',
    resourceType: ResourceType.URL
  },
  {
    name: 'Cafe Fred',
    isMature: false,
    MediaPath: '/images/avatars/avatar1.jpg',
    localPath: 'https://lola.acrocatranch.com',
    description: 'private access only',
    resourceType: ResourceType.URL
  }
]
