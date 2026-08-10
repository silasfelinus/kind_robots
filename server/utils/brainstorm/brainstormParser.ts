import type {
  BrainstormGenerateData,
  BrainstormGeneratedCandidate,
} from '../../../types/brainstorm'

const MAX_TITLE_LENGTH = 120
const MAX_TEXT_LENGTH = 4_000

function trimFence(value: string): string {
  const trimmed = value.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced?.[1]?.trim() || trimmed
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function parseEmbeddedJson(value: string): unknown {
  const direct = parseJson(trimFence(value))
  if (direct !== null) return direct

  const objectStart = value.indexOf('{')
  const objectEnd = value.lastIndexOf('}')
  if (objectStart >= 0 && objectEnd > objectStart) {
    const objectValue = parseJson(value.slice(objectStart, objectEnd + 1))
    if (objectValue !== null) return objectValue
  }

  const arrayStart = value.indexOf('[')
  const arrayEnd = value.lastIndexOf(']')
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    const arrayValue = parseJson(value.slice(arrayStart, arrayEnd + 1))
    if (arrayValue !== null) return arrayValue
  }

  return null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function candidateArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value

  const record = asRecord(value)
  if (!record) return null

  for (const key of ['candidates', 'ideas', 'results']) {
    if (Array.isArray(record[key])) return record[key]
  }

  const data = asRecord(record.data)
  if (data) {
    for (const key of ['candidates', 'ideas', 'results']) {
      if (Array.isArray(data[key])) return data[key]
    }
  }

  return null
}

function candidateText(record: Record<string, unknown>): string {
  for (const key of ['text', 'pitch', 'idea', 'content']) {
    if (typeof record[key] === 'string' && record[key].trim()) {
      return record[key].trim().slice(0, MAX_TEXT_LENGTH)
    }
  }
  return ''
}

function candidateTitle(record: Record<string, unknown>): string {
  if (typeof record.title !== 'string') return ''
  return record.title.trim().slice(0, MAX_TITLE_LENGTH)
}

function duplicateKey(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function wordSet(value: string): Set<string> {
  return new Set(
    duplicateKey(value)
      .split(' ')
      .filter((word) => word.length > 2),
  )
}

function nearDuplicate(a: string, b: string): boolean {
  const aKey = duplicateKey(a)
  const bKey = duplicateKey(b)
  if (!aKey || !bKey) return false
  if (aKey === bKey) return true

  const aWords = wordSet(a)
  const bWords = wordSet(b)
  if (aWords.size < 5 || bWords.size < 5) return false

  let intersection = 0
  for (const word of aWords) {
    if (bWords.has(word)) intersection += 1
  }

  const union = new Set([...aWords, ...bWords]).size
  return union > 0 && intersection / union >= 0.88
}

export function normalizeBrainstormCandidates(
  value: unknown,
  expectedCount: number,
): BrainstormGeneratedCandidate[] | null {
  const rawCandidates = candidateArray(value)
  if (!rawCandidates || rawCandidates.length !== expectedCount) return null

  const candidates: BrainstormGeneratedCandidate[] = []

  for (const rawCandidate of rawCandidates) {
    const record = asRecord(rawCandidate)
    if (!record) return null

    const text = candidateText(record)
    if (!text) return null

    if (candidates.some((candidate) => nearDuplicate(candidate.text, text))) {
      return null
    }

    const title = candidateTitle(record)
    candidates.push({
      text,
      ...(title ? { title } : {}),
    })
  }

  return candidates
}

export function parseBrainstormProviderOutput(
  raw: string,
  expectedCount: number,
): BrainstormGenerateData | null {
  if (!raw.trim()) return null

  const parsed = parseEmbeddedJson(raw)
  if (parsed === null) return null

  const candidates = normalizeBrainstormCandidates(parsed, expectedCount)
  return candidates ? { candidates } : null
}
