// /utils/musicVideoFinal.ts
//
// The finished MP4 for a music video (music-video/t-023). Pure and DB-free.
//
// Conductor's headless pipeline (scripts/build_music_video.py) assembles the
// video with ffmpeg and uploads it here; the browser exporter (t-014) will do
// the same. The file becomes a private video ArtImage and the MusicVideo row's
// finalArtImageId. Publishing it anywhere is a separate, human-approved step
// (t-022).
//
// ArtImage bytes live base64-encoded in the row, so the upload is capped. The
// default leaves room under a 32 MB database packet once base64 adds its third;
// MUSIC_VIDEO_MAX_UPLOAD_MB raises or lowers it per deployment, and the
// pipeline re-encodes at a higher CRF until its output fits.

export const MUSIC_VIDEO_DEFAULT_MAX_UPLOAD_MB = 24
export const MUSIC_VIDEO_HARD_MAX_UPLOAD_MB = 200

export const MUSIC_VIDEO_FINAL_TYPES = {
  'video/mp4': 'mp4',
} as const

export function musicVideoMaxUploadBytes(
  envValue?: string | null,
  defaultMb: number = MUSIC_VIDEO_DEFAULT_MAX_UPLOAD_MB,
): number {
  const parsed = Number(envValue)
  const megabytes =
    Number.isFinite(parsed) && parsed > 0
      ? Math.min(parsed, MUSIC_VIDEO_HARD_MAX_UPLOAD_MB)
      : defaultMb
  return Math.floor(megabytes * 1024 * 1024)
}

export const MUSIC_VIDEO_AUDIO_BITRATE = 128_000
export const MUSIC_VIDEO_MIN_VIDEO_BITRATE = 400_000
export const MUSIC_VIDEO_MAX_VIDEO_BITRATE = 8_000_000

/**
 * Bitrates that keep a browser export under the upload cap (Silas,
 * 2026-10-06: "getting errors when exporting the final video that it is too
 * large"). The encoder's "high quality" setting made a 75 s video far larger
 * than 24 MB. This budgets 85% of the cap across the running time, leaving
 * the rest for the container and encoder overshoot; `scale` lowers it for a
 * retry when a file still comes out too big.
 */
export function finalVideoBitrates(
  durationSec: number,
  maxBytes: number,
  scale = 1,
): { video: number; audio: number } {
  const seconds = Math.max(durationSec, 1)
  const budget = ((maxBytes * 8 * 0.85) / seconds) * scale
  const video = Math.floor(budget - MUSIC_VIDEO_AUDIO_BITRATE)
  return {
    video: Math.min(
      Math.max(video, MUSIC_VIDEO_MIN_VIDEO_BITRATE),
      MUSIC_VIDEO_MAX_VIDEO_BITRATE,
    ),
    audio: MUSIC_VIDEO_AUDIO_BITRATE,
  }
}

/** ISO BMFF: bytes 4..8 are the "ftyp" box type in every MP4 file. */
export function looksLikeMp4(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false
  return (
    bytes[4] === 0x66 && // f
    bytes[5] === 0x74 && // t
    bytes[6] === 0x79 && // y
    bytes[7] === 0x70 //    p
  )
}

export type FinalVideoCheck =
  | { ok: true; fileType: 'mp4' }
  | { ok: false; statusCode: 400 | 413 | 415; message: string }

export function checkFinalVideoUpload(input: {
  bytes: Uint8Array | null | undefined
  mimeType: string | null | undefined
  maxBytes: number
}): FinalVideoCheck {
  const bytes = input.bytes
  if (!bytes?.length) {
    return { ok: false, statusCode: 400, message: 'No video file received.' }
  }
  if (bytes.length > input.maxBytes) {
    const limit = Math.floor(input.maxBytes / (1024 * 1024))
    return {
      ok: false,
      statusCode: 413,
      message: `The video is larger than ${limit} MB. Re-encode it at a higher CRF and try again.`,
    }
  }
  const mime = String(input.mimeType || '').toLowerCase()
  if (!(mime in MUSIC_VIDEO_FINAL_TYPES) || !looksLikeMp4(bytes)) {
    return {
      ok: false,
      statusCode: 415,
      message: 'Only MP4 video (video/mp4) is accepted.',
    }
  }
  return { ok: true, fileType: 'mp4' }
}

export function finalVideoFileName(videoId: number, title: string): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'music-video'
  return `music-video-${videoId}-${slug}.mp4`
}
