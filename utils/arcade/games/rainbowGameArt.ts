import { loadedImage } from '../ghostTrail/bake'
import { RAINBOW_DOODLE_ART } from './rainbowDoodleArt'
import type { FinaleChoice } from './rainbowEclipseFinale'

/**
 * Painted art for the Rainbow Space Princess cabinet (Conductor rainbow t-022). Every image is optional:
 * until it has loaded, the engine keeps drawing its vector stand-in, so art never gates play and the
 * collision core never changes with the picture.
 */
export const RAINBOW_GAME_ART_ROOT = '/rainbow-princess-art'

/**
 * The cabinet's two looks (Conductor rainbow t-036/t-037). Classic is the painted art the game shipped with.
 * Fever Dream is the 1980s neon airbrush school-folder restyle from DOODLE-DIRECTION.md: doodle art where a
 * render passed review, and the classic sprite given a neon sticker treatment where one did not. Any picture
 * missing from RAINBOW_DOODLE_ART falls back to the classic file, so the look never leaves a hole.
 */
export const RAINBOW_LOOKS = [
  { key: 'classic', label: 'Classic', hint: 'The painted look' },
  { key: 'fever', label: 'Fever Dream', hint: 'Neon airbrush doodles' },
] as const
export type RainbowLook = (typeof RAINBOW_LOOKS)[number]['key']
/** Silas, 2026-11-05 PT: "Yes, fever dream should be default." A visitor's own choice still wins. */
export const RAINBOW_DEFAULT_LOOK: RainbowLook = 'fever'
export const RAINBOW_LOOK_STORAGE_KEY = 'rainbow-princess-look'

const doodleArt = new Set(RAINBOW_DOODLE_ART)
let currentLook: RainbowLook = RAINBOW_DEFAULT_LOOK

export function isRainbowLook(value: unknown): value is RainbowLook {
  return RAINBOW_LOOKS.some((look) => look.key === value)
}

/** The look every draw call uses right now. */
export function rainbowLook(): RainbowLook {
  return currentLook
}

/** Switch looks; the next frame draws in it. Remembered in this browser when storage is available. */
export function setRainbowLook(look: RainbowLook, remember = true): void {
  currentLook = look
  if (!remember) return
  try {
    globalThis.localStorage?.setItem(RAINBOW_LOOK_STORAGE_KEY, look)
  } catch {
    // Private windows and blocked storage just forget the choice.
  }
}

/** Restore the remembered look (or the default) and return it. */
export function loadRainbowLook(): RainbowLook {
  let saved: unknown
  try {
    saved = globalThis.localStorage?.getItem(RAINBOW_LOOK_STORAGE_KEY)
  } catch {
    saved = null
  }
  currentLook = isRainbowLook(saved) ? saved : RAINBOW_DEFAULT_LOOK
  return currentLook
}

/**
 * A pilot's menu portrait (they live outside the art root, under /rainbow-princess-portraits): the doodle twin
 * in Fever Dream when it passed CAST-QA, otherwise the classic identity-lock portrait.
 */
export function rainbowPortrait(
  classicSrc: string,
  look: RainbowLook = currentLook,
): string {
  const stem =
    classicSrc
      .split('/')
      .pop()
      ?.replace(/\.webp$/, '') ?? ''
  return look === 'fever' && doodleArt.has(`portraits/${stem}`)
    ? `${RAINBOW_GAME_ART_ROOT}/doodle/portraits/${stem}.webp`
    : classicSrc
}

/** The Pilots-tab backdrop: Fever Dream's four-cat-ship key art, or the classic Pearl Palace. */
export function rainbowHeroArt(
  classicSrc: string,
  look: RainbowLook = currentLook,
): string {
  return look === 'fever' && doodleArt.has('key-art')
    ? `${RAINBOW_GAME_ART_ROOT}/doodle/key-art.webp`
    : classicSrc
}

/**
 * A loaded picture for this URL. While a Fever Dream picture is still downloading (just after switching
 * looks), its classic twin stands in, so the screen never drops to vector stand-ins mid-fight.
 */
function loadedArt(src: string): HTMLImageElement | null {
  const img = loadedImage(src)
  if (img || !src.includes('/doodle/')) return img
  return loadedImage(src.replace('/doodle/', '/'))
}

/** The loaded picture for a path under the art root (Fever Dream twin when one shipped), or null while loading. */
/**
 * A Fever Dream-only picture under doodle/ that has no classic twin (t-030 animation atlases): loaded straight
 * from its doodle path, so it needs no entry in the generated doodle manifest, and never asks for a classic
 * twin that does not exist while it loads (presentation critic round 2: four 404s per session).
 */
export function rainbowDoodleLoadedArt(path: string): HTMLImageElement | null {
  return loadedImage(`${RAINBOW_GAME_ART_ROOT}/doodle/${path}.webp`)
}

