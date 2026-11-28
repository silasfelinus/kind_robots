/**
 * MONSTRIQUE cut-out character rig (conductor monstress-convention/t-018).
 *
 * A rig is a neutral A-pose figure cut into parts. Every coordinate is in rig
 * space, the A-pose's own frame (`frame`, feet on `frame.ground`), so a part's
 * `box` is where it sits in the A-pose and its `pivot` is the joint it turns
 * on. A part's art is either vector shapes or a crop of a painted sheet; the
 * mouth and eyes are swap parts holding one source per shape. Swapping vector
 * parts for painted ones changes only `art`, never boxes, pivots or clips.
 *
 * Clips are keyframed channels (rotate in degrees, x/y in rig units, sx/sy as
 * factors) stored as offsets from the A-pose. A pose is layered: a base clip
 * (idle, or walk driven by ground covered so the feet keep pace with the path
 * speed), an additive talk layer, then a one-shot gesture blended over the
 * top. `poseRig` is pure and deterministic so tests can sample any instant.
 */
import type { CaseAction, CaseState } from '../monstressConvention/prologue'

export interface RigBox {
  x: number
  y: number
  w: number
  h: number
}
export type RigPoint = readonly [number, number]

export type RigShapeTag = 'path' | 'circle' | 'ellipse' | 'rect' | 'text'
export interface RigShape {
  tag: RigShapeTag
  attrs: Readonly<Record<string, string | number>>
  text?: string
  /** Counter-flipped about its own x when the figure faces left, so print stays legible. */
  readable?: boolean
}

export interface RigVectorSource {
  kind: 'svg'
  shapes: readonly RigShape[]
}
/** A crop (`rect`, sheet pixels) of a painted sheet, stretched onto the part's box. */
export interface RigImageSource {
  kind: 'image'
  src: string
  sheet: { w: number; h: number }
  rect: RigBox
  /** Optional outline in sheet pixels when parts overlap inside the crop. */
  clip?: readonly RigPoint[]
}
export type RigSource = RigVectorSource | RigImageSource

export const MOUTH_SHAPES = ['rest', 'open', 'oh'] as const
export const EYE_STATES = ['open', 'blink'] as const
export type MouthShape = (typeof MOUTH_SHAPES)[number]
export type EyeState = (typeof EYE_STATES)[number]
export type RigSwap =
  | { kind: 'swap'; channel: 'mouth'; states: Record<MouthShape, RigSource> }
  | { kind: 'swap'; channel: 'eyes'; states: Record<EyeState, RigSource> }
export type RigArt = RigSource | RigSwap

export interface RigPart {
  id: string
  parent: string | null
  pivot: RigPoint
  box: RigBox
  z: number
  art: RigArt
}

export type RigChannelProp = 'rotate' | 'x' | 'y' | 'sx' | 'sy'
export type RigKey = readonly [phase: number, value: number]
export interface RigChannel {
  part: string
  prop: RigChannelProp
  keys: readonly RigKey[]
}

export const RIG_CLIP_IDS = [
  'idle',
  'walk',
  'talk',
  'point',
  'reach',
  'recoil',
  'gloves-up',
] as const
export type RigClipId = (typeof RIG_CLIP_IDS)[number]
export type RigGesture = 'point' | 'reach' | 'recoil'

export interface RigClip {
  durationMs: number
  loop: boolean
  /** `distance` clips advance with ground covered (one cycle per stride). */
  drive: 'time' | 'distance'
  channels: readonly RigChannel[]
  /** Held while a gesture plays. */
  mouth?: MouthShape
  eyes?: EyeState
  /** The phase shown, unmoving, under prefers-reduced-motion. */
  stillAt: number
}

export interface CutoutRig {
  id: 'iris' | 'norb'
  name: string
  frame: { w: number; h: number; ground: number }
  parts: readonly RigPart[]
  clips: Partial<Record<RigClipId, RigClip>>
  /** Which clip acts out each scene gesture. */
  gestures: Record<RigGesture, RigClipId>
  /** False for Norb: he never handles an item, so reach maps to a flinch. */
  handlesItems: boolean
  /** One full walk cycle (two steps) as a fraction of the figure's height. */
  strideHeights: number
  /** Thigh parts used to check the stride against the leg geometry. */
  legs: readonly string[]
  seed: number
}

