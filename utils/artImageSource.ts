// utils/artImageSource.ts
//
// One shared resolver for turning an ArtImage row into a displayable media src,
// with a diagnostic so the UI can say WHY something is blank instead of a bare
// "No image". Ported/unified from image-card.vue's robust logic (the only
// resolver that recovered path-only and malformed rows) and extended with:
//   - video awareness (fileType mp4/webm etc. -> a <video>-playable data/URL,
//     not a data:image/mp4 that an <img> silently drops), and
//   - a `diag` block that reports which fields were present and which one was
//     used, so a blank tile can explain itself.
//
// Same-origin, leading-slash paths (e.g. /images/foo.webp) are returned as-is;
// callers on the app origin can use them directly. No Vue/runtime deps so this
// stays a pure, reusable util.

export type ArtImageLike = {
  imageData?: string | null
  imagePath?: string | null
  path?: string | null
  fileName?: string | null
  fileType?: string | null
}

export type ArtMediaKind = 'image' | 'video' | 'none'

export type ArtImageSourceDiag = {
  hasImageData: boolean
  imageDataShape: 'data-url' | 'base64' | 'path-in-data-field' | 'unusable' | 'empty'
  fileType: string
  imagePath: string
  path: string
  usedField: 'imageData' | 'imagePath' | 'path' | 'fileName' | 'none'
}

export type ArtImageSource = {
  src: string
  kind: ArtMediaKind
  /** Human-readable explanation — always set, most useful when kind === 'none' or 'video'. */
  reason: string
  diag: ArtImageSourceDiag
}

const VIDEO_FILETYPES = new Set(['mp4', 'webm', 'mov', 'ogv', 'ogg', 'm4v'])

function isVideoType(fileType?: string | null, path?: string | null): boolean {
  const ft = (fileType || '').trim().toLowerCase()
  if (ft.startsWith('video/')) return true
  if (VIDEO_FILETYPES.has(ft)) return true
  return /\.(mp4|webm|mov|ogv|m4v)(\?|#|$)/i.test((path || '').trim())
}

function mediaMimeType(fileType: string | null | undefined, kind: 'image' | 'video'): string {
  const cleaned = (fileType || '').trim().toLowerCase()
  if (cleaned.includes('/')) return cleaned
  if (kind === 'video') {
    if (cleaned === 'mov') return 'video/quicktime'
    if (cleaned === 'ogv' || cleaned === 'ogg') return 'video/ogg'
    return `video/${cleaned || 'mp4'}`
  }
  if (cleaned === 'jpg' || cleaned === 'jpeg') return 'image/jpeg'
  if (!cleaned) return 'image/png'
  return `image/${cleaned}`
}

function isProbablyPath(value: string): boolean {
  const t = value.trim()
  return (
    t.startsWith('/') ||
    t.startsWith('./') ||
    t.startsWith('../') ||
    t.startsWith('http://') ||
    t.startsWith('https://') ||
    t.startsWith('images/') ||
    t.startsWith('public/') ||
    t.startsWith('/mnt/data/') ||
    /\.(png|jpe?g|webp|gif|avif|svg|mp4|webm|mov|ogv|m4v)$/i.test(t)
  )
}

function looksLikeBase64(value: string): boolean {
  const compact = value.replace(/\s+/g, '')
  if (compact.length < 64) return false
  if (compact.length % 4 !== 0) return false
  return /^[A-Za-z0-9+/]+={0,2}$/.test(compact)
}

function stripServerFilePrefix(value: string): string {
  return value
    .replace(/^file:\/\//, '')
    .replace(/^\/mnt\/data\/+/, '')
    .replace(/^\/public\/+/, '')
    .replace(/^public\/+/, '')
    .replace(/^\/app\/public\/+/, '')
    .replace(/^app\/public\/+/, '')
}

/** Normalize a stored path to a same-origin URL, or '' if unusable. */
export function normalizeMediaPath(value?: string | null): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'UNDEFINED' || trimmed === 'undefined') return ''
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed
  }
  const clean = stripServerFilePrefix(trimmed)
  if (!clean) return ''
  if (clean.startsWith('/images/')) return clean
  if (clean.startsWith('images/')) return `/${clean}`
  if (clean.startsWith('/')) return clean
  return `/images/${clean}`
}

