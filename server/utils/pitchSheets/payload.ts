// /server/utils/pitchSheets/payload.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

const allowedKeys = [
  'layoutKey',
  'title',
  'subtitle',
  'hook',
  'pitch',
  'highlight1Label',
  'highlight1Value',
  'highlight1Icon',
  'highlight2Label',
  'highlight2Value',
  'highlight2Icon',
  'highlight3Label',
  'highlight3Value',
  'highlight3Icon',
  'detail1Label',
  'detail1Body',
  'detail2Label',
  'detail2Body',
  'detail3Label',
  'detail3Body',
  'imagePath',
  'artImageId',
  'icon',
  'colorTheme',
  'extraData',
  'isPublic',
  'isActive',
  'isMature',
  'designer',
] as const

type AllowedKey = (typeof allowedKeys)[number]

export type PitchSheetPayload = Pick<Prisma.PitchSheetUncheckedCreateInput, AllowedKey>

export function sanitizePitchSheetPayload(
  body: Record<string, unknown>,
): Partial<PitchSheetPayload> {
  return allowedKeys.reduce<Partial<PitchSheetPayload>>((clean, key) => {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      ;(clean as Record<string, unknown>)[key] = body[key]
    }
    return clean
  }, {})
}
