// /server/utils/auth.ts
import { type H3Event } from 'h3'
import { getOptionalApiUser } from './authGuard'

// Resolve the acting user for endpoints that only need the caller's id.
// Delegates to the canonical auth resolver so these routes accept the same
// credentials as the rest of the API — a JWT, a user API key, or the
// beta-admin token — instead of JWTs only. (Previously JWT-only, which made
// admin/api-key callers to /api/relations fail with "Not authenticated.")
export async function getCurrentUserId(event: H3Event): Promise<number | null> {
  const auth = await getOptionalApiUser(event)

  return auth?.user.id ?? null
}
