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

// Room the INSERT needs besides the file itself: the other columns and the
// statement text.
export const MUSIC_VIDEO_PACKET_OVERHEAD_BYTES = 256 * 1024

/**
 * The largest upload a database packet of `packetBytes` can store as base64,
 * or null when the packet size is unknown. Production's packet turned out to be
 * smaller than the 32 MB the default assumes: a 13.4 MB MP4 (17.9 MB as base64)
 * failed with MySQL 1153 "packet bigger than max_allowed_packet" (2026-10-07).
 */
export function musicVideoPacketCapBytes(
  packetBytes: number | bigint | null | undefined,
): number | null {
  const packet = Number(packetBytes)
  if (!Number.isFinite(packet) || packet <= MUSIC_VIDEO_PACKET_OVERHEAD_BYTES)
    return null
  return Math.floor(((packet - MUSIC_VIDEO_PACKET_OVERHEAD_BYTES) * 3) / 4)
}

/**
 * The configured cap, lowered to what the database packet can hold. The
 * browser exporter asks the server for this (GET /api/music-video/limits)
 * rather than assuming the default, which is what let a 24 MB budget meet an
 * 11 MB packet cap.
 */
export function clampUploadToPacket(
  maxBytes: number,
  packetBytes: number | bigint | null | undefined,
): number {
  const packetCap = musicVideoPacketCapBytes(packetBytes)
  return packetCap === null ? maxBytes : Math.min(maxBytes, packetCap)
}

export const MUSIC_VIDEO_AUDIO_BITRATE = 128_000
export const MUSIC_VIDEO_MIN_AUDIO_BITRATE = 64_000
export const MUSIC_VIDEO_MIN_VIDEO_BITRATE = 150_000
export const MUSIC_VIDEO_MAX_VIDEO_BITRATE = 8_000_000

/*
 * The audio's share when the budget is tight. A 200 s video under the 11 MB
 * the production packet allows has about 420 kbps in all (Silas, 2026-10-07:
 * "The video is larger than 11 MB"), so a fixed 128k of audio plus a 400k
 * video floor could never fit; the audio steps down before the picture
 * starves.
 */
function audioBitrateFor(budget: number): number {
  if (budget >= 1_000_000) return MUSIC_VIDEO_AUDIO_BITRATE
  if (budget >= 500_000) return 96_000
  return MUSIC_VIDEO_MIN_AUDIO_BITRATE
}

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
  const audio = audioBitrateFor(budget)
  const video = Math.floor(budget - audio)
  return {
    video: Math.min(
      Math.max(video, MUSIC_VIDEO_MIN_VIDEO_BITRATE),
      MUSIC_VIDEO_MAX_VIDEO_BITRATE,
    ),
    audio,
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