/**
 * Idle atlases for Fever Dream sprites beyond the four enemy cycles in rainbowAnimation (presentation critic P-01:
 * no frame animation for bosses, ships, guardians or most enemies). Keyed by the sprite's path under doodle/
 * (`enemies/angler`, `bosses/b03-phase2`, `ships/halo-fin`, `pickups/charge`); each is a horizontal strip of
 * `frames` equal cells at doodle/anim/<name>-idle, eight evenly spaced frames of a reviewed WAN 2.2 loop
 * (conductor ANIM-BACKLOG-2026-11-24), matte keyed and sized to its still. Listed only once reviewed.
 */
export const RAINBOW_IDLE_ATLASES: Readonly<Record<string, number>> = {
  'bosses/b01-phase1': 8,
  'bosses/b01-phase2': 8,
  'bosses/b01-phase3': 8,
  'bosses/b03-phase2': 8,
  'bosses/b03-phase3': 8,
  'bosses/b04-phase2': 8,
  'bosses/b05-phase1': 8,
  'bosses/b05-phase2': 8,
  'bosses/b05-phase3': 8,
  'bosses/b06-phase1': 8,
  'bosses/b06-phase2': 8,
  'bosses/b06-phase3': 8,
  'bosses/b07-phase2': 8,
  'bosses/b08-phase1': 8,
  'bosses/b08-phase2': 8,
  'bosses/b08-phase3': 8,
  'bosses/b09-phase2': 8,
  'bosses/b09-phase3': 8,
  'bosses/flagship': 8,
  'enemies/angler': 8,
  'enemies/bulwark': 8,
  'enemies/captive': 8,
  'enemies/clawstrike': 8,
  'enemies/coral': 8,
  'enemies/courier': 8,
  'enemies/cutter': 8,
  'enemies/dolphin': 8,
  'enemies/guardian-armory-siren': 8,
  'enemies/guardian-bellkeeper': 8,
  'enemies/guardian-bulwark': 8,
  'enemies/guardian-comet-herder': 8,
  'enemies/guardian-courier': 8,
  'enemies/guardian-herald': 8,
  'enemies/guardian-mirror': 8,
  'enemies/guardian-pearl-warden': 8,
  'enemies/guardian-salvager': 8,
  'enemies/guardian-shoal-koi': 8,
  'enemies/hammerhead': 8,
  'enemies/mirror': 8,
  'enemies/motherdrone': 8,
  'enemies/skate': 8,
  'hazards/kelp-frond': 8,
  'pickups/comet-cadet-pod': 8,
  'pickups/coral-choir-pod': 8,
  'pickups/power': 8,
  'ships/halo-fin': 8,
}
/** Idle atlases play at four frames a second, like the enemy cycles. */
export const RAINBOW_IDLE_FPS = 4

let animationTick = 0
let animationCalm = false
/** The engine sets the animation clock once per render; calm motion holds every atlas on its first cell. */
export function setRainbowAnimationClock(tick: number, calm: boolean): void {
  animationTick = tick
  animationCalm = calm
}

/** The atlas key for a sprite URL (its path under doodle/, without extension), or null for none. */
export function rainbowIdleAtlasKey(src: string): string | null {
  const match =
    /\/doodle\/((?:enemies|bosses|ships|pickups|hazards)\/[\w-]+)\.webp$/.exec(
      src,
    )
  return match && RAINBOW_IDLE_ATLASES[match[1]!] ? match[1]! : null
}

/** The atlas cell on this tick for `frames` cells, or the first under calm motion. */
export function rainbowIdleCell(frames: number, tick = animationTick): number {
  if (animationCalm) return 0
  return Math.floor((Math.max(0, tick) * RAINBOW_IDLE_FPS) / 60) % frames
}

/**
 * The current idle frame for a sprite URL: the loaded atlas and the cell's source rectangle, or null when it has
 * no atlas, is not in Fever Dream, or its atlas has not loaded (the caller draws the still).
 */
function idleFrame(
  src: string,
): { img: HTMLImageElement; sx: number; sw: number } | null {
  const key = rainbowIdleAtlasKey(src)
  if (!key) return null
  const frames = RAINBOW_IDLE_ATLASES[key]!
  const img = loadedImage(
    `${RAINBOW_GAME_ART_ROOT}/doodle/anim/${key.split('/')[1]}-idle.webp`,
  )
  if (!img || img.naturalWidth <= 0) return null
  const sw = img.naturalWidth / frames
  return { img, sx: rainbowIdleCell(frames) * sw, sw }
}

/** Draw `src` (or its current idle frame) into the box at (x, y), w x h. */
function drawSpriteOrFrame(
  g: CanvasRenderingContext2D,
  src: string,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const frame = idleFrame(src)
  if (frame)
    g.drawImage(
      frame.img,
      frame.sx,
      0,
      frame.sw,
      frame.img.naturalHeight,
      x,
      y,
      w,
      h,
    )
  else g.drawImage(img, x, y, w, h)
}

export function rainbowLoadedArt(path: string): HTMLImageElement | null {
  return loadedArt(rainbowArt(path))
}

/**
 * The URL for a picture under the art root, given as a path without extension (`ships/petal-wing`). Fever
 * Dream uses the doodle twin when one shipped; everything else is the classic file.
 */
