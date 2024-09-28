// ~/stores/seeds/seedResources.ts
import type { Resource } from '@prisma/client'

export enum ResourceTypeEnum {
CHECPOINT= 'CHECKPOINT',
EMBEDDING = 'EMBEDDING',
LORA = 'LORA',
LYCORIS = 'LYCORIS',
HYPERNETWORK = 'HYPERNETWORK',
CONTROLNET = 'CONTROLNET',
URL = 'URL'
}
export const resourceData: Partial<Resource>[] = [
  {
    name: 'Cafe Lola',
    isMature: true,
    MediaPath: '/images/avatars.bot1.jpg',
    localPath: 'https://lola.acrocatranch.com',
    description: 'private access only',
    resourceType: ResourceTypeEnum.URL,
  },
  {
    name: 'Cafe Fred',
    isMature: false,
    MediaPath: '/images/avatars/avatar1.jpg',
    localPath: 'https://lola.acrocatranch.com',
    description: 'private access only',
    resourceType: ResourceTypeEnum.URL,
  },
]
