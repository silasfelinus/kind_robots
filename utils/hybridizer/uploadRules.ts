// Pure validation rules for player-uploaded Hybridizer ingredients (t-008).
// Kept free of Prisma/h3 so the contract tests can exercise them directly.

export const HYBRIDIZER_UPLOAD_MAX_BYTES = 5 * 1024 * 1024
export const HYBRIDIZER_UPLOAD_MIN_SIDE = 128
export const HYBRIDIZER_UPLOAD_MAX_SIDE = 6000
export const HYBRIDIZER_UPLOAD_OUTPUT_SIDE = 1024
export const HYBRIDIZER_UPLOAD_DAILY_LIMIT = 10
export const HYBRIDIZER_UPLOAD_ACTIVE_LIMIT = 30
export const HYBRIDIZER_UPLOAD_TITLE_MAX = 40
export const HYBRIDIZER_UPLOAD_DESCRIPTION_MAX = 160
export const HYBRIDIZER_UPLOAD_KEY_PATTERN = /^upload:([a-f0-9]{24})$/

export const HYBRIDIZER_UPLOAD_CONSENT =
  'I made this image or have the right to use it. It shows no real person ' +
  'who has not agreed, no private information and nothing explicit. I ' +
  'understand it stays private to my account and is never shared.'

export type HybridizerUploadKind = 'creature' | 'object'

export function uploadIdForIdentity(key: string): string | null {
  return HYBRIDIZER_UPLOAD_KEY_PATTERN.exec(key)?.[1] ?? null
}

// Sniff the real container from its magic bytes; the client-supplied MIME
// type and filename are never trusted.
export function sniffUploadImageType(
  data: Uint8Array,
): 'png' | 'jpeg' | 'webp' | null {
  if (
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a
  )
    return 'png'
  if (
    data.length >= 3 &&
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[2] === 0xff
  )
    return 'jpeg'
  if (
    data.length >= 12 &&
    String.fromCharCode(...data.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...data.slice(8, 12)) === 'WEBP'
  )
    return 'webp'
  return null
}

function cleanLine(value: unknown): string {
  return typeof value === 'string'
    ? value
        .normalize('NFKC')
        // Control and bidi-override characters never belong in a label or a
        // render prompt.
        .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : ''
}

const LINK_PATTERN = /(https?:|www\.|[a-z0-9-]+\.(com|net|org|io|ly|gg)\b)/i
// Letters (any script), digits, spaces and light punctuation only, so the
// text reads as a name or description and cannot smuggle prompt syntax.
const SAFE_TEXT = /^[\p{L}\p{N} '’,.!?&()-]+$/u

export type UploadTextResult =
  | {
      ok: true
      title: string
      description: string
      kind: HybridizerUploadKind
    }
  | { ok: false; message: string }

export function validateUploadText(input: {
  title: unknown
  description?: unknown
  kind?: unknown
}): UploadTextResult {
  const title = cleanLine(input.title)
  const description = cleanLine(input.description ?? '')
  const kind = input.kind ?? 'creature'
  if (title.length < 2 || title.length > HYBRIDIZER_UPLOAD_TITLE_MAX)
    return {
      ok: false,
      message: `Name your ingredient in 2–${HYBRIDIZER_UPLOAD_TITLE_MAX} characters.`,
    }
  if (description.length > HYBRIDIZER_UPLOAD_DESCRIPTION_MAX)
    return {
      ok: false,
      message: `Keep the description under ${HYBRIDIZER_UPLOAD_DESCRIPTION_MAX} characters.`,
    }
  for (const text of [title, description])
    if (text && (LINK_PATTERN.test(text) || !SAFE_TEXT.test(text)))
      return {
        ok: false,
        message:
          'Use plain words for the name and description: letters, numbers and simple punctuation, no links.',
      }
  if (kind !== 'creature' && kind !== 'object')
    return { ok: false, message: 'Choose creature or object.' }
  return { ok: true, title, description, kind }
}

export function validateUploadDimensions(
  width: number | undefined,
  height: number | undefined,
): string | null {
  if (!width || !height) return 'That file is not a readable image.'
  if (
    Math.min(width, height) < HYBRIDIZER_UPLOAD_MIN_SIDE ||
    Math.max(width, height) > HYBRIDIZER_UPLOAD_MAX_SIDE
  )
    return `Images must be ${HYBRIDIZER_UPLOAD_MIN_SIDE}–${HYBRIDIZER_UPLOAD_MAX_SIDE} pixels on each side.`
  return null
}

// What the art prompt sees for an upload: its name plus the player's short
// description, never the image itself.
export function uploadPromptLabel(title: string, description: string): string {
  return description ? `${title} (${description})` : title
}