export function rainbowArt(
  path: string,
  look: RainbowLook = currentLook,
): string {
  return look === 'fever' && doodleArt.has(path)
    ? `${RAINBOW_GAME_ART_ROOT}/doodle/${path}.webp`
    : `${RAINBOW_GAME_ART_ROOT}/${path}.webp`
}

export const RAINBOW_SHIP_SPRITES = [
  'petal-wing',
  'prism-lance',
  'halo-fin',
  'comet-crown',
] as const

export const RAINBOW_COMMS_SPEAKERS = {
  'Lilt-7': 'lilt',
  Maribel: 'maribel',
  Azure: 'azure',
  Solenne: 'solenne',
  Vivi: 'vivi',
  Purl: 'purl',
  Opal: 'opal',
  Nemi: 'nemi',
} as const

export type RainbowCommsKey =
  (typeof RAINBOW_COMMS_SPEAKERS)[keyof typeof RAINBOW_COMMS_SPEAKERS]

export function rainbowShipSprite(seat: number): string {
  const key = RAINBOW_SHIP_SPRITES[seat % RAINBOW_SHIP_SPRITES.length]!
  return rainbowArt(`ships/${key}`)
}

export function rainbowCommsKey(speaker: string): RainbowCommsKey | null {
  const first = speaker.trim().split(/\s+/)[0] ?? ''
  return (
    (RAINBOW_COMMS_SPEAKERS as Record<string, RainbowCommsKey>)[speaker] ??
    (RAINBOW_COMMS_SPEAKERS as Record<string, RainbowCommsKey>)[first] ??
    null
  )
}

export function rainbowCommsPortrait(speaker: string): string | null {
  const key = rainbowCommsKey(speaker)
  return key ? rainbowArt(`comms/${key}`) : null
}

/**
 * Draw the seat's ship centred on the origin, nose to the right; false while the sprite is loading. Ships
 * are sized to a common area, so a long, slim jet and a stubby delta read as the same weight on screen.
 */
export function drawRainbowShipSprite(
  g: CanvasRenderingContext2D,
  seat: number,
  area = 960,
): boolean {
  return drawFitted(g, rainbowShipSprite(seat), area, 34, 56)
}

/** The engine's enemy kinds, E01-E08 in the design doc, each with a round-9 sprite. */
export const RAINBOW_ENEMY_SPRITES = [
  'picket',
  'spiral',
  'anchor',
  'urchin',
  'lantern',
  'relay',
  'skimmer',
  'coral',
] as const

/**
 * Act III's painted craft, ready before the stage spawns them: E09 Clawstrike Shrimp, E10 Pistol Shrimp
 * Shuttle and E11 Angler Decoy (round-17 Kontext 247709, 247711, 247713) and E12 Glassfin Skate (round-21
 * 247818).
 */
export const RAINBOW_ACT_THREE_ENEMY_SPRITES = [
  'clawstrike',
  'pistol',
  'angler',
  'skate',
] as const

/**
 * Acts IV and V's painted craft (round-25 Kontext from the round-3 concepts), ready before their stages:
 * E13 Dolphin Pair 247868, E14 Dolphin Courier 247869, E15 Electric Eel Threader (round-26 247888, from the
 * round-12 B07 eel, replacing round 25's stubby 247870), then E16 Shark
 * Cutter 247871, E17 Shark Hammerhead 247873 (fin missile pods) and E18 Octopus Salvager 247875.
 */
export const RAINBOW_ACT_FOUR_ENEMY_SPRITES = [
  'dolphin',
  'courier',
  'eel',
] as const
export const RAINBOW_ACT_FIVE_ENEMY_SPRITES = [
  'cutter',
  'hammerhead',
  'salvager',
] as const
/**
 * Act VI's craft: E20 Reef Turret 247892 and E21 Nautilus Bulwark 247893 (round 26), and E19 Manta Broodship
 * 247959 (round-28 txt2img, seen from above and turned to face left).
 */
export const RAINBOW_ACT_SIX_ENEMY_SPRITES = [
  'turret',
  'bulwark',
  'brood',
] as const
/**
 * Act VII's craft: E22 Mirror Eel 247941 and E24 Crown Harbinger 247944 (round 27), and E23 Crystal Squid 247963
 * (round-28 txt2img, turned so its tentacles trail). Prism pylons are drawn by hand.
 */
export const RAINBOW_ACT_SEVEN_ENEMY_SPRITES = [
  'mirror',
  'harbinger',
  'squid',
] as const
/**
 * Act VIII's captive whale hull (round-31 Kontext 247998, the round-30 247968 look without its collar): the engine
 * draws the chain and collar over it, since only the collar takes damage.
 */
export const RAINBOW_ACT_EIGHT_ENEMY_SPRITES = ['captive'] as const

/**
 * The rebel road's Motherland interceptor (t-060, Krea 2 render 279290): white enamel and gold, a crown crest, the
 * empire's machine rather than one of the Ocean's living craft.
 */
export const RAINBOW_MOTHERLAND_ENEMY_SPRITES = ['motherdrone'] as const

