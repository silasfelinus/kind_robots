// /utils/musicVideoAccess.ts
//
// Who may see a music video, and what a remix copies (Silas, 2026-10-07: "make
// sure that non-owners of videos can see them if not private, and give the
// option for logged in users to remix (keeping all settings but connecting to
// current user)").
//
// No imports beyond types on purpose: the contract script loads this without
// a Nuxt runtime.
import type { MusicVideoDoc, MusicVideoScene } from './musicVideoDoc'

export type MusicVideoViewer = {
  userId: number | null
  isAdmin: boolean
  showMature: boolean
  restricted: boolean
}

export type MusicVideoVisibility = {
  userId: number
  isPublic: boolean
  finalArtImageId: number | null
}

/** The final cut's ArtImage, as much of it as access needs. */
export type MusicVideoFinalCut = {
  userId: number | null
  isActive: boolean | null
  isMature: boolean | null
} | null

export const MUSIC_VIDEO_REMIX_SUFFIX = ' (remix)'

export function isMusicVideoOwner(
  video: Pick<MusicVideoVisibility, 'userId'>,
  viewer: Pick<MusicVideoViewer, 'userId'>,
): boolean {
  return viewer.userId !== null && video.userId === viewer.userId
}

/**
 * A final cut only counts when it is live and belongs to the video's owner, so
 * a doc or row pointing at someone else's private ArtImage can never publish it.
 */
export function hasPlayableFinal(
  video: MusicVideoVisibility,
  final: MusicVideoFinalCut,
): boolean {
  return Boolean(
    video.finalArtImageId &&
    final &&
    final.isActive !== false &&
    final.userId === video.userId,
  )
}

/**
 * Owners always see their own videos, drafts included. Everyone else sees a
 * public video once it has a final cut, behind the same maturity rule as the
 * art pages: a mature cut needs an adult who opted in, and a restricted
 * account never sees one.
 */
export function canViewMusicVideo(
  video: MusicVideoVisibility,
  final: MusicVideoFinalCut,
  viewer: MusicVideoViewer,
): boolean {
  if (isMusicVideoOwner(video, viewer)) return true
  const mature = final?.isMature === true
  if (mature && viewer.restricted) return false
  if (viewer.isAdmin) return true
  if (!video.isPublic || !hasPlayableFinal(video, final)) return false
  return !mature || viewer.showMature
}

/** Whether this viewer may stream the final cut itself. */
export function canPlayMusicVideoFinal(
  video: MusicVideoVisibility,
  final: MusicVideoFinalCut,
  viewer: MusicVideoViewer,
): boolean {
  return (
    hasPlayableFinal(video, final) && canViewMusicVideo(video, final, viewer)
  )
}

export function remixMusicVideoTitle(title: string, maxLength = 255): string {
  const base = title.trim() || 'Untitled music video'
  return `${base.slice(0, maxLength - MUSIC_VIDEO_REMIX_SUFFIX.length)}${MUSIC_VIDEO_REMIX_SUFFIX}`
}

function withoutJob<T extends { jobId?: number }>(value: T): T {
  const copy = { ...value }
  delete copy.jobId
  return copy
}

function remixScene(scene: MusicVideoScene, keepArt: boolean): MusicVideoScene {
  const image = withoutJob(scene.image)
  const motion = withoutJob(scene.motion)
  if (!keepArt || !image.artImageId) {
    image.source = 'generated'
    delete image.artImageId
  }
  if (!keepArt) delete motion.clipArtImageId
  return { ...scene, image, motion }
}

/**
 * Every setting, the pitch, lyrics, timeline and scene prompts carry over. The
 * art (song, stills, clips) carries over only when the remixer can already
 * read it, i.e. remixing their own video; someone else's private renders stay
 * theirs and the remix renders its own. Job ids never carry over, so the two
 * videos' status syncs cannot write into each other.
 */
export function remixMusicVideoDoc(
  doc: MusicVideoDoc,
  keepArt: boolean,
): MusicVideoDoc {
  const song = keepArt && doc.song?.artImageId ? withoutJob(doc.song) : null
  return {
    ...doc,
    settings: { ...doc.settings },
    song,
    scenes: doc.scenes.map((scene) => remixScene(scene, keepArt)),
  }
}
