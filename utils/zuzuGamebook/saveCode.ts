/*
 * Portable saves (t-008): a journey as a code a player can copy to another browser or device and paste back in.
 * No server is involved. A code is the saved run as JSON, base64url-encoded behind a version prefix; reading one
 * back goes through the same check as a browser save, plus the engine's own bounds, so a mistyped or hand-edited
 * code is refused instead of loading a broken journey.
 */
import { isSavedRun } from './adventure'
import type { Attribute, Run } from './types'

export const SAVE_CODE_PREFIX = 'ZUZU1.'
/** Generous for the longest journey; a paste far past this is something else. */
const MAX_CODE_LENGTH = 60000
const ATTRIBUTES: Attribute[] = ['steel', 'sense', 'shadow', 'mercy']

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(code: string): string {
  const base64 = code.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  return new TextDecoder('utf-8', { fatal: true }).decode(
    Uint8Array.from(binary, (char) => char.charCodeAt(0)),
  )
}

export function encodeSaveCode(run: Run): string {
  return SAVE_CODE_PREFIX + toBase64Url(JSON.stringify(run))
}

/** The journey a code holds, or null when it is not a code this book can safely load. */
export function decodeSaveCode(input: string): Run | null {
  const code = input.replace(/\s+/g, '')
  if (!code.startsWith(SAVE_CODE_PREFIX) || code.length > MAX_CODE_LENGTH)
    return null
  const body = code.slice(SAVE_CODE_PREFIX.length)
  if (!/^[A-Za-z0-9_-]+$/.test(body)) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(fromBase64Url(body))
  } catch {
    return null
  }
  if (!isSavedRun(parsed)) return null
  const run: Run = parsed
  // The engine keeps attributes within -2..4 and a journey starts somewhere.
  if (
    !run.visited.length ||
    !ATTRIBUTES.every(
      (key) =>
        Number.isInteger(run.attributes[key]) &&
        run.attributes[key] >= -2 &&
        run.attributes[key] <= 4,
    )
  )
    return null
  return { ...run, pendingLoot: run.pendingLoot ?? [] }
}
