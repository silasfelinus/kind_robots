// /server/utils/challengeSubmissionResource.ts
import type { Prisma } from '~/prisma/generated/prisma/client'

export const challengeSubmissionMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  challengeId: true,
  botId: true,
  agentModel: true,
  outputText: true,
  artImageId: true,
  characterId: true,
  scenarioId: true,
  status: true,
  contenderId: true,
  variantKey: true,
  promptUsed: true,
  settings: true,
  randomSelections: true,
} satisfies Prisma.ChallengeSubmissionSelect
