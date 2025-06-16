// /stores/seeds/artList.ts

export type ArtListPresetType = 'dropdown' | 'radio' | 'all' | 'auto'

export interface ArtListEntry {
  id: string
  title: string
  content: string[]
  presetType: ArtListPresetType
  allowMultiple: boolean
}

// ✅ Import modular content
import { themeList } from './themeList'
import { styleList } from './styleList'
import { colorPaletteList as colorList } from './colorList'
import { prettifierList } from './prettifierList'
import { negativeList } from './negativeList'

// ✅ Optional direct exports if you still want access outside
export const negativePhrases = negativeList
export const prettifierList = prettifierList

// ✅ Main preset list
export const artListPresets: ArtListEntry[] = [
  {
    id: 'style',
    title: 'Art Style',
    presetType: 'dropdown',
    allowMultiple: false,
    content: styleList,
  },
  {
    id: 'theme',
    title: 'Theme',
    presetType: 'radio',
    allowMultiple: false,
    content: themeList,
  },
  {
    id: 'palette',
    title: 'Color Palette',
    presetType: 'dropdown',
    allowMultiple: true,
    content: colorList,
  },
]
