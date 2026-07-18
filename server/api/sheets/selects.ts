// /server/api/sheets/selects.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

export const pitchSheetMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  dreamId: true,
  projectId: true,
  layoutKey: true,
  title: true,
  subtitle: true,
  hook: true,
  pitch: true,
  highlight1Label: true,
  highlight1Value: true,
  highlight1Icon: true,
  highlight2Label: true,
  highlight2Value: true,
  highlight2Icon: true,
  highlight3Label: true,
  highlight3Value: true,
  highlight3Icon: true,
  detail1Label: true,
  detail1Body: true,
  detail2Label: true,
  detail2Body: true,
  detail3Label: true,
  detail3Body: true,
  imagePath: true,
  artImageId: true,
  icon: true,
  colorTheme: true,
  extraData: true,
  userId: true,
  isPublic: true,
  isActive: true,
  isMature: true,
  designer: true,
} satisfies Prisma.PitchSheetSelect

export type PitchSheetMutationResult = Prisma.PitchSheetGetPayload<{
  select: typeof pitchSheetMutationSelect
}>