export function rainbowEnemySprite(kind: string): string | null {
  return [
    ...RAINBOW_ENEMY_SPRITES,
    ...RAINBOW_ACT_THREE_ENEMY_SPRITES,
    ...RAINBOW_ACT_FOUR_ENEMY_SPRITES,
    ...RAINBOW_ACT_FIVE_ENEMY_SPRITES,
    ...RAINBOW_ACT_SIX_ENEMY_SPRITES,
    ...RAINBOW_ACT_SEVEN_ENEMY_SPRITES,
    ...RAINBOW_ACT_EIGHT_ENEMY_SPRITES,
    ...RAINBOW_MOTHERLAND_ENEMY_SPRITES,
  ].some((name) => name === kind)
    ? rainbowArt(`enemies/${kind}`)
    : null
}

/**
 * Draw an enemy centred on the origin, facing left; false when the kind has no sprite or it is loading.
 * The default area keeps the picture close to the 28x26 box player shots hit.
 */
export function drawRainbowEnemySprite(
  g: CanvasRenderingContext2D,
  kind: string,
  area = 1000,
): boolean {
  const src = rainbowEnemySprite(kind)
  return src ? drawFitted(g, src, area, 24, 46) : false
}

/**
 * Painted mid-Act guardians (round-24 Kontext: 247858 armoured urchin, 247860 lantern; round 25: 247876
 * armoured clawstrike with its cannon claw; round 26: 247895 rose-gold courier and 247897 armoured salvager;
 * round 27: 247946 nautilus bulwark; round 29: 247964 silver mirror eel; round 31: 248008 crowned herald
 * warship),
 * keyed at 256 px so they stay crisp at guardian size; until they load the engine scales up the scout sprite
 * instead.
 */
export const RAINBOW_GUARDIAN_SPRITES = [
  'urchin',
  'lantern',
  'clawstrike',
  'courier',
  'salvager',
  'bulwark',
  'mirror',
  'herald',
  // Gen-2 alternate-Act guardians (t-059, keyed from Krea 2 renders 278924, 278620, 277698, 277699, 277844).
  'kelp-warden',
  'comet-herder',
  'pearl-warden',
  'bellkeeper',
  'shoal-koi',
  // The Armory Siren (ARMORY-SIREN-2026-11-23, Krea 2 279830), the Act V armory route's own guardian.
  'armory-siren',
] as const

/**
 * Which painted guardian a guardian kind flies as. The retired Matriarch still borrows the Lantern; every
 * other kind with a sprite uses its own.
 */
const GUARDIAN_ART_FOR_KIND: Readonly<Record<string, string>> = {
  matriarch: 'lantern',
  siren: 'armory-siren',
  kelpwarden: 'kelp-warden',
  herder: 'comet-herder',
  warden: 'pearl-warden',
  lampkeeper: 'bellkeeper',
  shoalkoi: 'shoal-koi',
}

export function rainbowGuardianArtKey(kind: string): string {
  return GUARDIAN_ART_FOR_KIND[kind] ?? kind
}

export function rainbowGuardianSprite(kind: string): string | null {
  const art = rainbowGuardianArtKey(kind)
  return (RAINBOW_GUARDIAN_SPRITES as readonly string[]).includes(art)
    ? rainbowArt(`enemies/guardian-${art}`)
    : null
}

/**
 * Painted hazards and drifting terrain (t-028): X2's coral asteroid (GEN2-CORAL-COMET-X2 278622) and X1's kelp
 * frond (GEN2-KELP-NEBULA-X1 278928), keyed at 256 px.
 */
export const RAINBOW_HAZARD_SPRITES = {
  'coral-asteroid': 'enemies/coral-asteroid',
  'kelp-frond': 'hazards/kelp-frond',
} as const
export type RainbowHazardSprite = keyof typeof RAINBOW_HAZARD_SPRITES

/** Draw a hazard centred on the origin, `size` px on its long side; false while its picture is loading. */
export function drawRainbowHazardSprite(
  g: CanvasRenderingContext2D,
  hazard: RainbowHazardSprite,
  size: number,
): boolean {
  const src = rainbowArt(RAINBOW_HAZARD_SPRITES[hazard])
  const img = loadedArt(src)
  if (!img || img.naturalWidth <= 0) return false
  const scale = size / Math.max(img.naturalWidth, img.naturalHeight)
  const w = img.naturalWidth * scale
  const h = img.naturalHeight * scale
  drawSpriteOrFrame(g, src, img, -w / 2, -h / 2, w, h)
  return true
}

/** Draw a guardian centred on the origin, about 106 px across; false while its picture is loading. */
export function drawRainbowGuardianSprite(
  g: CanvasRenderingContext2D,
  kind: string,
): boolean {
  const src = rainbowGuardianSprite(kind)
  return src ? drawFitted(g, src, 9200, 84, 112) : false
}

/** The engine's three pickups, painted from the U01 gem, U06 bubble shield and U08 star charms. */
export const RAINBOW_PICKUP_SPRITES = ['power', 'shield', 'charge'] as const

export function rainbowPickupSprite(kind: string): string | null {
  return (RAINBOW_PICKUP_SPRITES as readonly string[]).includes(kind)
    ? rainbowArt(`pickups/${kind}`)
    : null
}

