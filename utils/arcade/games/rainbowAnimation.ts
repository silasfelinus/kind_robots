// /utils/arcade/games/rainbowAnimation.ts
//
// Rainbow Bullet Hell Space Princess, conductor rainbow t-030 (GEN2-STANDARD sections 5-6): real frame
// animation. Enemy idle cycles are WAN 2.2 first-and-last-frame loops of the approved doodle stills, cut to
// frames, matted and packed into one horizontal strip per family (conductor T030-ANIMATION-2026-11-23). The Act
// title cards come alive as short looping interludes, and each pilot has painted hit and victory poses. Every
// piece is optional: until its file has loaded, or under calm motion, the reviewed still plays instead. Bullets
// stay crisp code-drawn shapes; animation is for craft, pilots and scenes.
import type { RainbowStage, RainbowStageStrip } from './rainbowGameArt'
import {
  rainbowArt,
  rainbowDoodleLoadedArt,
  rainbowLoadedArt,
  rainbowLook,
} from './rainbowGameArt'

/**
 * Idle atlases by enemy kind: a horizontal strip of `frames` equal cells, played at `fps`. Fever Dream look only.
 * Each is eight evenly spaced frames of a reviewed WAN 2.2 loop (conductor T030-ANIMATION-2026-11-23, framed
 * -v2 cells, 2026-11-24 PT review), matte keyed, centred on the creature and sized to its still. Kept: the
 * picket's fin flutter, the urchin's puff, the anchor's paddling fins (third take) and the lantern's pulse (third
 * take, its green matte spill recoloured into the tentacles' blue). Rejected here: spiral (turns to face the
 * camera in both takes), relay (near-static), skimmer (source cut at the edge). Coral's first take was near-static
 * too; a later reviewed take ships as its sprite's idle atlas (RAINBOW_IDLE_ATLASES 'enemies/coral').
 */
export const RAINBOW_ENEMY_ATLASES: Readonly<
  Record<string, { frames: number; fps: number }>
> = {
  picket: { frames: 8, fps: 4 },
  urchin: { frames: 8, fps: 4 },
  anchor: { frames: 8, fps: 4 },
  lantern: { frames: 8, fps: 4 },
}

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
  if (rainbowLook() !== 'fever') return false
  const cell = rainbowAtlasCell(kind, tick, calm)
  if (cell === null) return false
  const img = rainbowDoodleLoadedArt(rainbowEnemyAtlasPath(kind))
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
 * frame is dropped and the tail crossfaded into the head so the loop has no seam. S03 is the second take (the
 * first smeared to grain); S04 is a take from its logo-free card (reviewed 2026-11-24 PT). S03, S04 and S08 are
 * 640 px loops (the card draws 200 px wide). Every Act now has one. Fever Dream only: the classic look has its own painted cards.
 */
export const RAINBOW_INTERLUDES: readonly RainbowStageStrip[] = [
  's01',
  's02',
  's03',
  's04',
  's05',
  's06',
  's07',
  's08',
]

export function rainbowInterludePath(stage: RainbowStage): string {
  return `/rainbow-princess-video/interludes/${stage}.mp4`
}

const videos = new Map<string, HTMLVideoElement | null>()
/** The playing interlude for this Act, or null while it loads, without video support, or with none. */
function interlude(stage: RainbowStage): HTMLVideoElement | null {
  if (!(RAINBOW_INTERLUDES as readonly string[]).includes(stage)) return null
  let video = videos.get(stage)
  if (video === undefined) {
    video = null
    if (typeof document !== 'undefined') {
      const made = document.createElement('video')
      made.muted = true
      // One-shot clips (presentation critic P-02): the squadron crosses the sky once per splash, then holds.
      made.loop = false
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
  stage: RainbowStage,
  x: number,
  y: number,
  width: number,
  calm: boolean,
  /** Frames since the splash began: the clip starts over at each Act's splash and holds its last frame. */
  elapsed: number | null = null,
): number {
  if (calm || rainbowLook() !== 'fever') return 0
  const video = interlude(stage)
  if (!video) return 0
  if (elapsed !== null && elapsed < 2 && video.currentTime > 0.05) {
    video.currentTime = 0
    void video.play()?.catch?.(() => {})
  }
  const height = (width * video.videoHeight) / video.videoWidth
  g.drawImage(video, x, y, width, height)
  return height
}

/**
 * Ending plates that move (presentation critic P-03: "the endings are 3 still plates"): a one-shot WAN 2.2 clip of
 * each reviewed plate (conductor ANIM-BACKLOG-2026-11-24), keyed by the plate's name (`restore`, `loyal-sever`).
 * Listed only once reviewed; an ending without a clip shows its still plate.
 */
export const RAINBOW_ENDING_MOTION: readonly string[] = [
  'restore',
  'evacuate',
  'sever-open',
  'loyal-restore',
  'loyal-evacuate',
  'loyal-sever',
]

/** The plate an ending shows: the loyal road has its own; sever's plate is the crew-free lantern scene. */
export function rainbowEndingPlateName(
  choice: 'restore' | 'evacuate' | 'sever',
  road: 'rebel' | 'loyal' | null,
): string {
  if (road === 'loyal') return `loyal-${choice}`
  return choice === 'sever' ? 'sever-open' : choice
}

export function rainbowEndingMotionPath(name: string): string {
  return `/rainbow-princess-video/endings/${name}.mp4`
}

const endingVideos = new Map<string, HTMLVideoElement | null>()
/**
 * Draw the ending's moving plate at (x, y), `width` wide, `elapsed` frames into the ending (the clip starts over
 * when the ending begins and holds its last frame); returns its height, or 0 under calm motion, in the Classic
 * look, without a reviewed clip or while it loads, so the caller draws the still plate.
 */
export function drawRainbowEndingMotion(
  g: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  width: number,
  calm: boolean,
  elapsed: number,
): number {
  if (
    calm ||
    rainbowLook() !== 'fever' ||
    !RAINBOW_ENDING_MOTION.includes(name)
  )
    return 0
  let video = endingVideos.get(name)
  if (video === undefined) {
    video = null
    if (typeof document !== 'undefined') {
      const made = document.createElement('video')
      made.muted = true
      made.loop = false
      made.playsInline = true
      made.preload = 'auto'
      made.onerror = () => endingVideos.set(name, null)
      made.src = rainbowEndingMotionPath(name)
      void made.play()?.catch?.(() => {})
      video = made
    }
    endingVideos.set(name, video)
  }
  if (!video || video.readyState < 2 || video.videoWidth <= 0) return 0
  if (elapsed < 2 && video.currentTime > 0.05) {
    video.currentTime = 0
    void video.play()?.catch?.(() => {})
  }
  const height = (width * video.videoHeight) / video.videoWidth
  g.drawImage(video, x, y, width, height)
  return height
}

export type RainbowPose = 'hit' | 'victory'
/**
 * Pilots (by first name, lower case) with painted poses: Kontext edits of each CAST-QA identity lock (conductor
 * T030-ANIMATION-2026-11-23, reviewed 2026-11-24 PT for face, hair, skin and build), cropped to head and shoulders.
 * Solenne's hit take showed no reaction and was rejected; her portrait stands in until a retake passes.
 */
export const RAINBOW_PILOT_POSES: Readonly<
  Record<string, readonly RainbowPose[]>
> = {
  maribel: ['hit', 'victory'],
  azure: ['hit', 'victory'],
  solenne: ['hit', 'victory'],
  vivi: ['hit', 'victory'],
}

/** How long a pilot's hit card shows over her ship after she loses a life. */
export const RAINBOW_HIT_CARD_FRAMES = 54

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
