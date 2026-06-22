// /server/utils/pitchSheets/defaults.ts

import type { Dream, Prisma } from '~/prisma/generated/prisma/client'
import {
  getPitchSheetDefaultLabels,
  getPitchSheetDisplayType,
  pitchSheetDefaults,
} from '~/stores/helpers/sheetHelper'

export { getPitchSheetDisplayType, pitchSheetDefaults }

function trimTo(value: string | null | undefined, max: number) {
  if (!value) return undefined

  const trimmed = value.trim()

  if (!trimmed) return undefined

  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

export function buildPitchSheetFromDream(
  dream: Dream,
  userId: number,
  overrides: Partial<Prisma.PitchSheetUncheckedCreateInput> = {},
): Prisma.PitchSheetUncheckedCreateInput {
  const defaults = getPitchSheetDefaultLabels(dream.dreamType)

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
