// /stores/seeds/modeLinks.ts

import type { displayModeState } from '@/stores/displayStore'

export interface ModeInfo {
  name: displayModeState
  icon: string
  label: string
  addRoute: string
  galleryRoute: string
}

export const modes: ModeInfo[] = [
  {
    name: 'scenario',
    icon: 'kind-icon:scenario',
    label: 'Scenarios',
    addRoute: '/stories',
    galleryRoute: '/stories',
  },
  {
    name: 'character',
    icon: 'kind-icon:character',
    label: 'Characters',
    addRoute: '/characters',
    galleryRoute: '/characters',
  },
  {
    name: 'reward',
    icon: 'kind-icon:reward',
    label: 'Rewards',
    addRoute: '/rewards',
    galleryRoute: '/rewards',
  },
  {
    name: 'chat',
    icon: 'kind-icon:chat',
    label: 'Chats',
    addRoute: '/chats',
    galleryRoute: '/chats',
  },
  {
    name: 'bot',
    icon: 'kind-icon:bot',
    label: 'Bots',
    addRoute: '/bots',
    galleryRoute: '/bots',
  },
  {
    name: 'pitch',
    icon: 'kind-icon:pitch',
    label: 'Pitches',
    addRoute: '/brainstorm',
    galleryRoute: '/brainstorm',
  },
  {
    name: 'art',
    icon: 'kind-icon:art',
    label: 'Art',
    addRoute: '/art',
    galleryRoute: '/art',
  },
]
