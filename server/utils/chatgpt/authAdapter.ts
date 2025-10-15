// path: server/utils/chatgpt/authAdapter.ts
// summary: ChatGPT ↔ your auth system; validate token or auto-register.

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
  message?: string
}

type RegisterResult = {
  ok: boolean
  userId: number
  token: string
  message?: string
}

const API_BASE =
  process.env.PUBLIC_BASE_URL?.replace(/\/+$/, '') ||
  process.env.NUXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
  ''

async function tryValidateTokenOnce(url: string, token: string) {
  return $fetch<ValidateResult>(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {}
  })
}

async function tryValidateToken(token: string): Promise<ValidateResult | null> {
  // Prefer API validator, then token validator
  try {
    const a = await tryValidateTokenOnce('/api/auth/validate/api', token)
    if (a?.ok) return a
  } catch {}
  try {
    const b = await tryValidateTokenOnce('/api/auth/validate/token', token)
    if (b?.ok) return b
  } catch {}
  return null
}

export async function ensureSession(opts: {
  token?: string
  registerIfMissing?: boolean
  registerPayload?: Record<string, unknown>
}): Promise<ChatGPTSessionInfo> {
  // 1) Validate existing token
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

  // 2) Auto-register if allowed
  if (opts.registerIfMissing) {
    const payload = opts.registerPayload ?? {
      username: `chatgpt_${Date.now()}`
      // add more required fields here if your register route needs them
    }
    const created = await $fetch<RegisterResult>(`${API_BASE}/api/users/register`, {
      method: 'POST',
      body: payload
    })
    if (!created?.ok) throw new Error(created?.message || 'Registration failed')

    // Validate the new token (in case your validators enrich flags)
    const validated = await tryValidateToken(created.token)
    return {
      userId: created.userId,
      token: created.token,
      includeSensitive: !!validated?.includeSensitive
    }
  }

  throw new Error('No valid token and auto-register disabled')
}