/** Draw a pickup centred on (x, y) inside a size-by-size box; false when it has no sprite or is loading. */
export function drawRainbowPickupSprite(
  g: CanvasRenderingContext2D,
  kind: string,
  x: number,
  y: number,
  size = 22,
): boolean {
  const src = rainbowPickupSprite(kind)
  const img = src ? loadedArt(src) : null
  if (!img) return false
  const scale = size / Math.max(img.naturalWidth, img.naturalHeight)
  const width = img.naturalWidth * scale
  const height = img.naturalHeight * scale
  drawSpriteOrFrame(g, src!, img, x - width / 2, y - height / 2, width, height)
  return true
}

/**
 * Alternate-Act objectives that are not engine pickups (t-059): the X1 Coral Choir pod, the X2 cadet pod and the
 * X3 lighthouse lamp. Kept apart from RAINBOW_PICKUP_SPRITES, which mirrors the engine's Pickup kind union.
 */
export const RAINBOW_ROUTE_OBJECT_SPRITES = [
  'coral-choir-pod',
  'comet-cadet-pod',
  'lighthouse-lamp',
] as const

export function rainbowRouteObjectSprite(kind: string): string | null {
  return (RAINBOW_ROUTE_OBJECT_SPRITES as readonly string[]).includes(kind)
    ? rainbowArt(`pickups/${kind}`)
    : null
}

/** Draw a route objective centred on the origin inside a size box; false when it has no sprite or is loading. */
export function drawRainbowRouteObjectSprite(
  g: CanvasRenderingContext2D,
  kind: string,
  size: number,
): boolean {
  const src = rainbowRouteObjectSprite(kind)
  const img = src ? loadedArt(src) : null
  if (!img) return false
  const scale = size / Math.max(img.naturalWidth, img.naturalHeight)
  const width = img.naturalWidth * scale
  const height = img.naturalHeight * scale
  drawSpriteOrFrame(g, src!, img, -width / 2, -height / 2, width, height)
  return true
}

/**
 * Calm, damaged (phase 2) and enraged (phase 3) pictures: B01 Pearl Seahorse and B02 Aurelia Array, which fly
 * today, B03 Clawburst for Act III (round-18 Kontext 247730, round-20 phases 247765 and 247768), and, ahead
 * of their Acts, B04 Delphion and B05 Sawtooth Regent (round-15 bases 247593 and 247594, round-25 phases
 * 247878/247881 and 247883/247884), then B06 Lantern Ray (round-12 247595, mirrored to face left; round-26
 * phases 247899 and 247901) and B07 Glass Eel (247596; 247903 and 247905), then B08 Prism Leviathan (247597;
 * round-27 phases 247947 and 247950) and B09 Eclipse Crown (247598; 247952 and 247954).
 */
export const RAINBOW_BOSS_SPRITES = [
  'b01',
  'b02',
  'b03',
  'b04',
  'b05',
  'b06',
  'b07',
  'b08',
  'b09',
] as const
export type RainbowBossKey = (typeof RAINBOW_BOSS_SPRITES)[number]

export function rainbowBossSprite(boss: RainbowBossKey, phase: number): string {
  const step = Math.min(3, Math.max(1, Math.round(phase)))
  return rainbowArt(`bosses/${boss}-phase${step}`)
}

/**
 * Draw the boss's phase picture centred on (x, y) at the given width, facing left. All three phases are
 * requested on the first draw, so a phase change rarely waits; until it has loaded the phase-1 picture
 * stands in. False when nothing has loaded yet, so the engine keeps its vector body.
 */
export function drawRainbowBossSprite(
  g: CanvasRenderingContext2D,
  boss: RainbowBossKey,
  phase: number,
  x: number,
  y: number,
  width: number,
): boolean {
  const sources = [1, 2, 3].map((step) => rainbowBossSprite(boss, step))
  const pictures = sources.map((src) => loadedArt(src))
  const step = Math.min(3, Math.max(1, Math.round(phase)))
  const index = pictures[step - 1] ? step - 1 : 0
  const img = pictures[index]
  if (!img) return false
  const height = (width * img.naturalHeight) / img.naturalWidth
  drawSpriteOrFrame(
    g,
    sources[index]!,
    img,
    x - width / 2,
    y - height / 2,
    width,
    height,
  )
  return true
}

/**
 * Super cut-in banners, one per pilot seat, cropped to 2.9:1 around face and power: round-14 Kontext, except
 * Solenne's round-22 reroll (247803), which keeps her broad, muscular build, and Vivi's round-23 reroll
 * (247844) from her clean-tee portrait, with no lettering on her shirt.
 */
export const RAINBOW_CUTIN_PILOTS = [
  'maribel',
  'azure',
  'solenne',
  'vivi',
] as const

export function rainbowSuperCutin(
  seat: number,
  look: RainbowLook = currentLook,
): string {
  const key = RAINBOW_CUTIN_PILOTS[seat % RAINBOW_CUTIN_PILOTS.length]!
  return rainbowArt(`cutins/${key}`, look)
}

export interface RainbowCutinPose {
  scale: number
  offsetX: number
  offsetY: number
}

