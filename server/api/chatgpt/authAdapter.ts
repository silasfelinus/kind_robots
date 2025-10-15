// path: server/api/chatgpt/authAdapter.ts
// summary: ChatGPT ↔ your auth system; validate token/apiKey or auto-register

import { $fetch } from 'ofetch'

export type ChatGPTSessionInfo = {
  userId: number
  token: string // may be '' if created via register without login
  includeSensitive: boolean
  source: 'token' | 'apiKey' | 'register'
}

type TokenValidateResponse = {
  success: boolean
  message?: string
  data?: { id?: number } & Record<string, any>
}

type ApiKeyValidateResponse = {
  success: boolean
  message?: string
}

type RegisterResponse = {
  success: boolean
  message?: string
  user?: { id?: number } & Record<string, any>
  statusCode?: number
}

const API_BASE =
  process.env.PUBLIC_BASE_URL?.replace(/\/+$/, '') ||
  process.env.NUXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
  ''

async function validateByToken(token: string): Promise<ChatGPTSessionInfo | null> {
  try {
    const res = await $fetch<TokenValidateResponse>(`${API_BASE}/api/auth/validate/token`, {
      method: 'POST',
      body: { token }
    })
    if (res?.success && res?.data?.id) {
      return {
        userId: Number(res.data.id),
        token,
        includeSensitive: true,
        source: 'token'
      }
    }
  } catch {}
  return null
}

async function validateByApiKey(apiKey: string): Promise<ChatGPTSessionInfo | null> {
  try {
    const res = await $fetch<ApiKeyValidateResponse>(`${API_BASE}/api/auth/validate/api`, {
      method: 'POST',
      body: { apiKey }
    })
    if (res?.success) {
      // until /validate/api returns a user, treat as guest-scoped
      return { userId: 10, token: '', includeSensitive: false, source: 'apiKey' }
    }
  } catch {}
  return null
}

async function registerUser(payload: Record<string, unknown>): Promise<ChatGPTSessionInfo | null> {
  // plural route
  try {
    const a = await $fetch<RegisterResponse>(`${API_BASE}/api/users/register`, {
      method: 'POST',
      body: payload
    })
    if (a?.success && a?.user?.id) {
      return { userId: Number(a.user.id), token: '', includeSensitive: false, source: 'register' }
    }
  } catch {}
  // singular fallback
  try {
    const b = await $fetch<RegisterResponse>(`${API_BASE}/api/user/register`, {
      method: 'POST',
      body: payload
    })
    if (b?.success && b?.user?.id) {
      return { userId: Number(b.user.id), token: '', includeSensitive: false, source: 'register' }
    }
  } catch {}
  return null
}

export async function ensureSession(opts: {
  token?: string
  apiKey?: string
  registerIfMissing?: boolean
  registerPayload?: Record<string, unknown>
}): Promise<ChatGPTSessionInfo> {

  if (opts.token) {
    const tok = await validateByToken(opts.token)
    if (tok) return tok
  }
  if (opts.apiKey) {
    const key = await validateByApiKey(opts.apiKey)
    if (key) return key
  }
  if (opts.registerIfMissing) {
    const payload = opts.registerPayload ?? { username: `chatgpt_${Date.now()}` }
    const reg = await registerUser(payload)
    if (reg) return reg
  }
  throw new Error('No valid token or apiKey, and auto-register disabled')
}