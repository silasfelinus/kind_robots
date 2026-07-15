export function serializeSocialMedia(value: unknown): string {
  if (value === null || value === undefined || value === '') return '[]'

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return '[]'

    try {
      const parsed = JSON.parse(trimmed)
      return JSON.stringify(Array.isArray(parsed) ? parsed : [])
    } catch {
      return JSON.stringify([trimmed])
    }
  }

  return JSON.stringify(Array.isArray(value) ? value : [])
}

export function parseSocialMedia<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (typeof value !== 'string' || !value.trim()) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}
