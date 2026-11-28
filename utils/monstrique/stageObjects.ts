/**
 * MONSTRIQUE stateful stage objects (conductor monstress-convention/t-019).
 *
 * The painted rooms bake every prop in. The props whose state the case can
 * change are drawn again as their own layers, cut from the same paintings by
 * scripts/cut_monstrique_object_layers.py, and moved by CSS: Room 205's door
 * swings open, the ice machine shudders on its double clank, Odette's purse
 * leaves the chair in an evidence bag, the knife is bagged where it fell, and
 * the vending machine dispenses (mature edition only, where Iris can use it).
 *
 * Every state is derived from the case flags, evidence and inventory, so a
 * save needs no new field and both editions share the art. The cue for each
 * change waits for Iris's reach to touch the object, and under reduced motion
 * the new state simply appears. Chapter Two's objects wait for its rooms'
 * painted art.
 */
import {
  roomForAudience,
  type MonstriqueAudience,
} from '../monstressConvention/edition'
import {
  FIRE_ESCAPE_ENTRY,
  type CaseState,
  type HotelHotspot,
  type HotelRoom,
  type RoomId,
} from '../monstressConvention/prologue'
import type { ContactAction } from './contact'
import { IRIS_RIG } from './leadRigs'
import { leadGestures, type RigGesture } from './rig'
import { STAGE_HEIGHT, STAGE_WIDTH } from './stageArt'

export const STAGE_OBJECT_IDS = [
  'room-205-door',
  'ice-machine',
  'odette-purse',
  'prop-knife',
  'vending-machine',
] as const
export type StageObjectId = (typeof STAGE_OBJECT_IDS)[number]
export type StageObjectState =
  'closed' | 'open' | 'idle' | 'present' | 'gone' | 'loose' | 'bagged'
export type StageObjectCue =
  'swing-open' | 'shudder' | 'take' | 'bag' | 'dispense'

/** A box in painting pixels (1344x768): x, y, width, height. */
export type PaintingBox = readonly [x: number, y: number, w: number, h: number]
/** A box as percentages of the stage, the space hotspots use. */
export interface StageBox {
  x: number
  y: number
  w: number
  h: number
}
export interface StageLayer {
  src: string
  px: PaintingBox
}
/** A clear evidence bag drawn over a prop, in painting pixels. */
export interface EvidenceBag {
  cx: number
  cy: number
  length: number
  width: number
  angle: number
}

export interface StageObject {
  id: StageObjectId
  room: RoomId
  hotspot: string
  label: string
  states: readonly StageObjectState[]
  cues: readonly StageObjectCue[]
  /** The prop itself, cut from the painting; it is what moves. */
  layer?: StageLayer
  /** Shown where the prop stood once it has gone. */
  gone?: StageLayer
  /** Revealed behind the prop when it opens. */
  behind?: StageLayer
  /** A piece that moves on its own (the dispensed pack). */
  piece?: StageLayer
  bag?: EvidenceBag
}

const OBJECTS = '/monstress-convention/objects/'
const layer = (file: string, px: PaintingBox): StageLayer => ({
  src: OBJECTS + file + '.webp',
  px,
})

export const STAGE_OBJECTS: Record<StageObjectId, StageObject> = {
  'room-205-door': {
    id: 'room-205-door',
    room: 'balcony',
    hotspot: 'room-door',
    label: 'Room 205’s door',
    states: ['closed', 'open'],
    cues: ['swing-open'],
    layer: layer('balcony-door', [711, 64, 104, 591]),
    behind: layer('balcony-door-interior', [711, 64, 104, 591]),
  },
  'ice-machine': {
    id: 'ice-machine',
    room: 'ice-alcove',
    hotspot: 'ice-machine',
    label: 'The ice machine',
    states: ['idle'],
    cues: ['shudder'],
    layer: layer('ice-machine', [449, 200, 291, 425]),
  },
  'odette-purse': {
    id: 'odette-purse',
    room: 'odette-room',
    hotspot: 'odette-purse',
    label: 'Odette’s purse',
    states: ['present', 'gone'],
    cues: ['take'],
    layer: layer('odette-purse', [0, 363, 88, 146]),
    gone: layer('odette-purse-gone', [0, 359, 92, 154]),
  },
  'prop-knife': {
    id: 'prop-knife',
    room: 'odette-room',
    hotspot: 'knife',
    label: 'The jewelled prop knife',
    states: ['loose', 'bagged'],
    cues: ['bag'],
    bag: { cx: 708, cy: 579, length: 226, width: 72, angle: -24 },
  },
  'vending-machine': {
    id: 'vending-machine',
    room: 'ice-alcove',
    hotspot: 'vending-machine',
    label: 'The vending machine',
    states: ['idle'],
    cues: ['dispense'],
    layer: layer('vending-machine', [1088, 0, 256, 768]),
    piece: layer('vending-pack', [1167, 407, 56, 61]),
  },
}

/** The delivery tray the pack drops into, in painting pixels. */
export const VENDING_TRAY: PaintingBox = [1122, 556, 113, 94]

export function toStageBox([x, y, w, h]: PaintingBox): StageBox {
  const r = (v: number) => Math.round(v * 10000) / 10000
  return {
    x: r((x / STAGE_WIDTH) * 100),
    y: r((y / STAGE_HEIGHT) * 100),
    w: r((w / STAGE_WIDTH) * 100),
    h: r((h / STAGE_HEIGHT) * 100),
  }
}

/** Every file the object layers draw. */
export function objectFiles(): string[] {
  const files = new Set<string>()
  for (const object of Object.values(STAGE_OBJECTS))
    for (const part of [object.layer, object.gone, object.behind, object.piece])
      if (part) files.add(part.src)
  return [...files].sort()
}