export type RigMatrix = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
]
interface Local {
  rotate: number
  x: number
  y: number
  sx: number
  sy: number
}
const NEUTRAL: Local = { rotate: 0, x: 0, y: 0, sx: 1, sy: 1 }
const IDENTITY: RigMatrix = [1, 0, 0, 1, 0, 0]

export function multiply(m: RigMatrix, n: RigMatrix): RigMatrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

export function apply(m: RigMatrix, [x, y]: RigPoint): RigPoint {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
}

/** Translate, then rotate and scale about the pivot. */
export function localMatrix(pivot: RigPoint, local: Local): RigMatrix {
  const r = (local.rotate * Math.PI) / 180
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  const [px, py] = pivot
  const a = cos * local.sx
  const b = sin * local.sx
  const c = -sin * local.sy
  const d = cos * local.sy
  return [
    a,
    b,
    c,
    d,
    px - a * px - c * py + local.x,
    py - b * px - d * py + local.y,
  ]
}

function ease(t: number): number {
  return t * t * (3 - 2 * t)
}

/** A channel's value at `phase` (0..1), eased between keys and held past the ends. */
export function sampleChannel(keys: readonly RigKey[], phase: number): number {
  if (keys.length === 0) return 0
  const first = keys[0]!
  if (phase <= first[0]) return first[1]
  for (let i = 1; i < keys.length; i += 1) {
    const [t1, v1] = keys[i]!
    if (phase <= t1) {
      const [t0, v0] = keys[i - 1]!
      const span = t1 - t0
      return span <= 0 ? v1 : v0 + (v1 - v0) * ease((phase - t0) / span)
    }
  }
  return keys[keys.length - 1]![1]
}

type Layer = Record<string, Partial<Local>>
export function sampleClip(clip: RigClip, phase: number): Layer {
  const layer: Layer = {}
  for (const channel of clip.channels) {
    const entry = (layer[channel.part] ??= {})
    entry[channel.prop] = sampleChannel(channel.keys, phase)
  }
  return layer
}

/** Walk-cycle phase from ground covered: one cycle per stride, so no foot slides. */
export function walkPhase(distance: number, stride: number): number {
  if (!(stride > 0) || !Number.isFinite(distance)) return 0
  const cycles = distance / stride
  return cycles - Math.floor(cycles)
}

/** Width over height of the stage painting (1344x768). */
export const STAGE_ASPECT = 1344 / 768
/** Walk pace on the stage: milliseconds per stage-percentage unit of path. */
export const STAGE_WALK_MS_PER_UNIT = 16

/**
 * Stage units per walk cycle for a figure `heightPct` of the stage tall.
 * Stage x units are 1% of the width and the painting is `aspect` wide.
 */
export function strideUnits(
  rig: CutoutRig,
  heightPct: number,
  aspect = STAGE_ASPECT,
): number {
  return (rig.strideHeights * heightPct) / aspect
}

