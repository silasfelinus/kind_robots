// /utils/musicVideoBrief.ts
//
// music-video/t-031: fill the settings a pitch leaves open. Silas, 2026-10-06:
// "a perfect setup would take a pitch, length, style suggestions, etc, and
// then an llm could fill in those elements". The LLM proposes genre, mood,
// BPM, vocal and a style bible; whatever the person already set is kept, so
// the brief only ever fills blanks.
import {
  MUSIC_VIDEO_LIMITS,
  MUSIC_VIDEO_VOCALS,
  type MusicVideoSettings,
  type MusicVideoVocal,
} from './musicVideoDoc'

export type MusicVideoBriefFields = {
  genre?: string
  mood?: string
  bpm?: number
  vocal?: MusicVideoVocal
  styleBible?: string
}

/** True when the brief still has something to fill. */
export function briefHasGaps(settings: MusicVideoSettings): boolean {
  return (
    !settings.genre ||
    !settings.mood ||
    !settings.bpm ||
    !settings.vocal ||
    settings.styleBible.trim().length < STYLE_SUGGESTION_MAX
  )
}

export function buildBriefPrompt(input: {
  pitch: string
  settings: MusicVideoSettings
}): { system: string; prompt: string } {
  const { pitch, settings } = input
  const known = [
    `Length: ${settings.durationSec} seconds`,
    `Aspect: ${settings.aspect}`,
    settings.genre ? `Genre: ${settings.genre}` : '',
    settings.mood ? `Mood: ${settings.mood}` : '',
    settings.bpm ? `BPM: ${settings.bpm}` : '',
    settings.vocal ? `Vocal: ${settings.vocal}` : '',
    settings.styleBible.trim()
      ? `Style notes from the director: ${settings.styleBible.trim()}`
      : '',
    settings.bannedTerms?.length
      ? `Never use these words: ${settings.bannedTerms.join(', ')}`
      : '',
  ].filter(Boolean)

  const system = [
    'You are the music director and art director for a short music video.',
    'From the pitch, propose the settings that are still open.',
    'Reply with one JSON object and nothing else, with these keys:',
    '"genre" (a few words), "mood" (a few words),',
    `"bpm" (an integer from ${MUSIC_VIDEO_LIMITS.minBpm} to ${MUSIC_VIDEO_LIMITS.maxBpm}),`,
    `"vocal" (one of ${MUSIC_VIDEO_VOCALS.join(', ')}),`,
    '"styleBible" (2 to 4 sentences describing the one visual look every frame shares:',
    'medium, palette, lighting, linework, camera habits; no story, no character names).',
    'Respect every setting the director already chose and build on their style notes.',
  ].join(' ')

  const prompt = [`Pitch: ${pitch.trim()}`, ...known].join('\n')
  return { system, prompt }
}

function firstJsonObject(raw: string): unknown {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

function shortText(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const clean = value.replace(/\s+/g, ' ').trim().slice(0, max)
  return clean || undefined
}

/** Read the LLM's reply into fields; anything malformed is simply left out. */
export function parseBriefResponse(raw: string): MusicVideoBriefFields {
  const data = firstJsonObject(raw)
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  const record = data as Record<string, unknown>
  const L = MUSIC_VIDEO_LIMITS
  const fields: MusicVideoBriefFields = {}
  const genre = shortText(record.genre, L.maxShortText)
  const mood = shortText(record.mood, L.maxShortText)
  const styleBible = shortText(record.styleBible, L.maxStyleBible)
  const bpm = Math.round(Number(record.bpm))
  const vocal = String(record.vocal ?? '')
    .trim()
    .toLowerCase()
  if (genre) fields.genre = genre
  if (mood) fields.mood = mood
  if (styleBible) fields.styleBible = styleBible
  if (Number.isFinite(bpm) && bpm >= L.minBpm && bpm <= L.maxBpm) {
    fields.bpm = bpm
  }
  if ((MUSIC_VIDEO_VOCALS as readonly string[]).includes(vocal)) {
    fields.vocal = vocal as MusicVideoVocal
  }
  return fields
}

/** Style notes shorter than this are suggestions to expand, not a finished bible. */
export const STYLE_SUGGESTION_MAX = 160

/**
 * Fill only the blanks. A short style note is a suggestion the LLM was told to
 * build on, so its fuller style bible replaces it; a full style bible the
 * director wrote is never touched.
 */
export function mergeBrief(
  settings: MusicVideoSettings,
  fields: MusicVideoBriefFields,
): MusicVideoSettings {
  const next: MusicVideoSettings = { ...settings }
  if (!next.genre && fields.genre) next.genre = fields.genre
  if (!next.mood && fields.mood) next.mood = fields.mood
  if (!next.bpm && fields.bpm) next.bpm = fields.bpm
  if (!next.vocal && fields.vocal) next.vocal = fields.vocal
  if (
    fields.styleBible &&
    next.styleBible.trim().length < STYLE_SUGGESTION_MAX
  ) {
    next.styleBible = fields.styleBible
  }
  return next
}
