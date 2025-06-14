// /stores/seeds/artList.ts

export type ArtListPresetType = 'dropdown' | 'radio' | 'all' | 'auto'

export interface ArtListEntry {
  id: string
  title: string
  content: string[]
  presetType: ArtListPresetType
  allowMultiple: boolean
}

export const negativePhrases = [
  'blurry',
  'deformed',
  'low resolution',
  'extra limbs',
  'bad anatomy',
  'poor lighting',
  'mutated hands',
  'ugly',
  'grainy',
  'distorted',
]

export const prettifierPhrases = [
  'masterpiece',
  'hyper-realistic',
  'maximum detail',
  'cinematic lighting',
  '4k render',
  'sharp focus',
  'ultra textured',
  'rich color grading',
  'award-winning',
  'digital painting',
]

export const artListPresets: ArtListEntry[] = [
  {
    id: 'style',
    title: 'Art Style',
    presetType: 'dropdown',
    allowMultiple: false,
    content: [
      'Impressionist',
      'Cyberpunk',
      'Watercolor',
      'Line Art',
      'Surrealist',
      'Pixel Art',
      'Paper Collage',
      'Oil Painting',
      'Charcoal Sketch',
      'Ink Wash',
      'Mixed Media',
      'Graffiti',
      'Pop Art',
      'Low Poly',
      '3D Render',
      'Manga',
      'Etching',
      'Digital Matte Painting',
      'Woodblock Print',
      'Glitch Art',
      'Hyper-realistic',
    ],
  },
  {
    id: 'theme',
    title: 'Theme',
    presetType: 'radio',
    allowMultiple: false,
    content: [
      'Dreams',
      'Nightmares',
      'Techno-utopia',
      'Nature Reclaimed',
      'Mythic Futures',
      'Post-Human Ritual',
      'Lost Civilizations',
      'Digital Ghosts',
      'Fungal Kingdoms',
      'Bioluminescent Depths',
      'Desert Monasteries',
      'Floating Cities',
      'Neo-Arcadia',
      'Quantum Gardens',
      'Forgotten Gods',
      'Alien Carnival',
      'Broken Time',
      'Sacred Geometry',
      'Eternal Sunset',
      'Synthetic Eden',
    ],
  },
  {
    id: 'palette',
    title: 'Color Palette',
    presetType: 'dropdown',
    allowMultiple: true,
    content: [
      'Monochrome',
      'Rainbow',
      'Neon',
      'Pastel',
      'Muted Earthtones',
      'Vaporwave',
      'Fire & Ash',
      'Ocean Mist',
      'Candycore',
      'Iridescent Glow',
      'Retro Futura',
      'Ice & Steel',
      'Sunset Sorbet',
      'Toxic Green & Magenta',
      'Cosmic Blues',
      'Sepia & Gold',
      'Cyanotype',
      'Aurora Spectrum',
      'Blood & Ivory',
      'Midnight Jewel',
    ],
  },
]