function hash(seed: number, n: number): number {
  let h = (seed ^ Math.imul(n + 1, 0x9e3779b1)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export const BLINK_MS = 140
export const BLINK_GAP = { min: 2400, max: 5200 }
const BLINK_CYCLE = 8

/** Deterministic blinks: eight jittered gaps, repeating. */
export function blinkAt(timeMs: number, seed: number): EyeState {
  const gaps = Array.from(
    { length: BLINK_CYCLE },
    (_, i) => BLINK_GAP.min + hash(seed, i) * (BLINK_GAP.max - BLINK_GAP.min),
  )
  const period = gaps.reduce((sum, gap) => sum + gap, 0)
  let t = ((timeMs % period) + period) % period
  for (const gap of gaps) {
    if (t < gap) return t >= gap - BLINK_MS ? 'blink' : 'open'
    t -= gap
  }
  return 'open'
}

export const FLAP_MS = 110
const FLAPS: readonly MouthShape[] = [
  'open',
  'rest',
  'oh',
  'open',
  'open',
  'rest',
  'open',
  'oh',
  'rest',
  'open',
  'rest',
  'rest',
]

/** Talk mouth flaps, about nine shapes a second, in a seeded order. */
export function mouthAt(timeMs: number, seed: number): MouthShape {
  const n = Math.floor(Math.max(0, timeMs) / FLAP_MS)
  const offset = Math.floor(hash(seed, 99) * FLAPS.length)
  return FLAPS[(n + offset) % FLAPS.length]!
}

export interface RigPlay {
  timeMs: number
  walking: boolean
  /** Ground covered while walking, in stage units. */
  distance: number
  /** Stage units per walk cycle (strideUnits). */
  stride: number
  talking: boolean
  gesture: { clip: RigClipId; startedMs: number } | null
  reducedMotion: boolean
}

export interface RigPartPose {
  id: string
  matrix: RigMatrix
  z: number
  box: RigBox
  source: RigSource
}
export interface RigPose {
  parts: RigPartPose[]
  mouth: MouthShape
  eyes: EyeState
  base: 'idle' | 'walk'
  gesture: RigClipId | null
}

/** Phase of a one-shot gesture, or null once it has finished. */
export function gesturePhase(
  clip: RigClip,
  startedMs: number,
  timeMs: number,
): number | null {
  const elapsed = timeMs - startedMs
  if (elapsed < 0 || elapsed >= clip.durationMs) return null
  return elapsed / clip.durationMs
}

/** Gesture weight: eases in over the first 15%, out over the last 20%. */
export function gestureWeight(phase: number): number {
  if (phase < 0.15) return ease(phase / 0.15)
  if (phase > 0.8) return ease((1 - phase) / 0.2)
  return 1
}

function loopPhase(clip: RigClip, timeMs: number): number {
  const cycles = timeMs / clip.durationMs
  return cycles - Math.floor(cycles)
}

/**
 * The rig's pose at one instant. Under reduced motion every clip holds its
 * `stillAt` frame, the eyes stay open, a gesture shows its held pose for its
 * duration, and talking holds an open mouth instead of flapping.
 */
export function poseRig(rig: CutoutRig, play: RigPlay): RigPose {
  const still = play.reducedMotion
  const base = play.walking && rig.clips.walk ? 'walk' : 'idle'
  const baseClip = rig.clips[base]
  const locals: Record<string, Local> = {}
  for (const part of rig.parts) locals[part.id] = { ...NEUTRAL }
  const add = (layer: Layer, weight = 1) => {
    for (const [id, values] of Object.entries(layer)) {
      const local = locals[id]
      if (!local) continue
      if (values.rotate !== undefined) local.rotate += values.rotate * weight
      if (values.x !== undefined) local.x += values.x * weight
      if (values.y !== undefined) local.y += values.y * weight
      if (values.sx !== undefined) local.sx *= 1 + (values.sx - 1) * weight
      if (values.sy !== undefined) local.sy *= 1 + (values.sy - 1) * weight
    }
  }
  if (baseClip) {
    const phase = still
      ? baseClip.stillAt
      : base === 'walk'
        ? walkPhase(play.distance, play.stride)
        : loopPhase(baseClip, play.timeMs)
    add(sampleClip(baseClip, phase))
  }
  const talkClip = rig.clips.talk
  if (play.talking && talkClip && !still)
    add(sampleClip(talkClip, loopPhase(talkClip, play.timeMs)))

  let gesture: RigClipId | null = null
  let gestureClip: RigClip | undefined
  if (play.gesture) {
    gestureClip = rig.clips[play.gesture.clip]
    const phase = gestureClip
      ? gesturePhase(gestureClip, play.gesture.startedMs, play.timeMs)
      : null
    if (gestureClip && phase !== null) {
      gesture = play.gesture.clip
      const shown = still ? gestureClip.stillAt : phase
      const weight = still ? 1 : gestureWeight(phase)
      const layer = sampleClip(gestureClip, shown)
      for (const [id, values] of Object.entries(layer)) {
        const local = locals[id]
        if (!local) continue
        for (const prop of Object.keys(values) as RigChannelProp[]) {
          const target = values[prop]!
          local[prop] = local[prop] + (target - local[prop]) * weight
        }
      }
    } else gestureClip = undefined
  }

  const worlds: Record<string, RigMatrix> = {}
  const worldOf = (part: RigPart, depth = 0): RigMatrix => {
    const known = worlds[part.id]
    if (known) return known
    if (depth > rig.parts.length) throw new Error('rig parent cycle')
    const parent = part.parent
      ? rig.parts.find((candidate) => candidate.id === part.parent)
      : undefined
    const local = localMatrix(part.pivot, locals[part.id] ?? NEUTRAL)
    const world = parent ? multiply(worldOf(parent, depth + 1), local) : local
    worlds[part.id] = world
    return world
  }

  const mouth: MouthShape = gestureClip?.mouth
    ? gestureClip.mouth
    : play.talking
      ? still
        ? 'open'
        : mouthAt(play.timeMs, rig.seed)
      : 'rest'
  const eyes: EyeState = gestureClip?.eyes
    ? gestureClip.eyes
    : still
      ? 'open'
      : blinkAt(play.timeMs, rig.seed)

  const parts = rig.parts
    .map((part) => ({
      id: part.id,
      matrix: worldOf(part) ?? IDENTITY,
      z: part.z,
      box: part.box,
      source: sourceFor(part.art, mouth, eyes),
    }))
    .sort((a, b) => a.z - b.z)
  return { parts, mouth, eyes, base, gesture }
}

export function sourceFor(
  art: RigArt,
  mouth: MouthShape,
  eyes: EyeState,
): RigSource {
  if (art.kind !== 'swap') return art
  return art.channel === 'mouth' ? art.states[mouth] : art.states[eyes]
}

/** Every source a part can show. */
export function sourcesOf(art: RigArt): RigSource[] {
  return art.kind === 'swap' ? Object.values(art.states) : [art]
}

/**
 * The data-only swap: replace parts' art with painted crops, keeping boxes,
 * pivots, z-order and clips. Swap parts take one source per mouth or eye state.
 */
export function withPaintedParts(
  rig: CutoutRig,
  painted: Partial<
    Record<string, RigImageSource | Partial<Record<string, RigImageSource>>>
  >,
): CutoutRig {
  return {
    ...rig,
    parts: rig.parts.map((part) => {
      const paint = painted[part.id]
      if (!paint) return part
      if (part.art.kind !== 'swap')
        return 'kind' in paint && paint.kind === 'image'
          ? { ...part, art: paint as RigImageSource }
          : part
      const states = { ...part.art.states } as Record<string, RigSource>
      for (const [state, source] of Object.entries(paint))
        if (state in states && source && typeof source === 'object')
          states[state] = source as RigImageSource
      return { ...part, art: { ...part.art, states } as RigSwap }
    }),
  }
}

/** Ordered list of a part's ancestors, nearest first. Throws on a cycle. */
export function ancestry(rig: CutoutRig, id: string): string[] {
  const chain: string[] = []
  let current = rig.parts.find((part) => part.id === id)?.parent ?? null
  while (current) {
    if (chain.includes(current) || current === id)
      throw new Error('rig parent cycle at ' + id)
    chain.push(current)
    current = rig.parts.find((part) => part.id === current)?.parent ?? null
  }
  return chain
}

/** Scene gestures for the two leads after an action. */
export function leadGestures(
  action: Pick<CaseAction, 'verb'> | null,
  previous: CaseState,
  next: CaseState,
  ghostFlags: readonly string[] = ['odette-met', 'violet-met'],
): Partial<Record<'iris' | 'norb', RigGesture>> {
  const gestures: Partial<Record<'iris' | 'norb', RigGesture>> = {}
  if (
    ghostFlags.some(
      (flag) => next.flags.includes(flag) && !previous.flags.includes(flag),
    )
  )
    return { iris: 'recoil', norb: 'recoil' }
  if (next.rebuffs > previous.rebuffs) gestures.norb = 'recoil'
  if (!action) return gestures
  if (previous.actor !== 'iris') return gestures
  if (next === previous) gestures.iris = 'recoil'
  else if (action.verb === 'take' || action.verb === 'use')
    gestures.iris = 'reach'
  else if (action.verb === 'look' || action.verb === 'photograph')
    gestures.iris = 'point'
  return gestures
}
