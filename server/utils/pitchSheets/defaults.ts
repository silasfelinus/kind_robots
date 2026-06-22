// /server/utils/pitchSheets/defaults.ts
import type { Dream, DreamType, Prisma } from '~/prisma/generated/prisma/client'

type PitchDisplayType = Exclude<DreamType, 'BRAINSTORM'>

type LabelSet = {
  highlights: [string, string, string]
  details: [string, string, string]
}

export const pitchSheetDefaults: Record<PitchDisplayType, LabelSet> = {
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
}

function trimTo(value: string | null | undefined, max: number) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

export function getPitchSheetDisplayType(dreamType: DreamType): PitchDisplayType {
  return dreamType === 'BRAINSTORM' ? 'PITCH' : dreamType
}

export function buildPitchSheetFromDream(
  dream: Dream,
  userId: number,
  overrides: Partial<Prisma.PitchSheetUncheckedCreateInput> = {},
): Prisma.PitchSheetUncheckedCreateInput {
  const displayType = getPitchSheetDisplayType(dream.dreamType)
  const defaults = pitchSheetDefaults[displayType]

  return {
    dreamId: dream.id,
    userId,
    layoutKey: overrides.layoutKey ?? 'pitch-card',
    title: overrides.title ?? dream.title,
    subtitle:
      overrides.subtitle ??
      trimTo(dream.flavorText, 512) ??
      trimTo(dream.description, 512),
    hook: overrides.hook ?? trimTo(dream.flavorText, 512),
    pitch: overrides.pitch ?? dream.pitch ?? dream.description,
    highlight1Label: overrides.highlight1Label ?? defaults.highlights[0],
    highlight1Value: overrides.highlight1Value,
    highlight1Icon: overrides.highlight1Icon,
    highlight2Label: overrides.highlight2Label ?? defaults.highlights[1],
    highlight2Value: overrides.highlight2Value,
    highlight2Icon: overrides.highlight2Icon,
    highlight3Label: overrides.highlight3Label ?? defaults.highlights[2],
    highlight3Value: overrides.highlight3Value,
    highlight3Icon: overrides.highlight3Icon,
    detail1Label: overrides.detail1Label ?? defaults.details[0],
    detail1Body: overrides.detail1Body,
    detail2Label: overrides.detail2Label ?? defaults.details[1],
    detail2Body: overrides.detail2Body,
    detail3Label: overrides.detail3Label ?? defaults.details[2],
    detail3Body: overrides.detail3Body,
    imagePath:
      overrides.imagePath ??
      trimTo(dream.highlightImage, 764) ??
      trimTo(dream.imagePath, 764),
    artImageId: overrides.artImageId ?? dream.artImageId,
    icon: overrides.icon ?? trimTo(dream.icon, 255),
    colorTheme: overrides.colorTheme,
    extraData: overrides.extraData,
    isPublic: overrides.isPublic ?? dream.isPublic,
    isActive: overrides.isActive ?? true,
    isMature: overrides.isMature ?? dream.isMature,
    designer: overrides.designer ?? dream.designer ?? 'system',
  }
}
