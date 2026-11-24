// /utils/arcade/games/rainbowAnimation.ts
//
// Rainbow Bullet Hell Space Princess, conductor rainbow t-030 (GEN2-STANDARD sections 5-6): real frame
// animation. Enemy idle cycles are WAN 2.2 first-and-last-frame loops of the approved doodle stills, cut to
// frames, matted and packed into one horizontal strip per family (conductor T030-ANIMATION-2026-11-23). The Act
// title cards come alive as short looping interludes, and each pilot has painted hit and victory poses. Every
// piece is optional: until its file has loaded, or under calm motion, the reviewed still plays instead. Bullets
// stay crisp code-drawn shapes; animation is for craft, pilots and scenes.
import type { RainbowStageStrip } from './rainbowGameArt'
import { rainbowArt, rainbowLoadedArt, rainbowLook } from './rainbowGameArt'

/** Idle atlases by enemy kind: a horizontal strip of `frames` equal cells, played at `fps`. Fever Dream look. */
export const RAINBOW_ENEMY_ATLASES: Readonly<
  Record<string, { frames: number; fps: number }>
> = {}

/** The atlas cell to show on this tick, or null without an atlas; calm motion holds the first cell. */
export function rainbowAtlasCell(
  kind: string,
  tick: number,
  calm: boolean,
): number | null {
  const atlas = RAINBOW_ENEMY_ATLASES[kind]
  if (!atlas) return null
  if (calm) return 0
  return Math.floor((Math.max(0, tick) * atlas.fps) / 60) % atlas.frames
}

export function rainbowEnemyAtlasPath(kind: string): string {
  return `anim/${kind}-idle`
}

/**
 * Draw an enemy's current idle frame centred on the origin, sized exactly as its still would be (the same area
 * and width bounds); false when there is no atlas or it has not loaded, so the caller draws the still.
 */
export function drawRainbowEnemyFrame(
  g: CanvasRenderingContext2D,
  kind: string,
  tick: number,
  calm: boolean,
  area = 1000,
): boolean {
  const cell = rainbowAtlasCell(kind, tick, calm)
  if (cell === null) return false
  const img = rainbowLoadedArt(rainbowEnemyAtlasPath(kind))
  if (!img || img.naturalWidth <= 0) return false
  const cellWidth = img.naturalWidth / RAINBOW_ENEMY_ATLASES[kind]!.frames
  const aspect = cellWidth / img.naturalHeight
  const width = Math.min(46, Math.max(24, Math.sqrt(area * aspect)))
  const height = width / aspect
  g.drawImage(
    img,
    cell * cellWidth,
    0,
    cellWidth,
    img.naturalHeight,
    -width / 2,
    -height / 2,
    width,
    height,
  )
  return true
}

/**
 * Act title cards that have a living interlude (looping, muted video). Each is a WAN 2.2 first-and-last-frame
 * loop of the Fever Dream card (conductor T030-ANIMATION-2026-11-23, reviewed 2026-11-23 PT): the exact source
 * frame is dropped and the tail crossfaded into the head so the loop has no seam. S03 (smeared to grain) and S04
 * (the card's painted fake logo moves) were rejected; S06-S08 are still rendering. Fever Dream only: the classic
 * look has its own painted cards.
 */
export const RAINBOW_INTERLUDES: readonly RainbowStageStrip[] = [
  's01',
  's02',
  's05',
]

export function rainbowInterludePath(stage: RainbowStageStrip): string {
  return `/rainbow-princess-video/interludes/${stage}.mp4`
}

const videos = new Map<string, HTMLVideoElement | null>()
/** The playing interlude for this Act, or null while it loads, without video support, or with none. */
function interlude(stage: RainbowStageStrip): HTMLVideoElement | null {
  if (!RAINBOW_INTERLUDES.includes(stage)) return null
  let video = videos.get(stage)
  if (video === undefined) {
    video = null
    if (typeof document !== 'undefined') {
      const made = document.createElement('video')
      made.muted = true
      made.loop = true
      made.playsInline = true
      made.preload = 'auto'
      made.onerror = () => videos.set(stage, null)
      made.src = rainbowInterludePath(stage)
      void made.play().catch(() => {})
      video = made
    }
    videos.set(stage, video)
  }
  return video && video.readyState >= 2 && video.videoWidth > 0 ? video : null
}

/**
 * Draw the Act's living interlude at (x, y), `width` wide; returns its height, or 0 when it is not playing (calm
 * motion, no interlude, still loading) so the caller draws the still title card.
 */
export function drawRainbowInterlude(
  g: CanvasRenderingContext2D,
  stage: RainbowStageStrip,
  x: number,
  y: number,
  width: number,
  calm: boolean,
): number {
  if (calm || rainbowLook() !== 'fever') return 0
  const video = interlude(stage)
  if (!video) return 0
  const height = (width * video.videoHeight) / video.videoWidth
  g.drawImage(video, x, y, width, height)
  return height
}

export type RainbowPose = 'hit' | 'victory'
/** Pilots (by first name, lower case) with painted poses. */
export const RAINBOW_PILOT_POSES: Readonly<
  Record<string, readonly RainbowPose[]>
> = {}

export function rainbowPosePath(pilot: string, pose: RainbowPose): string {
  return `poses/${pilot}-${pose}`
}

/** The URL of a pilot's pose, or null when that pose has not shipped. */
export function rainbowPose(speaker: string, pose: RainbowPose): string | null {
  const pilot = speaker.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  return RAINBOW_PILOT_POSES[pilot]?.includes(pose)
    ? rainbowArt(rainbowPosePath(pilot, pose))
    : null
}

/** Draw a pilot's pose as a square portrait at (x, y); false when it has not shipped or loaded. */
export function drawRainbowPose(
  g: CanvasRenderingContext2D,
  speaker: string,
  pose: RainbowPose,
  x: number,
  y: number,
  size: number,
): boolean {
  const pilot = speaker.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  if (!RAINBOW_PILOT_POSES[pilot]?.includes(pose)) return false
  const img = rainbowLoadedArt(rainbowPosePath(pilot, pose))
  if (!img || img.naturalWidth <= 0) return false
  // Poses are portrait-shaped: show the head and shoulders, cropped square from the top.
  const side = Math.min(img.naturalWidth, img.naturalHeight)
  g.drawImage(
    img,
    (img.naturalWidth - side) / 2,
    0,
    side,
    side,
    x,
    y,
    size,
    size,
  )
  return true
}
