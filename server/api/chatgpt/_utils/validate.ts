// /server/api/chatgpt/_utils/validate.ts
import { createError } from 'h3'

export function badRequest(message: string) {
  throw createError({
    statusCode: 400,
    statusMessage: message,
  })
}

export function expectString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    badRequest(`"${field}" must be a non-empty string`)
  }

  return value.trim()
}

export function expectNumber(value: unknown, field: string) {
  const numberValue = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numberValue)) {
    badRequest(`"${field}" must be a number`)
  }

  return numberValue
}

export function expectBoolean(value: unknown, field: string) {
  if (typeof value !== 'boolean') {
    badRequest(`"${field}" must be a boolean`)
  }

  return value
}

export function expectRecord(value: unknown, field: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    badRequest(`"${field}" must be an object`)
  }

  return value as Record<string, unknown>
}

export function optional<T>(validator: (value: unknown, field: string) => T) {
  return (value: unknown, field: string): T | undefined => {
    if (value === undefined || value === null) return undefined

    return validator(value, field)
  }
}

export function validateShape<
  Shape extends Record<string, (value: unknown, field: string) => unknown>,
>(
  value: unknown,
  shape: Shape,
): { [Key in keyof Shape]: ReturnType<Shape[Key]> } {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  const output: Record<string, unknown> = {}

  for (const key in shape) {
    const validator = shape[key]

    if (!validator) continue

    output[key] = validator(source[key], key)
  }

  return output as { [Key in keyof Shape]: ReturnType<Shape[Key]> }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function asNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(numberValue) ? numberValue : fallback
}

export function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}
