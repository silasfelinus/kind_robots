// path: server/api/chatgpt/token.ts
// summary: tiny token helpers used across routes

export function parseBearer(authorizationHeader: string) {
  // accepts variants like "Bearer abc123" or "bearer abc123"
  const m = authorizationHeader?.match(/^\s*Bearer\s+(.+)$/i)
  return m ? m[1].trim() : ''
}

/**
 * Compare x-api-key header to the user's stored apiKey.
 * Returns true when they match exactly. Safe to reuse across routes
 * to conditionally include sensitive fields.
 */
export function validateApiKey(
  xApiKeyHeader: string,
  userApiKey?: string | null,
) {
  if (!xApiKeyHeader || !userApiKey) return false
  return xApiKeyHeader.trim() === userApiKey.trim()
}
