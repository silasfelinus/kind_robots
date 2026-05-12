// /server/api/chatgpt/utils/contracts/modelContracts.ts
import { createError } from 'h3'
import { publicModelSelects, type PublicModelName } from './publicSelects'

export type ModelContract = {
  model: PublicModelName
  publicFields: string[]
  omittedFields: string[]
  friendlyAliases: Record<string, string>
  notes: string[]
}

const omittedFieldsByModel: Partial<Record<PublicModelName, string[]>> = {
  ArtImage: ['imageData'],
  Dream: ['privacyCode'],
  Server: ['apiKey', 'workflowJson'],
}

const friendlyAliasesByModel: Partial<
  Record<PublicModelName, Record<string, string>>
> = {
  Bot: {
    avatar: 'avatarImage',
    image: 'avatarImage',
  },
  Dream: {
    image: 'artImageId || artId',
  },
  Gallery: {
    image: 'highlightImage',
  },
  Pitch: {
    image: 'highlightImage',
  },
  Resource: {
    image: 'MediaPath',
  },
  Reward: {
    image: 'imagePath',
  },
  Scenario: {
    intro: 'intros',
    genre: 'genres',
    image: 'imagePath',
  },
}

const notesByModel: Partial<Record<PublicModelName, string[]>> = {
  ArtImage: [
    'Public ArtImage responses intentionally omit imageData to avoid large payloads.',
    'Use asset.getImage or asset.listRecentImages when imageData is explicitly required.',
  ],
  Bot: [
    'The Prisma Bot model has avatarImage, not avatar. The response mapper may expose avatar as an alias.',
  ],
  Scenario: [
    'The Prisma Scenario model has intros and genres, not intro and genre.',
  ],
  Server: [
    'Public Server responses intentionally omit apiKey and workflowJson.',
  ],
}

export function getPublicModelNames() {
  return Object.keys(publicModelSelects) as PublicModelName[]
}

export function getPublicModelFields(model: PublicModelName) {
  return Object.keys(publicModelSelects[model])
}

export function isPublicModelName(model: string): model is PublicModelName {
  return model in publicModelSelects
}

export function getModelContract(model: string): ModelContract {
  if (!isPublicModelName(model)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unknown model contract: ${model}`,
    })
  }

  return {
    model,
    publicFields: getPublicModelFields(model),
    omittedFields: omittedFieldsByModel[model] ?? [],
    friendlyAliases: friendlyAliasesByModel[model] ?? {},
    notes: notesByModel[model] ?? [],
  }
}

export function listModelContracts() {
  return getPublicModelNames().map((model) => getModelContract(model))
}
