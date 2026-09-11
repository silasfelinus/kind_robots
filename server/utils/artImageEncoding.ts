// /server/utils/artImageEncoding.ts
//
// How an ArtImage's stored bytes are encoded on their way to the media share:
// transcoded to WebP, or written verbatim because they already carry motion.
//
// Split out of artImageOffload.ts rather than living beside its only caller,
// because this is the destructive half of the offload and it needs to be
// testable on its own. artImageOffload.ts imports prisma at module load, and
// prisma throws without a DATABASE_URL — so a test importing it cannot run in
// the DB-free contract-tests workflow, which is exactly where a guard against
// silently destroying image data belongs. Nothing here touches the database.
import sharp from 'sharp'

// Matches exportPageBackdropArt.ts and file.get.ts: 82 measured 8.3x smaller
// than the source PNG with no visible artefacts at card size.
const WEBP_QUALITY = 82

// Clips are stored verbatim. sharp cannot decode them, and re-encoding a video
// to WebP would silently turn a clip into a still.
const VIDEO_TYPES = new Set(['mp4', 'webm', 'mov', 'mkv'])

/*
 * Container types that hold EITHER a still or an animation, so the stored
 * fileType alone cannot decide whether re-encoding is safe.
 *
 * This is not hypothetical. `webp` is both this project's default still format
 * (everything else is transcoded to it) AND what every WAN/LTX video preset
 * whose outputFormat is 'webp' actually emits — buildVideoOutputNodes() sends
 * the decoded frame batch into ComfyUI's SaveAnimatedWEBP, and the relay stamps
 * the ArtImage `fileType: 'webp'`. Since 'webp' is not in VIDEO_TYPES above,
 * such a clip fell into the re-encode branch, and `sharp(buf)` defaults to
 * `pages: 1` — it reads frame 0 and silently discards the rest. The offload
 * then wrote that single frame to the share and nulled imageData, destroying
 * the only animated copy.
 *
 * That is exactly how Scene Animator's first render came back as a static image
 * (2026-09-11): the wan-startup-webp preset is the default for engine 'wan', so
 * every Scene Animator clip took this path. ComfyUI had animated it correctly.
 *
 * Frame count, not extension, is the real question — so ask sharp.
 */
const MULTI_FRAME_TYPES = new Set(['webp', 'gif'])

/**
 * True when `buffer` holds more than one frame.
 *
 * Deliberately allowed to throw: a buffer whose metadata sharp cannot read is
 * one the re-encode below would fail on anyway, and letting it reach the
 * caller's catch leaves the bytes in the database rather than committing a
 * guess about them to disk.
 */
async function hasMultipleFrames(buffer: Buffer): Promise<boolean> {
  const { pages } = await sharp(buffer).metadata()
  return typeof pages === 'number' && pages > 1
}

export type OffloadEncoding = {
  /** Extension the offloaded copy is written under. */
  extension: string
  /** Bytes to write — the original whenever they already carry motion. */
  bytes: Buffer
  /** True when the bytes were kept as-is rather than transcoded to WebP. */
  keepVerbatim: boolean
}

/**
 * Decide how a stored ArtImage's bytes reach the share: transcoded to WebP, or
 * written verbatim because they carry motion that a transcode would destroy.
 *
 * See utils/scripts/verifyAnimatedArtOffload.test.ts.
 */
export async function resolveOffloadEncoding(
  storedType: string,
  original: Buffer,
): Promise<OffloadEncoding> {
  const normalized = (storedType || 'png').toLowerCase()
  const isVideo = VIDEO_TYPES.has(normalized)
  const isAnimated =
    !isVideo &&
    MULTI_FRAME_TYPES.has(normalized) &&
    (await hasMultipleFrames(original))

  // Anything already carrying motion is stored under its own extension. Only a
  // genuine still is worth transcoding.
  if (isVideo || isAnimated) {
    return { extension: normalized, bytes: original, keepVerbatim: true }
  }

  return {
    extension: 'webp',
    bytes: await sharp(original).webp({ quality: WEBP_QUALITY }).toBuffer(),
    keepVerbatim: false,
  }
}
