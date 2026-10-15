export const RESTYLE_MAX_BYTES = 128 * 1024 * 1024
export const RESTYLE_MAX_DURATION_SEC = 15 * 60
export const RESTYLE_CHUNK_SECONDS = 4.5
export const RESTYLE_OVERLAP_SECONDS = 0.5

export const RESTYLE_STYLES = [
  { id: 'illustrious', label: 'Illustrious cel', note: 'Faithful anime linework', tone: 'from-cyan-400/40 via-indigo-500/30 to-amber-300/20', prompt: 'Hand-painted Japanese cel animation, clean character silhouettes, expressive ink lines, elegant flowing black trench coat, subtle painterly lighting' },
  { id: 'ink', label: 'Ink & shadow', note: 'Graphic black-box theater', tone: 'from-slate-200/30 via-slate-900 to-red-500/20', prompt: 'Hand-inked experimental animation, high contrast silhouettes, charcoal marks, dramatic stage lighting, monochrome theatrical composition' },
  { id: 'watercolor', label: 'Watercolor', note: 'Fluid storybook washes', tone: 'from-sky-300/50 via-emerald-200/30 to-rose-300/40', prompt: 'Painterly watercolor animation, translucent washes, expressive brushstrokes, handmade paper texture, flowing fabric' },
  { id: 'storybook', label: 'Painted film', note: 'Warm animated feature', tone: 'from-orange-400/40 via-fuchsia-500/30 to-violet-700/50', prompt: 'Hand-painted 2D animated feature film, luminous theatrical palette, detailed clothing folds, textured backgrounds, expressive movement' },
  { id: 'felt', label: 'Felt & thread', note: 'Tactile stop-motion feel', tone: 'from-rose-300/60 via-amber-700/30 to-teal-700/40', prompt: 'Handcrafted felt puppet animation, wool fibers and fabric seams, stop motion miniature theatre, physical light and shadow' },
  { id: 'noir', label: 'Dream noir', note: 'Midnight expressionism', tone: 'from-violet-700/60 via-slate-950 to-yellow-300/20', prompt: 'Expressionist animated noir, moody indigo and amber spotlights, bold ink shadows, evocative surreal stage, graceful black fabric' },
] as const
export type RestyleStyleId = (typeof RESTYLE_STYLES)[number]['id']
export type RestyleQuality = '720p' | '1080p'
export type RestyleStatus = 'STAGED' | 'PROCESSING' | 'REVIEW' | 'DONE' | 'FAILED'

export type RestyleSegment = {
  index: number
  sourceStartSec: number
  sourceEndSec: number
  keepFromSec: number
  keepToSec: number
}

export function isRestyleStyle(value: unknown): value is RestyleStyleId {
  return RESTYLE_STYLES.some((style) => style.id === value)
}

export function planRestyleSegments(
  durationSec: number,
  chunkSec = RESTYLE_CHUNK_SECONDS,
  overlapSec = RESTYLE_OVERLAP_SECONDS,
): RestyleSegment[] {
  if (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > RESTYLE_MAX_DURATION_SEC) {
    throw new Error('Source duration is outside the supported range.')
  }
  if (!(chunkSec > overlapSec && overlapSec >= 0)) {
    throw new Error('Invalid segment overlap.')
  }
  const segments: RestyleSegment[] = []
  const step = chunkSec - overlapSec
  for (let index = 0; index * step < durationSec; index += 1) {
    const sourceStartSec = Number((index * step).toFixed(3))
    const sourceEndSec = Number(Math.min(durationSec, sourceStartSec + chunkSec).toFixed(3))
    const keepFromSec = Number((index === 0 ? sourceStartSec : sourceStartSec + overlapSec / 2).toFixed(3))
    const keepToSec = Number((sourceEndSec >= durationSec ? durationSec : sourceEndSec - overlapSec / 2).toFixed(3))
    segments.push({ index, sourceStartSec, sourceEndSec, keepFromSec, keepToSec })
    if (sourceEndSec >= durationSec) break
  }
  return segments
}

export function formatRestyleTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}
