import { createError } from 'h3'
import {
  characterCreateFields,
  characterPatchFields,
  type CharacterMutationInput,
} from './mutation'

const characterStoreCompatibilityFields = [
  'id',
  'userId',
  'createdAt',
  'updatedAt',
] as const

export const characterSingularCreateFields = new Set<string>([
  ...characterCreateFields,
  ...characterStoreCompatibilityFields,
])

export const characterSingularPatchFields = new Set<string>([
  ...characterPatchFields,
  ...characterStoreCompatibilityFields,
])

type CharacterCompatibilityInput = CharacterMutationInput & {
  id?: unknown
  userId?: unknown
  createdAt?: unknown
  updatedAt?: unknown
}

function integer(value: unknown, field: string): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed)) {
    throw createError({
      statusCode: 400,
      message: `Character compatibility field "${field}" must be an integer.`,
    })
  }

  return parsed
}

function assertTimestamp(value: unknown, field: string): void {
  if (value === undefined || value === null) return

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `Character compatibility field "${field}" must be a string or null.`,
    })
  }
}

export function assertCharacterCreateCompatibility(
  body: CharacterCompatibilityInput,
): void {
  if (Object.prototype.hasOwnProperty.call(body, 'id')) {
    const id = integer(body.id, 'id')

    if (id > 0) {
      throw createError({
        statusCode: 400,
        message: 'Character create payload cannot assign a persisted ID.',
      })
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'userId')) {
    const userId = integer(body.userId, 'userId')

    if (userId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Character compatibility field "userId" must be positive.',
      })
    }
  }

  assertTimestamp(body.createdAt, 'createdAt')
  assertTimestamp(body.updatedAt, 'updatedAt')
}

export function assertCharacterPatchCompatibility(
  body: CharacterCompatibilityInput,
  routeId: number,
  existingUserId: number,
): void {
  if (Object.prototype.hasOwnProperty.call(body, 'id')) {
    const id = integer(body.id, 'id')

    if (id !== routeId) {
      throw createError({
        statusCode: 400,
        message: 'Character ID is immutable and must match the route.',
      })
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'userId')) {
    const userId = integer(body.userId, 'userId')

    if (userId !== existingUserId) {
      throw createError({
        statusCode: 400,
        message:
          'Unsupported Character ownership reassignment. Ownership is server-owned.',
      })
    }
  }

  assertTimestamp(body.createdAt, 'createdAt')
  assertTimestamp(body.updatedAt, 'updatedAt')
}

export function stripCharacterCompatibilityFields(
  body: CharacterCompatibilityInput,
): CharacterMutationInput {
  const {
    id: _id,
    userId: _userId,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...mutationBody
  } = body

  void _id
  void _userId
  void _createdAt
  void _updatedAt

  return mutationBody
}