/** A painted close-up settles into the super banner without moving its HUD or collision space. */
export function rainbowCutinPose(
  seat: number,
  age: number,
  calm = false,
): RainbowCutinPose {
  if (calm) return { scale: 1, offsetX: 0, offsetY: 0 }
  const time = Math.max(0, Math.min(42, age))
  const settle = 1 - Math.pow(1 - Math.min(1, time / 18), 3)
  const direction = seat % 2 === 0 ? 1 : -1
  return {
    scale: 1.08 - 0.08 * settle + Math.sin(time * 0.25) * 0.006 * settle,
    offsetX: direction * (-8 * (1 - settle) + Math.sin(time / 11) * settle),
    offsetY: 3 * (1 - settle) + Math.sin(time / 8) * 0.4 * settle,
  }
}

/** Draw the seat's cut-in banner at (x, y) with the given height; returns its width, or 0 while loading. */
export function drawRainbowSuperCutin(
  g: CanvasRenderingContext2D,
  seat: number,
  x: number,
  y: number,
  height: number,
  age = 0,
  calm = false,
): number {
  const img = loadedArt(rainbowSuperCutin(seat))
  if (!img) return 0
  const width = (height * img.naturalWidth) / img.naturalHeight
  const pose = rainbowCutinPose(seat, age, calm)
  g.save()
  g.beginPath()
  g.rect(x, y, width, height)
  g.clip()
  g.drawImage(
    img,
    x + (width * (1 - pose.scale)) / 2 + pose.offsetX,
    y + (height * (1 - pose.scale)) / 2 + pose.offsetY,
    width * pose.scale,
    height * pose.scale,
  )
  g.restore()
  return width
}

/**
 * Keyed foreground strips for all eight stages, each saved as the strip followed by its mirror so the tile
 * loops without a seam: S01/S02 coral from round-14 Kontext 247628 and 247630, and S03-S08 restyled from
 * that S01 strip in round 20 (247770, 247785, 247787, 247790, 247791, 247793). Only S01 and S02 fly today.
 */
export const RAINBOW_STAGE_STRIPS = [
  's01',
  's02',
  's03',
  's04',
  's05',
  's06',
  's07',
  's08',
] as const
export type RainbowStageStrip = (typeof RAINBOW_STAGE_STRIPS)[number]

/**
 * The finale's own stage (presentation review P-07, conductor ART-BACKLOG-2026-11-24): the Crown heart and its
 * prism corridors, with a card, strip and painted planes of its own. Act IX flies it once its classic card and
 * strip are listed in RAINBOW_STAGE_PAINTINGS; until then it borrows Act VIII's, as it always has.
 */
export const RAINBOW_FINALE_STAGE = 's09'
export type RainbowStage = RainbowStageStrip | typeof RAINBOW_FINALE_STAGE

/**
 * Classic stage paintings shipped beyond the eight strips and cards (P-04/P-07): the painted sky, far and mid
 * planes per Act (`stages/s01-sky`) and the finale's card and strip. A plane draws only when it is listed here
 * or, in Fever Dream, in RAINBOW_DOODLE_ART; every listed file needs its Fever Dream twin.
 */
export const RAINBOW_STAGE_PAINTINGS: readonly string[] = [
  'stages/s01-far',
  'stages/s01-mid',
  'stages/s01-sky',
  'stages/s02-far',
  'stages/s02-mid',
  'stages/s02-sky',
  'stages/s03-far',
  'stages/s03-mid',
  'stages/s03-sky',
  'stages/s04-far',
  'stages/s04-mid',
  'stages/s04-sky',
  'stages/s05-far',
  'stages/s05-mid',
  'stages/s05-sky',
  'stages/s06-far',
  'stages/s06-mid',
  'stages/s06-sky',
  'stages/s07-far',
  'stages/s07-mid',
  'stages/s07-sky',
  'stages/s08-far',
  'stages/s08-mid',
  'stages/s08-sky',
  'stages/s09-card',
  'stages/s09-far',
  'stages/s09-fore',
  'stages/s09-mid',
  'stages/s09-sky',
]
const stagePaintings = new Set(RAINBOW_STAGE_PAINTINGS)

/** The stage an Act flies: S01-S08 for Acts I-VIII, and the finale's own S09 once it has shipped. */
export function rainbowActStage(act: number): RainbowStage {
  if (
    act >= 9 &&
    stagePaintings.has(`stages/${RAINBOW_FINALE_STAGE}-card`) &&
    stagePaintings.has(`stages/${RAINBOW_FINALE_STAGE}-fore`)
  )
    return RAINBOW_FINALE_STAGE
  const index = Math.min(RAINBOW_STAGE_STRIPS.length, Math.max(1, act)) - 1
  return RAINBOW_STAGE_STRIPS[index]!
}

export function rainbowStageStrip(stage: RainbowStage): string {
  return rainbowArt(`stages/${stage}-fore`)
}

