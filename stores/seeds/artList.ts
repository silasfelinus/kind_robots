// /stores/seeds/artList.ts

export type ArtListPresetType = 'dropdown' | 'radio' | 'all' | 'auto'

export interface ArtListEntry {
  id: string
  title: string
  content: string[]
  presetType: ArtListPresetType
  allowMultiple: boolean
}

// ✅ Import modular lists
import { themeList } from './themeList'
import { styleList } from './styleList'
import { colorPaletteList as colorList } from './colorList'
import { prettifierList } from './prettifierList'
import { negativeList } from './negativeList'

// ✅ Re-export raw lists
export { prettifierList, negativeList, styleList, themeList, colorList }

// ✅ Define all structured art list presets
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
  {
    id: '__pretty__',
    title: '✨ Make Pretty Enhancements',
    presetType: 'auto',
    allowMultiple: true,
    content: prettifierList,
  },
  {
    id: '__negative__',
    title: '🚫 Negative Prompt Filters',
    presetType: 'auto',
    allowMultiple: true,
    content: negativeList,
  },
]
