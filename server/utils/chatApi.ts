import { createError } from 'h3'
import type { ChatType } from '~/prisma/generated/prisma/client'
import prisma from './prisma'

type AuthenticatedChatUser = {
  id: number
  Role?: string | null
}

export type ChatRelationValues = {
  botId?: number | null
  characterId?: number | null
  promptId?: number | null
  artImageId?: number | null
  dreamId?: number | null
  projectId?: number | null
  serverId?: number | null
  recipientId?: number | null
}

export const allowedChatTypes: ChatType[] = [
  'ToBot',
  'BotResponse',
  'ToForum',
  'ToUser',
  'ToCharacter',
  'Weirdlandia',
  'Dream',
  'Reward',
  'Story',
  'Scenario',
  'Character',
  'Bot',
]

export function assertJsonObject(
  value: unknown,
  message = 'A JSON object is required.',
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createError({ statusCode: 400, message })
  }
}

export function assertOnlyFields(
  body: Record<string, unknown>,
  allowedFields: ReadonlySet<string>,
  resourceName = 'Chat',
): void {
  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.has(field),
  )

  if (unknownFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported ${resourceName} fields: ${unknownFields.join(', ')}. Ownership, IDs, and timestamps are server-owned.`,
    })
  }
}

export function requiredString(
  value: unknown,
  fieldName: string,
  maxLength?: number,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} is required and must be a non-empty string.`,
    })
  }

  const text = value.trim()

  if (maxLength && text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be ${maxLength} characters or fewer.`,
    })
  }

  return text
}

export function optionalString(
  value: unknown,
  fieldName: string,
  maxLength?: number,
): string | undefined {
  if (typeof value === 'undefined') return undefined
  return requiredString(value, fieldName, maxLength)
}

export function nullableString(
  value: unknown,
  fieldName: string,
  maxLength?: number,
): string | null | undefined {
  if (typeof value === 'undefined') return undefined
  if (value === null) return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be a string or null.`,
    })
  }

  const text = value.trim()

  if (maxLength && text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be ${maxLength} characters or fewer.`,
    })
  }

  return text || null
}

export function optionalBoolean(
  value: unknown,
  fieldName: string,
): boolean | undefined {
  if (typeof value === 'undefined') return undefined

  if (typeof value !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be a boolean.`,
    })
  }

  return value
}

export function optionalPositiveId(
  value: unknown,
  fieldName: string,
  allowNull = false,
): number | null | undefined {
  if (typeof value === 'undefined') return undefined
  if (value === null && allowNull) return null

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be a positive integer${allowNull ? ' or null' : ''}.`,
    })
  }

  return id
}

export function requiredChatType(value: unknown): ChatType {
  if (
    typeof value !== 'string' ||
    !allowedChatTypes.includes(value as ChatType)
  ) {
    throw createError({
      statusCode: 400,
      message: 'type is required and must be a supported ChatType.',
    })
  }

  return value as ChatType
}

export function optionalChatType(value: unknown): ChatType | undefined {
  if (typeof value === 'undefined') return undefined
  return requiredChatType(value)
}

function unavailableRelation(name: string, id: number): never {
  throw createError({
    statusCode: 404,
    message: `${name} ID not found or unavailable: ${id}.`,
  })
}

export async function assertChatRelationsAccessible(options: {
  values: ChatRelationValues
  user: AuthenticatedChatUser
  canManageAny: boolean
}): Promise<void> {
  const { values, user, canManageAny } = options
  const checks: Promise<void>[] = []

  if (values.recipientId) {
    checks.push(
      prisma.user
        .findUnique({
          where: { id: values.recipientId },
          select: { id: true },
        })
        .then((record) => {
          if (!record) unavailableRelation('Recipient user', values.recipientId!)
        }),
    )
  }

  if (values.botId) {
    checks.push(
      prisma.bot
        .findFirst({
          where: {
            id: values.botId,
            isActive: true,
            ...(canManageAny
              ? {}
              : { OR: [{ isPublic: true }, { userId: user.id }] }),
          },
          select: { id: true },
        })
        .then((record) => {
          if (!record) unavailableRelation('Bot', values.botId!)
        }),
    )
  }

  if (values.characterId) {
    checks.push(
      prisma.character
        .findFirst({
          where: {
            id: values.characterId,
            isActive: true,
            ...(canManageAny
              ? {}
              : { OR: [{ isPublic: true }, { userId: user.id }] }),
          },
          select: { id: true },
        })
        .then((record) => {
          if (!record) unavailableRelation('Character', values.characterId!)
        }),
    )
  }

  if (values.promptId) {
    checks.push(
      prisma.prompt
        .findFirst({
          where: {
            id: values.promptId,
            isActive: true,
            ...(canManageAny
              ? {}
              : { OR: [{ isPublic: true }, { userId: user.id }] }),
          },
          select: { id: true },
        })
        .then((record) => {
          if (!record) unavailableRelation('Prompt', values.promptId!)
        }),
    )
  }

  if (values.artImageId) {
    checks.push(
      prisma.artImage
        .findFirst({
          where: {
            id: values.artImageId,
            isActive: true,
            ...(canManageAny
              ? {}
              : { OR: [{ isPublic: true }, { userId: user.id }] }),
          },
          select: { id: true },
        })
        .then((record) => {
          if (!record) unavailableRelation('ArtImage', values.artImageId!)
        }),
    )
  }

  if (values.dreamId) {
    checks.push(
      prisma.dream
        .findFirst({
          where: {
            id: values.dreamId,
            isActive: true,
            ...(canManageAny
              ? {}
              : { OR: [{ isPublic: true }, { userId: user.id }] }),
          },
          select: { id: true },
        })
        .then((record) => {
          if (!record) unavailableRelation('Dream', values.dreamId!)
        }),
    )
  }

  if (values.serverId) {
    checks.push(
      prisma.server
        .findFirst({
          where: {
            id: values.serverId,
            isActive: true,
            ...(canManageAny
              ? {}
              : { OR: [{ isPublic: true }, { userId: user.id }] }),
          },
          select: { id: true },
        })
        .then((record) => {
          if (!record) unavailableRelation('Server', values.serverId!)
        }),
    )
  }

  if (values.projectId) {
    checks.push(
      prisma.project
        .findFirst({
          where: {
            id: values.projectId,
            isActive: true,
            ...(canManageAny ? {} : { userId: user.id }),
          },
          select: { id: true },
        })
        .then((record) => {
          if (!record) unavailableRelation('Project', values.projectId!)
        }),
    )
  }

  await Promise.all(checks)
}
