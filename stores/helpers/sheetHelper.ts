// /stores/helpers/sheetHelper

import type { DreamType } from '~/prisma/generated/prisma/client'

export type PitchSheetDisplayType = Exclude<DreamType, 'BRAINSTORM'>

export type PitchSheetDefaultLabels = {
  highlights: readonly [string, string, string]
  details: readonly [string, string, string]
}

export const pitchSheetDefaults = {
  ART: {
    highlights: ['Visual Hook', 'Best Use', 'Must Include'],
    details: ['Core Image', 'Style Notes', 'Use It For'],
  },
  PROMPTBOT: {
    highlights: ['Primary Skill', 'Best For', 'Output Style'],
    details: ['What It Does', 'Why It Helps', 'How To Ask'],
  },
  NARRATOR: {
    highlights: ['Mission', 'Appears As', 'Best For'],
    details: ['Narrator Role', 'Voice', 'Story Function'],
  },
  CHARACTER: {
    highlights: ['Wants', 'Carries', 'Complication'],
    details: ['Role', 'Drive', 'Story Hooks'],
  },
  REWARD: {
    highlights: ['Grants', 'Best Used When', 'The Catch'],
    details: ['What It Does', 'Best Moment', 'Story Use'],
  },
  SCENARIO: {
    highlights: ['Starts With', 'Pressure', 'Can Create'],
    details: ['Opening Situation', 'Player Goal', 'Possible Outcomes'],
  },
  LOCATION: {
    highlights: ['Known For', 'Local Rule', 'Best Scene'],
    details: ['First Impression', 'What Happens Here', 'Story Hooks'],
  },
  PITCH: {
    highlights: ['Promise', 'Builds Into', 'Status'],
    details: ['Big Idea', 'Why It Works', 'Next Step'],
  },
  GENRE: {
    highlights: ['Feels Like', 'Often Includes', 'Avoids'],
    details: ['Genre Promise', 'Core Ingredients', 'Use This For'],
  },
} as const satisfies Record<PitchSheetDisplayType, PitchSheetDefaultLabels>

export function getPitchSheetDisplayType(
  dreamType?: DreamType | string | null,
): PitchSheetDisplayType {
  switch (dreamType) {
    case 'ART':
    case 'PROMPTBOT':
    case 'NARRATOR':
    case 'CHARACTER':
    case 'REWARD':
    case 'SCENARIO':
    case 'LOCATION':
    case 'PITCH':
    case 'GENRE':
      return dreamType
    case 'BRAINSTORM':
    default:
      return 'PITCH'
  }
}

export function dreamTypeLabel(type?: DreamType | string | null) {
  return String(getPitchSheetDisplayType(type))
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
