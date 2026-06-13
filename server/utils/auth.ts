// /server/utils/auth.ts
//
// Small wrapper that resolves the current user's id from an H3 event, so route
// handlers can do `const userId = await getCurrentUserId(event)` without
// repeating header parsing. Built on the existing helpers in
// /server/api/auth/index.ts.
//
// Accepts either form of bearer token used across the app's Cypress tests and
// clients:
//   - a JWT (verified via verifyJwtToken)
//   - a raw user apiKey (looked up via getUserIdFromToken)
//
// Returns null when no valid credential is present, so handlers decide the
// status code (401 vs 403) themselves.

import type { H3Event } from 'h3'
import { verifyJwtToken, getUserIdFromToken } from '../api/auth'

export async function getCurrentUserId(event: H3Event): Promise<number | null> {
  const header = getRequestHeader(event, 'authorization')

  if (!header || !header.startsWith('Bearer ')) {
    // Fall back to x-api-key, which some routes/tests send instead.
    const apiKey = getRequestHeader(event, 'x-api-key')
    if (!apiKey) return null
    try {
      return await getUserIdFromToken(apiKey)
    } catch {
      return null
    }
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) return null

  // Try JWT first.
  const jwt = await verifyJwtToken(token)
  if (jwt.success && jwt.userId) {
    return jwt.userId
  }

  // Not a valid JWT — try treating it as a raw apiKey.
  try {
    return await getUserIdFromToken(token)
  } catch {
    return null
  }
}
