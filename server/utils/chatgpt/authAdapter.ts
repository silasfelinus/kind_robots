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
  // add any fields your validator returns if you want to surface them
}

type RegisterResult = {
  ok: boolean
  userId: number
  token: string
  // add any fields your register route returns if you want to surface them
}

const API_BASE = process.env.PUBLIC_BASE_URL || ''

async function tryValidateToken(token: string): Promise<ValidateResult | null> {
  const headers = { Authorization: `Bearer ${token}` }

  // a) POST /api/auth/validate/api
  try {
    const res = await $fetch<ValidateResult>(`${API_BASE}/api/auth/validate/api`, {
      method: 'POST',
      headers,
      body: {} // adjust if your route expects anything in body
    })
    if (res?.ok) return res
  } catch {}

  // b) POST /api/auth/validate/token
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
  registerIfMissing?: boolean
  registerPayload?: Record<string, unknown>
}): Promise<ChatGPTSessionInfo> {
  // 1) token present → validate
  if (opts.token) {
    const validated = await tryValidateToken(opts.token)
    if (validated?.ok && validated.userId) {
      return {
        userId: validated.userId,
        token: opts.token,
        includeSensitive: !!validated.includeSensitive
      }
    }
  }

  // 2) no valid token → optionally auto-register
  if (opts.registerIfMissing) {
    const payload = opts.registerPayload ?? {
      username: `chatgpt_${Date.now()}`
      // add any required fields your register route needs
    }

    const created = await $fetch<RegisterResult>(`${API_BASE}/api/users/register`, {
      method: 'POST',
      body: payload
    })

    if (!created?.ok) throw new Error('Registration failed')

    // validate the new token for consistency
    const validated = await tryValidateToken(created.token)

    return {
      userId: created.userId,
      token: created.token,
      includeSensitive: !!validated?.includeSensitive
    }
  }

  throw new Error('No valid token and auto-register disabled')
}