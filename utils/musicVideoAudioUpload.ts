// /utils/musicVideoAudioUpload.ts
//
// A song file uploaded for a music video or comic film (music-video/t-013). Pure
// and DB-free.
//
// This is the soundtrack path that does not need ACE-Step on the render box:
// Suno exports, Silas's own medleys, or a score made elsewhere. The file becomes
// a private audio ArtImage, and doc.song points at it with source "upload".
// ArtImage bytes live base64-encoded in the row (a third larger), so the cap
// stays under a 32 MB database packet. A long WAV will not fit; MP3 is the
// format to use.
import { MUSIC_VIDEO_LIMITS } from './musicVideoDoc'
import { musicVideoMaxUploadBytes } from './musicVideoFinal'

export const MUSIC_VIDEO_DEFAULT_MAX_AUDIO_MB = 20

export const MUSIC_VIDEO_SONG_TYPES = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/vnd.wave': 'wav',
} as const

export type SongFileType = 'mp3' | 'wav'

export function musicVideoMaxAudioBytes(envValue?: string | null): number {
  return musicVideoMaxUploadBytes(envValue, MUSIC_VIDEO_DEFAULT_MAX_AUDIO_MB)
}

/** An ID3v2 tag, or an MPEG audio frame sync (11 set bits) at byte 0. */
export function looksLikeMp3(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false
  const id3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33
  const frameSync = bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0
  return id3 || frameSync
}

/** RIFF....WAVE */
export function looksLikeWav(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false
  const text = (start: number) =>
    String.fromCharCode(...bytes.slice(start, start + 4))
  return text(0) === 'RIFF' && text(8) === 'WAVE'
}

export type SongUploadCheck =
  | { ok: true; fileType: SongFileType }
  | { ok: false; statusCode: 400 | 413 | 415; message: string }

export function checkSongUpload(input: {
  bytes: Uint8Array | null | undefined
  mimeType: string | null | undefined
  maxBytes: number
}): SongUploadCheck {
  const bytes = input.bytes
  if (!bytes?.length) {
    return { ok: false, statusCode: 400, message: 'No audio file received.' }
  }
  if (bytes.length > input.maxBytes) {
    const limit = Math.floor(input.maxBytes / (1024 * 1024))
    return {
      ok: false,
      statusCode: 413,
      message: `The song is larger than ${limit} MB. Export it as an MP3 and try again.`,
    }
  }
  const mime = String(input.mimeType || '').toLowerCase()
  const declared =
    MUSIC_VIDEO_SONG_TYPES[mime as keyof typeof MUSIC_VIDEO_SONG_TYPES]
  const sniffed: SongFileType | null = looksLikeWav(bytes)
    ? 'wav'
    : looksLikeMp3(bytes)
      ? 'mp3'
      : null
  if (!declared || !sniffed || declared !== sniffed) {
    return {
      ok: false,
      statusCode: 415,
      message: 'Only MP3 (audio/mpeg) or WAV (audio/wav) songs are accepted.',
    }
  }
  return { ok: true, fileType: sniffed }
}

/** A client-measured length or tempo, kept only when it is inside the doc's limits. */
export function cleanSongNumber(
  value: unknown,
  kind: 'durationSec' | 'bpm',
): number | null {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return null
  const [min, max] =
    kind === 'bpm'
      ? [MUSIC_VIDEO_LIMITS.minBpm, MUSIC_VIDEO_LIMITS.maxBpm]
      : [1, MUSIC_VIDEO_LIMITS.maxDurationSec]
  if (number < min || number > max) return null
  return Math.round(number * 1000) / 1000
}

/** The video length that fits a song of this duration, within the doc's limits. */
export function videoDurationForSong(songSec: number): number {
  return Math.min(
    MUSIC_VIDEO_LIMITS.maxDurationSec,
    Math.max(MUSIC_VIDEO_LIMITS.minDurationSec, Math.ceil(songSec)),
  )
}

export function songUploadFileName(
  videoId: number,
  title: string,
  fileType: SongFileType,
): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'music-video'
  return `music-video-${videoId}-${slug}-song.${fileType}`
}
