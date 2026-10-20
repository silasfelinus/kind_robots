// /utils/artImageUploadLimit.ts
//
// Whether a generated file fits in an ArtImage row. Pure and DB-free.
//
// save-generated stores the relay's base64 straight into ArtImage.imageData, so
// the INSERT has to fit in MySQL's max_allowed_packet (16 MB in production).
// ArtJob 40972, a 1280×720 animated WebP, rendered and then failed that INSERT
// on all three attempts, each one a full re-render, and the relay was told only
// "An unknown error occurred." (2026-10-20). Refusing the upload up front names
// the cause, and lets the relay fail the job once instead of re-rendering.

import { musicVideoPacketCapBytes } from './musicVideoFinal'

export type OversizeUpload = {
  bytes: number
  capBytes: number
}

/** The decoded size of a base64 payload, with or without a data: URL prefix. */
export function base64DecodedBytes(base64: string): number {
  const comma = base64.startsWith('data:') ? base64.indexOf(',') : -1
  const body = (comma >= 0 ? base64.slice(comma + 1) : base64).trim()
  const padding = body.endsWith('==') ? 2 : body.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((body.length * 3) / 4) - padding)
}

/**
 * The upload's size and the row's cap when the file cannot be stored, or null
 * when it fits or the packet size is unknown (then the database decides).
 */
export function oversizeUpload(
  base64: string,
  packetBytes: number | bigint | null | undefined,
): OversizeUpload | null {
  const capBytes = musicVideoPacketCapBytes(packetBytes)
  if (capBytes === null) return null
  const bytes = base64DecodedBytes(base64)
  return bytes > capBytes ? { bytes, capBytes } : null
}

function megabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1)
}

export function oversizeUploadMessage(
  oversize: OversizeUpload,
  fileType?: string | null,
): string {
  const what = fileType ? `${fileType.toUpperCase()} file` : 'file'
  return (
    `The generated ${what} is ${megabytes(oversize.bytes)} MB, but an ArtImage ` +
    `holds at most ${megabytes(oversize.capBytes)} MB. Render it as MP4, ` +
    'shorter, or with a smaller preset.'
  )
}
