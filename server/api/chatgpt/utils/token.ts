// /server/api/chatgpt/_utils/token.ts
export function parseBearer(authorizationHeader?: string | null) {
  if (!authorizationHeader) return ''

  const match = authorizationHeader.match(/^\s*Bearer\s+(.+)$/i)

  return match?.[1]?.trim() || ''
}

export function validateApiKey(
  xApiKeyHeader?: string | null,
  userApiKey?: string | null,
) {
  if (!xApiKeyHeader || !userApiKey) return false

  return xApiKeyHeader.trim() === userApiKey.trim()
}

export function firstToken(...values: Array<string | undefined | null>) {
  for (const value of values) {
    const parsed = parseBearer(value)

    if (parsed) return parsed

    const raw = value?.trim()

    if (raw) return raw
  }

  return ''
}