function has(state: CaseState, key: string): boolean {
  return (
    state.flags.includes(key) ||
    state.evidence.includes(key) ||
    state.inventory.includes(key)
  )
}

/**
 * An object's state from the case. `opened` lists objects opened on stage
 * this visit (Iris swinging the door she just unlocked), which the case only
 * records once she walks through it.
 */
export function objectState(
  id: StageObjectId,
  state: CaseState,
  opened: readonly StageObjectId[] = [],
): StageObjectState {
  switch (id) {
    case 'room-205-door':
      return has(state, 'crime-room-access') &&
        (has(state, 'double-murder-discovered') ||
          has(state, FIRE_ESCAPE_ENTRY) ||
          opened.includes(id))
        ? 'open'
        : 'closed'
    case 'odette-purse':
      return has(state, 'odette-purse') || has(state, 'violet-paid')
        ? 'gone'
        : 'present'
    case 'prop-knife':
      return has(state, 'knife-photo') ? 'bagged' : 'loose'
    case 'ice-machine':
    case 'vending-machine':
      return 'idle'
  }
}

/** The objects an edition draws in a room: only those it lets Iris reach. */
export function objectsInRoom(
  room: RoomId,
  audience: MonstriqueAudience,
): StageObject[] {
  const hotspots = new Set(
    roomForAudience(room, audience).hotspots.map((hotspot) => hotspot.id),
  )
  return Object.values(STAGE_OBJECTS).filter(
    (object) => object.room === room && hotspots.has(object.hotspot),
  )
}

export interface StageObjectView {
  object: StageObject
  state: StageObjectState
}
export function stageObjectViews(
  state: CaseState,
  audience: MonstriqueAudience,
  opened: readonly StageObjectId[] = [],
): StageObjectView[] {
  return objectsInRoom(state.room, audience).map((object) => ({
    object,
    state: objectState(object.id, state, opened),
  }))
}

/** A room's hotspots without the objects that have left the scene. */
export function stageHotspots(
  room: HotelRoom,
  state: CaseState,
): HotelHotspot[] {
  const gone = new Set(
    Object.values(STAGE_OBJECTS)
      .filter(
        (object) =>
          object.room === room.id && objectState(object.id, state) === 'gone',
      )
      .map((object) => object.hotspot),
  )
  return room.hotspots.filter((hotspot) => !gone.has(hotspot.id))
}

/** Iris's reach touches the object this far into the gesture. */
export const REACH_CONTACT_PHASE = 0.45
export const OBJECT_CONTACT_MS = Math.round(
  (IRIS_RIG.clips.reach?.durationMs ?? 0) * REACH_CONTACT_PHASE,
)
/** How long each cue's animation runs once it starts. */
export const CUE_MS: Record<StageObjectCue, number> = {
  'swing-open': 1100,
  shudder: 760,
  take: 900,
  bag: 700,
  dispense: 1300,
}
/** The ice machine clanks twice on its own every so often. */
export const ICE_CLANK_EVERY_MS = 9000

export interface ObjectCue {
  id: StageObjectId
  cue: StageObjectCue
  delayMs: number
  durationMs: number
}

function cue(id: StageObjectId, name: StageObjectCue): ObjectCue {
  return { id, cue: name, delayMs: 0, durationMs: CUE_MS[name] }
}

/** The object animations an action sets off, before timing. */
export function objectCues(
  action: ContactAction | null,
  previous: CaseState,
  next: CaseState,
  opened: readonly StageObjectId[] = [],
): ObjectCue[] {
  if (!action || previous.actor !== 'iris') return []
  const cues: ObjectCue[] = []
  if (
    action.target === 'room-door' &&
    action.verb === 'use' &&
    (!action.item || action.item === 'motel-key') &&
    has(previous, 'crime-room-access') &&
    objectState('room-205-door', previous, opened) === 'closed'
  )
    cues.push(cue('room-205-door', 'swing-open'))
  if (next === previous) return cues
  if (
    action.target === 'ice-machine' &&
    !action.item &&
    (action.verb === 'look' ||
      action.verb === 'use' ||
      action.verb === 'photograph')
  )
    cues.push(cue('ice-machine', 'shudder'))
  if (has(next, 'bought-protection') && !has(previous, 'bought-protection'))
    cues.push(cue('vending-machine', 'dispense'))
  for (const [id, name] of [
    ['odette-purse', 'take'],
    ['prop-knife', 'bag'],
  ] as const)
    if (objectState(id, previous) !== objectState(id, next))
      cues.push(cue(id, name))
  return cues
}

export interface InteractionBeat {
  gestures: Partial<Record<'iris' | 'norb', RigGesture>>
  cues: ObjectCue[]
}

/**
 * Everything the stage plays after one action: the leads' gestures and the
 * object cues, each cue timed to land when Iris's hand (or camera) reaches
 * the object. Under reduced motion cues are instant and have no animation.
 */
export function interactionBeat(
  action: ContactAction | null,
  previous: CaseState,
  next: CaseState,
  {
    opened = [],
    reducedMotion = false,
  }: { opened?: readonly StageObjectId[]; reducedMotion?: boolean } = {},
): InteractionBeat {
  const gestures = leadGestures(action, previous, next)
  const cues = objectCues(action, previous, next, opened)
  if (cues.length && gestures.iris === 'recoil' && previous.actor === 'iris')
    gestures.iris = 'reach'
  const reaching = gestures.iris === 'reach'
  return {
    gestures,
    cues: cues.map((item) =>
      reducedMotion
        ? { ...item, delayMs: 0, durationMs: 0 }
        : { ...item, delayMs: reaching ? OBJECT_CONTACT_MS : 0 },
    ),
  }
}
