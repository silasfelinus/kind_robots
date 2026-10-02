// /utils/artJobMedia.ts
//
// What kind of media an ArtJob produces, and whether a relay can run it.
// Pure and DB-free, shared by the claim route, the completion route and
// save-generated (music-video/t-020).
//
// Audio jobs ride the normal COMFY ArtJob path with payload.media = 'audio'.
// A relay that does not advertise supportsAudio must never claim one: an
// audio-unaware relay finds the .mp3 among Comfy's outputs, treats it as an
// image, and save-generated would store the song as a png.

export type ArtJobRelayCapabilities = {
  supportsInputImages: boolean
  supportsAudio: boolean
}

function payloadObject(payload: unknown): Record<string, unknown> | null {
  if (typeof payload === 'string') {
    try {
      const parsed: unknown = JSON.parse(payload)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null
    } catch {
      return null
    }
  }
  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : null
}

export function isAudioArtJobPayload(payload: unknown): boolean {
  const media = payloadObject(payload)?.media
  return typeof media === 'string' && media.trim().toLowerCase() === 'audio'
}

export function artJobClaimableBy(
  payload: unknown,
  capabilities: ArtJobRelayCapabilities,
): boolean {
  const body = payloadObject(payload)
  const needsInputImages =
    Array.isArray(body?.images) && (body?.images as unknown[]).length > 0
  if (needsInputImages && !capabilities.supportsInputImages) return false
  if (isAudioArtJobPayload(body) && !capabilities.supportsAudio) return false
  return true
}