/** Tile the stage's strip across the playfield at (0, y), scrolled left by `scroll` logical pixels. */
export function drawRainbowStageStrip(
  g: CanvasRenderingContext2D,
  stage: RainbowStage,
  scroll: number,
  y: number,
  height: number,
  width = 480,
): boolean {
  const img = loadedArt(rainbowStageStrip(stage))
  if (!img) return false
  const tile = (height * img.naturalWidth) / img.naturalHeight
  for (let x = -(((scroll % tile) + tile) % tile); x < width; x += tile) {
    g.drawImage(img, x, y, tile, height)
  }
  return true
}

/**
 * Painted stage planes stay optional until a reviewed render is registered (RAINBOW_DOODLE_ART for Fever Dream,
 * RAINBOW_STAGE_PAINTINGS for Classic, which Fever Dream also falls back to). Until then a far or mid plane crops
 * a different band of the stage's reviewed strip, and a sky plane is simply not drawn.
 */
export type RainbowStageDepth = 'sky' | 'far' | 'mid'

/** The painted plane this look draws for the stage and depth, or null when none has shipped. */
export function rainbowStagePlane(
  stage: RainbowStage,
  depth: RainbowStageDepth,
  look: RainbowLook = currentLook,
): string | null {
  const path = `stages/${stage}-${depth}`
  if (look === 'fever' && doodleArt.has(path))
    return `${RAINBOW_GAME_ART_ROOT}/doodle/${path}.webp`
  return stagePaintings.has(path)
    ? `${RAINBOW_GAME_ART_ROOT}/${path}.webp`
    : null
}

export function rainbowStageTileLayout(
  scroll: number,
  tileWidth: number,
  viewportWidth: number,
): { x: number; mirrored: boolean }[] {
  if (
    !Number.isFinite(scroll) ||
    !Number.isFinite(tileWidth) ||
    !Number.isFinite(viewportWidth) ||
    tileWidth < 8 ||
    viewportWidth <= 0
  ) {
    return []
  }
  const first = Math.floor(scroll / tileWidth)
  const offset = scroll - first * tileWidth
  const count = Math.ceil((viewportWidth + offset) / tileWidth)
  return Array.from({ length: count }, (_, index) => ({
    x: index * tileWidth - offset,
    mirrored: (first + index) % 2 !== 0,
  }))
}

export function drawRainbowStagePlane(
  g: CanvasRenderingContext2D,
  stage: RainbowStage,
  depth: RainbowStageDepth,
  scroll: number,
  y: number,
  height: number,
  width = 480,
): boolean {
  const src = rainbowStagePlane(stage, depth)
  const painted = src ? loadedImage(src) : null
  if (!painted && depth === 'sky') return false
  const img = painted ?? loadedArt(rainbowStageStrip(stage))
  if (!img || img.naturalHeight <= 0 || height <= 0) return false

  const cropStart = painted ? 0 : depth === 'far' ? 0 : 0.3
  const cropEnd = painted ? 1 : depth === 'far' ? 0.7 : 1
  const sourceY = Math.floor(img.naturalHeight * cropStart)
  const sourceHeight = Math.max(
    1,
    Math.floor(img.naturalHeight * cropEnd) - sourceY,
  )
  const tileWidth = (height * img.naturalWidth) / sourceHeight
  for (const tile of rainbowStageTileLayout(scroll, tileWidth, width)) {
    if (tile.mirrored) {
      g.save()
      g.translate(tile.x + tileWidth, 0)
      g.scale(-1, 1)
      g.drawImage(
        img,
        0,
        sourceY,
        img.naturalWidth,
        sourceHeight,
        0,
        y,
        tileWidth,
        height,
      )
      g.restore()
    } else {
      g.drawImage(
        img,
        0,
        sourceY,
        img.naturalWidth,
        sourceHeight,
        tile.x,
        y,
        tileWidth,
        height,
      )
    }
  }
  return true
}

/** The Gen-2 page paintings (GEN2-ROUND-1): the Luminous Ocean route map (251317) and the Palace Hangar (251298). */
export function rainbowGen2Art(
  name: 'route-map' | 'hangar',
  look: RainbowLook = currentLook,
): string {
  return rainbowArt(`gen2/${name}`, look)
}

/** Painted Act title cards (round-15/16 Kontext), shown as the Act intro splash. */
export function rainbowStageCard(
  stage: RainbowStage,
  look: RainbowLook = currentLook,
): string {
  return rainbowArt(`stages/${stage}-card`, look)
}

/** Draw the stage's title card at (x, y) with the given width; returns its height, or 0 while loading. */
export function drawRainbowStageCard(
  g: CanvasRenderingContext2D,
  stage: RainbowStage,
  x: number,
  y: number,
  width: number,
): number {
  const img = loadedArt(rainbowStageCard(stage))
  if (!img) return 0
  const height = (width * img.naturalHeight) / img.naturalWidth
  g.drawImage(img, x, y, width, height)
  return height
}

/**
 * Painted ending plates in the Fever Dream look (conductor ENDINGS-FEVER-DREAM-2026-11-22), keyed by the final
 * choice and shared by every road: C14 restore (279195, the open Crown over a sunrise of freed sea-ships), C15
 * evacuate (279196, the Aurora Mercy leading the convoy out of the shattering palace) and C16 sever (279935,
 * lanterns rising over the mirror sea with cat ships on the water and no pilots in shot, so it fits any crew and
 * replaces the four-pilot plate the presentation critic found off the house style, P-03).
 */
