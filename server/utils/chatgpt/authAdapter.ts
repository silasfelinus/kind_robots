// path: server/utils/chatgpt/authAdapter.ts
// summary: ChatGPT ↔ your auth system. Validates token or auto-registers.

import { $fetch } from 'ofetch'

export type ChatGPTSessionInfo = {
  userId: number
  token: string
  includeSensitive: boolean
}

type ValidateResult = {
  ok: boolean
  userId?: number
  includeSensitive?: boolean
  // ...other fields your /auth/validate returns
}

type RegisterResult = {
  ok: boolean
  userId: number
  token: string
  // ...other fields your /users/register returns
}

const API_BASE = process.env.PUBLIC_BASE_URL || '' // e.g. https://kindrobots.org

// Try your validate endpoints in priority order.
async function tryValidateToken(token: string): Promise<ValidateResult | null> {
  const headers = { Authorization: `Bearer ${token}` }

  // a) /server/api/auth/validate/api.post.ts
  try {
    const res = await $fetch<ValidateResult>(`${API_BASE}/api/auth/validate/api`, {
      method: 'POST',
      headers,
      body: {}
    })
    if (res?.ok) return res
  } catch {}

  // b) /server/api/auth/validate/token.ts
  try {
    const res = await $fetch<ValidateResult>(`${API_BASE}/api/auth/validate/token`, {
      method: 'POST',
      headers,
      body: {}
    })
    if (res?.ok) return res
  } catch {}

  return null
}

export async function ensureSession(opts: {
  token?: string
  userIdHint?: number
  registerIfMissing?: boolean
  registerPayload?: Record<string, unknown> // whatever your register route wants
}): Promise<ChatGPTSessionInfo> {

  // 1) If token supplied, validate it
  if (opts.token) {
    const validated = await tryValidateToken(opts.token)
    if (validated?.ok && validated.userId) {
      return {
        userId: validated.userId,
        token: opts.token!,
        includeSensitive: !!validated.includeSensitive
      }
    }
  }

  // 2) Optionally auto-register
  if (opts.registerIfMissing) {
    const payload = opts.registerPayload ?? {
      username: `chatgpt_${Date.now()}`,
      // include minimal required fields that your register endpoint expects
    }
    const created = await $fetch<RegisterResult>(`${API_BASE}/api/users/register`, {
      method: 'POST',
      body: payload
    })
    if (!created?.ok) {
      throw new Error('Registration failed')
    }
    // Immediately validate the new token for consistency
    const validated = await tryValidateToken(created.token)
    return {
      userId: created.userId,
      token: created.token,
      includeSensitive: !!validated?.includeSensitive
    }
  }

  throw new Error('No valid token and auto-register disabled')
}