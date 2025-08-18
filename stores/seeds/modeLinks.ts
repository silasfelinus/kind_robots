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
    addRoute: '/addscenario',
    galleryRoute: '/scenarios',
  },
  {
    name: 'resonance',
    icon: 'kind-icon:resonance',
    label: 'Resonance',
    addRoute: '/addresonance',
    galleryRoute: '/resonances',
  },
  {
    name: 'character',
    icon: 'kind-icon:character',
    label: 'Characters',
    addRoute: '/addcharacter',
    galleryRoute: '/characters',
  },
  {
    name: 'reward',
    icon: 'kind-icon:reward',
    label: 'Rewards',
    addRoute: '/addreward',
    galleryRoute: '/rewards',
  },
  {
    name: 'chat',
    icon: 'kind-icon:chat',
    label: 'Chats',
    addRoute: '/addchat',
    galleryRoute: '/chats',
  },
  {
    name: 'bot',
    icon: 'kind-icon:bot',
    label: 'Bots',
    addRoute: '/addbot',
    galleryRoute: '/bots',
  },
  {
    name: 'pitch',
    icon: 'kind-icon:pitch',
    label: 'Pitches',
    addRoute: '/addpitch',
    galleryRoute: '/pitches',
  },
  {
    name: 'art',
    icon: 'kind-icon:art',
    label: 'Art',
    addRoute: '/addart',
    galleryRoute: '/artgallery',
  },
  {
    name: 'dominion',
    icon: 'kind-icon:dominion',
    label: 'Dominion',
    addRoute: '/adddominion',
    galleryRoute: '/dominions',
  },
]
