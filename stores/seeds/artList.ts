// /stores/seeds/artList.ts

export type ArtListPresetType = 'dropdown' | 'radio' | 'all' | 'auto'

export interface ArtListEntry {
  id: string
  title: string
  content: string[]
  presetType: ArtListPresetType
  allowMultiple: boolean
}

export const artListPresets: ArtListEntry[] = [
  {
    id: 'style',
    title: 'Art Style',
    content: ['Impressionist', 'Cyberpunk', 'Watercolor', 'Line Art'],
    presetType: 'dropdown',
    allowMultiple: false,
  },
  {
    id: 'theme',
    title: 'Theme',
    content: ['Dreams', 'Nightmares', 'Techno-utopia', 'Nature Reclaimed'],
    presetType: 'radio',
    allowMultiple: false,
  },
  {
    id: 'palette',
    title: 'Color Palette',
    content: ['Monochrome', 'Rainbow', 'Neon', 'Pastel'],
    presetType: 'dropdown',
    allowMultiple: true,
  },
]
