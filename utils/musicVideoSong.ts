// /utils/musicVideoSong.ts
//
// Song step of the music video creator (music-video/t-010). Pure and DB-free:
// turns a MusicVideoDoc into the ACE-Step enqueue request that
// POST /api/music-video/[id]/song sends to /api/art/enqueue.
//
// The tags string is the job's promptString and must equal the graph's tags
// input verbatim (artJobProvenance). Lyrics travel separately and never touch
// promptString, so the image prompt contract never reads lyric text.
import {
  MUSIC_VIDEO_LIMITS,
  type MusicVideoDoc,
  type MusicVideoVocal,
} from './musicVideoDoc'
import { toAceStepLyrics } from './musicVideoLyrics'

const VOCAL_TAGS: Record<MusicVideoVocal, string> = {
  female: 'female lead vocals',
  male: 'male lead vocals',
  duet: 'male and female duet vocals',
  instrumental: 'instrumental',
}

/** Collapse whitespace and cap at the doc's tag limit. */
export function cleanSongTags(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MUSIC_VIDEO_LIMITS.maxTags)
    .trim()
}

/**
 * Comma-separated style tags from the doc's settings. An explicit override
 * wins; otherwise genre, mood and vocal style, in that order (the ACE-Step
 * template leads with the genre).
 */
export function buildSongTags(
  doc: MusicVideoDoc,
  override?: string | null,
): string {
  const explicit = cleanSongTags(String(override || ''))
  if (explicit) return explicit
  const { genre, mood, vocal } = doc.settings
  const parts = [genre, mood, vocal ? VOCAL_TAGS[vocal] : '']
    .map((part) => String(part || '').trim())
    .filter(Boolean)
  return cleanSongTags(parts.join(', ')) || 'upbeat pop, bright synths'
}

export type SongEnqueueRequest = {
  engine: 'acestep'
  promptString: string
  lyrics: string
  durationSeconds: number
  bpm: number | null
  seed: number | null
  language: string | null
  isPublic: false
  designer: string
  projectSlug: string
}

export type SongRequestOptions = {
  tags?: string | null
  seed?: number | null
  projectSlug: string
}

export function buildSongEnqueueRequest(
  doc: MusicVideoDoc,
  options: SongRequestOptions,
): SongEnqueueRequest {
  const instrumental = doc.settings.vocal === 'instrumental'
  const seed =
    typeof options.seed === 'number' &&
    Number.isInteger(options.seed) &&
    options.seed >= 0
      ? options.seed
      : null
  return {
    engine: 'acestep',
    promptString: buildSongTags(doc, options.tags),
    lyrics: instrumental ? '' : toAceStepLyrics(doc.lyrics.sections),
    durationSeconds: Math.round(doc.settings.durationSec),
    bpm: doc.settings.bpm ?? null,
    seed,
    language: doc.settings.language?.trim() || null,
    isPublic: false,
    designer: 'Music Video',
    projectSlug: options.projectSlug,
  }
}
