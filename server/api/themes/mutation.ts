// /server/api/themes/mutation.ts
import { createError } from 'h3'
import { stringifyValues } from './index'

// Themes have no writable relations (only a read-only Reactions[] back-relation),
// so this boundary bounds scalar input and the serialized `values` blob rather than
// relation-ID arrays. `values` maps to a LongText column with no database-side cap.
export const THEME_VALUES_LIMIT = 50_000
export const THEME_BATCH_LIMIT = 100

// Fields the Theme mutation routes actually persist.
const persistedMutationFields = [
  'name',
  'values',
  'isPublic',
  'tagline',
  'room',
  'prefersDark',
  'colorScheme',
  'artPrompt',
] as const

// The current Theme store still sends a matching userId. It is validated and
// ignored (ownership is authentication-derived) until the client stops sending it.
const compatibilityFields = ['userId'] as const

export const themeCreateFields = new Set<string>([
  ...persistedMutationFields,
  ...compatibilityFields,
])

export const themePatchFields = new Set<string>([
  ...persistedMutationFields,
  ...compatibilityFields,
  'id',
])

// Batch imports stay strict: no identity/compatibility fields.
export const themeBatchCreateFields = new Set<string>(persistedMutationFields)

export type ThemeMutationBody = Record<string, unknown> & {
  id?: number
  userId?: number
  name?: string
  values?: unknown
  isPublic?: boolean
  tagline?: string | null
  room?: string | null
  prefersDark?: boolean
  colorScheme?: string
  artPrompt?: string | null
}

type ThemeMutationBoundaryOptions = {
  allowedFields: ReadonlySet<string>
  context: string
  authenticatedUserId?: number
  routeId?: number
  requireNonEmpty?: boolean
}

const optionalTextFields = ['tagline', 'room', 'artPrompt'] as const
const booleanFields = ['isPublic', 'prefersDark'] as const

function positiveInteger(value: unknown, field: string): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({
      statusCode: 400,
      message: `Theme field "${field}" must be a positive integer.`,
    })
  }

  return parsed
}

function assertOptionalText(body: ThemeMutationBody, field: string): void {
  const value = body[field]
  if (value === undefined || value === null) return

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `Theme field "${field}" must be a string or null.`,
    })
  }
}

// Validates the `values` blob shape (when present) and bounds its serialized size.
// Required-ness on create stays in normalizeThemeInput; this only rejects a present
// but malformed or oversized value.
export function assertThemeValuesWithinLimit(body: ThemeMutationBody): void {
  if (!('values' in body) || body.values === undefined || body.values === null) {
    return
  }

  const serialized = stringifyValues(body.values)

  if (!serialized) {
    throw createError({
      statusCode: 400,
      message: '"values" must be a valid object or JSON string.',
    })
  }

  if (serialized.length > THEME_VALUES_LIMIT) {
    throw createError({
      statusCode: 400,
      message: `Theme "values" may not exceed ${THEME_VALUES_LIMIT} serialized characters.`,
    })
  }
}

export function assertThemeMutationInput(
  body: unknown,
  options: ThemeMutationBoundaryOptions,
): asserts body is ThemeMutationBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: `${options.context} must be a JSON object.`,
    })
  }

  const input = body as ThemeMutationBody
  const fields = Object.keys(input)

  if (options.requireNonEmpty && fields.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No data provided for update.',
    })
  }

  const unsupported = fields.filter(
    (field) => !options.allowedFields.has(field),
  )

  if (unsupported.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Theme fields in ${options.context}: ${unsupported.join(', ')}. IDs, timestamps, identity, and system fields are server-owned.`,
    })
  }

  if (Object.prototype.hasOwnProperty.call(input, 'userId')) {
    if (!options.authenticatedUserId) {
      throw createError({
        statusCode: 400,
        message: 'Theme ownership is server-owned.',
      })
    }

    const requestedUserId = positiveInteger(input.userId, 'userId')
    if (requestedUserId !== options.authenticatedUserId) {
      throw createError({
        statusCode: 400,
        message: 'Unsupported Theme ownership assignment. Ownership is server-owned.',
      })
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'id')) {
    const requestedId = positiveInteger(input.id, 'id')
    if (!options.routeId || requestedId !== options.routeId) {
      throw createError({
        statusCode: 400,
        message: 'Theme ID is immutable and must match the route.',
      })
    }
  }

  if (input.name !== undefined && typeof input.name !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Theme field "name" must be a string.',
    })
  }

  for (const field of optionalTextFields) assertOptionalText(input, field)

  for (const field of booleanFields) {
    if (input[field] !== undefined && typeof input[field] !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: `Theme field "${field}" must be a boolean.`,
      })
    }
  }

  if (
    input.colorScheme !== undefined &&
    input.colorScheme !== 'light' &&
    input.colorScheme !== 'dark'
  ) {
    throw createError({
      statusCode: 400,
      message: '"colorScheme" must be either "light" or "dark".',
    })
  }

  assertThemeValuesWithinLimit(input)
}