export const RAINBOW_ENDING_PLATES: Readonly<Record<FinaleChoice, string>> = {
  restore: 'endings/restore',
  evacuate: 'endings/evacuate',
  sever: 'endings/sever-open',
}

/**
 * The loyal road's own plates (independent story critic S11, 2026-11-23 PT: "the ending art ignores the road"):
 * PEACE BY ORDER, AN EMPTY OCEAN and ORDERS BROKEN, from conductor ENDINGS-ROADS-2026-11-24 (reviewed 2026-11-24
 * PT). A loyal choice without one here shows the shared plate.
 */
export const RAINBOW_LOYAL_ENDING_PLATES: Readonly<
  Partial<Record<FinaleChoice, string>>
> = {
  restore: 'endings/loyal-restore',
  evacuate: 'endings/loyal-evacuate',
  sever: 'endings/loyal-sever',
}
/**
 * The plate for this ending: the loyal road has its own, and every other road shows the choice's plate.
 */
export function rainbowEndingPlate(
  choice: FinaleChoice,
  road: 'rebel' | 'loyal' | 'choice' | 'turned' | null = null,
): string | null {
  const path =
    (road === 'loyal' && RAINBOW_LOYAL_ENDING_PLATES[choice]) ||
    RAINBOW_ENDING_PLATES[choice]
  return path ? rainbowArt(path) : null
}

/**
 * B09 on the rebel road (t-061): the Motherland flagship painting (Krea 2 render 279298), a white-and-gold warship
 * with the Crown clamped at its prow. `crownX`/`crownY` locate the clamped Crown in the picture (as fractions of
 * its size), so it is drawn with that Crown on the boss's ring and the long hull trailing off to the right.
 * `phase2` (t-064) is the same ship battered once the clamps spring: a Flux Kontext edit of 279298 (ArtImage
 * 279493), with its own Crown point so the Crown stays on the ring when the paintings swap.
 */
export const RAINBOW_FLAGSHIP_ART = {
  path: 'bosses/flagship',
  width: 230,
  crownX: 0.066,
  crownY: 0.251,
  phase2: {
    path: 'bosses/flagship-phase2',
    crownX: 0.049,
    crownY: 0.257,
  },
} as const

/**
 * Draw the flagship with its clamped Crown at the origin: battered in phase 2 once that painting loads, else the
 * phase-1 painting; false while neither has loaded.
 */
export function drawRainbowFlagshipSprite(
  g: CanvasRenderingContext2D,
  phase: 1 | 2 = 1,
): boolean {
  const { width } = RAINBOW_FLAGSHIP_ART
  const battered =
    phase === 2 ? loadedArt(rainbowArt(RAINBOW_FLAGSHIP_ART.phase2.path)) : null
  const src = battered ? null : rainbowArt(RAINBOW_FLAGSHIP_ART.path)
  const img = battered ?? (src ? loadedArt(src) : null)
  if (!img) return false
  const { crownX, crownY } = battered
    ? RAINBOW_FLAGSHIP_ART.phase2
    : RAINBOW_FLAGSHIP_ART
  const height = (width * img.naturalHeight) / img.naturalWidth
  // Phase 1 bobs on its Fever Dream idle loop (anim/flagship-idle) once that atlas loads; phase 2 stays still.
  if (src)
    drawSpriteOrFrame(
      g,
      src,
      img,
      -crownX * width,
      -crownY * height,
      width,
      height,
    )
  else g.drawImage(img, -crownX * width, -crownY * height, width, height)
  return true
}

/** Draw the choice's ending plate at (x, y) with the given width; returns its height, or 0 when there is none. */
export function drawRainbowEndingPlate(
  g: CanvasRenderingContext2D,
  choice: FinaleChoice,
  x: number,
  y: number,
  width: number,
  road: 'rebel' | 'loyal' | null = null,
): number {
  const src = rainbowEndingPlate(choice, road)
  const img = src ? loadedArt(src) : null
  if (!img) return 0
  const height = (width * img.naturalHeight) / img.naturalWidth
  g.drawImage(img, x, y, width, height)
  return height
}

function drawFitted(
  g: CanvasRenderingContext2D,
  src: string,
  area: number,
  minWidth: number,
  maxWidth: number,
): boolean {
  const img = loadedArt(src)
  if (!img) return false
  const aspect = img.naturalWidth / img.naturalHeight
  const width = Math.min(maxWidth, Math.max(minWidth, Math.sqrt(area * aspect)))
  const height = width / aspect
  drawSpriteOrFrame(g, src, img, -width / 2, -height / 2, width, height)
  return true
}

/** Draw the speaker's comms portrait into a square; false when there is none or it is loading. */
export function drawRainbowCommsPortrait(
  g: CanvasRenderingContext2D,
  speaker: string,
  x: number,
  y: number,
  size: number,
): boolean {
  const src = rainbowCommsPortrait(speaker)
  const img = src ? loadedArt(src) : null
  if (!img) return false
  g.drawImage(img, x, y, size, size)
  return true
}
