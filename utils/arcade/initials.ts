// /utils/arcade/initials.ts
//
// Three-initial high-score names, shared by the cabinet and the scores API so
// the browser and the server agree on what is allowed.

export const INITIALS_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// Small on purpose: a family-arcade filter, not a moderation system.
const BLOCKED = new Set([
  'ASS',
  'CUM',
  'COK',
  'DIC',
  'DIK',
  'FAG',
  'FCK',
  'FKU',
  'FUC',
  'FUK',
  'HOE',
  'KKK',
  'KYS',
  'NAZ',
  'NGR',
  'NIG',
  'PIS',
  'SEX',
  'SHT',
  'TIT',
  'TWT',
  'VAG',
  'WTF',
  'XXX',
])

export function normalizeInitials(raw: unknown): string {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3)
}

export function isAllowedInitials(raw: unknown): boolean {
  if (typeof raw !== 'string' || raw.length !== 3) return false
  const initials = normalizeInitials(raw)
  return initials === raw.toUpperCase() && !BLOCKED.has(initials)
}
