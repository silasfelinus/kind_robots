// /stores/seeds/validSamplers.ts

import type { Resource } from '~/prisma/generated/prisma/client'

export const validSamplers: Partial<Resource>[] = [
  { name: 'Euler a', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  { name: 'Euler', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  { name: 'LMS', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  { name: 'Heun', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  { name: 'DPM2', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  { name: 'DPM2 a', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  { name: 'DPM fast', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  { name: 'DPM adaptive', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  { name: 'LMS Karras', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  { name: 'DPM2 Karras', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  {
    name: 'DPM2 a Karras',
    resourceType: 'SAMPLER',
    isMature: false,
    userId: 1,
  },
  { name: 'Restart', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  { name: 'DDIM', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  { name: 'PLMS', resourceType: 'SAMPLER', isMature: false, userId: 1 },
  { name: 'UniPC', resourceType: 'SAMPLER', isMature: false, userId: 1 },
]