/**
 * Resolve an ArtImage to { src, kind, reason, diag }. `kind === 'video'` means
 * the caller should render a <video>, not an <img>. `kind === 'none'` means
 * nothing renderable — `reason` says why (missing bytes vs. unusable path etc.).
 */
export function resolveArtImageSource(image?: ArtImageLike | null): ArtImageSource {
  const fileType = (image?.fileType || '').trim()
  const imagePath = (image?.imagePath || '').trim()
  const path = (image?.path || '').trim()
  const fileName = (image?.fileName || '').trim()
  const rawData = (image?.imageData || '').trim()

  const diag: ArtImageSourceDiag = {
    hasImageData: rawData.length > 0,
    imageDataShape: !rawData
      ? 'empty'
      : rawData.startsWith('data:')
        ? 'data-url'
        : isProbablyPath(rawData)
          ? 'path-in-data-field'
          : looksLikeBase64(rawData)
            ? 'base64'
            : 'unusable',
    fileType: fileType || '(none)',
    imagePath: imagePath || '(none)',
    path: path || '(none)',
    usedField: 'none',
  }

  if (!image) {
    return { src: '', kind: 'none', reason: 'no ArtImage record', diag }
  }

  // 1) Inline bytes in imageData.
  if (rawData) {
    if (diag.imageDataShape === 'data-url') {
      const kind: ArtMediaKind = rawData.startsWith('data:video/') ? 'video' : 'image'
      return { src: rawData, kind, reason: 'inline data URL', diag: { ...diag, usedField: 'imageData' } }
    }
    if (diag.imageDataShape === 'base64') {
      const kind: 'image' | 'video' = isVideoType(fileType, imagePath || path) ? 'video' : 'image'
      const src = `data:${mediaMimeType(fileType, kind)};base64,${rawData}`
      const reason = kind === 'video' ? `video result (fileType=${fileType || 'unknown'}) — render as <video>` : 'inline base64'
      return { src, kind, reason, diag: { ...diag, usedField: 'imageData' } }
    }
    // 'path-in-data-field' falls through to path handling using imageData as a candidate.
  }

  // 2) A stored path (imagePath, then path, then imageData-holding-a-path, then fileName).
  const pathCandidateRaw =
    imagePath ||
    path ||
    (diag.imageDataShape === 'path-in-data-field' ? rawData : '') ||
    fileName
  const usedField: ArtImageSourceDiag['usedField'] = imagePath
    ? 'imagePath'
    : path
      ? 'path'
      : diag.imageDataShape === 'path-in-data-field'
        ? 'imageData'
        : fileName
          ? 'fileName'
          : 'none'
  const normalized = normalizeMediaPath(pathCandidateRaw)
  if (normalized) {
    const kind: 'image' | 'video' = isVideoType(fileType, normalized) ? 'video' : 'image'
    const reason = kind === 'video' ? `video path (fileType=${fileType || 'unknown'}) — render as <video>` : `path (${usedField})`
    return { src: normalized, kind, reason, diag: { ...diag, usedField } }
  }

  // 3) Nothing renderable — explain why.
  let reason: string
  if (!rawData && !imagePath && !path) {
    reason = 'no bytes stored: imageData empty and no imagePath/path'
  } else if (rawData && diag.imageDataShape === 'unusable') {
    reason = `imageData present but not valid base64/data-URL (${rawData.length} chars)`
  } else if (pathCandidateRaw) {
    reason = `path present but did not resolve to a URL: "${pathCandidateRaw.slice(0, 120)}"`
  } else {
    reason = 'no usable image source on this record'
  }
  return { src: '', kind: 'none', reason, diag }
}
