import { campaignStagesFor } from './identityCampaignStages'
import type { SignaturePowerId } from './specialPowers'
import type { Point, Tile } from '../everyVillainTactics/combat'
import type { StageDraft } from '../everyVillainTactics/studio'

export type RivalArena = {
  stage: StageDraft
  objectivePoint: Point
  secretPoint: Point
  shiftPoint: Point
  opening: string
  turningPoint: string
  secret: string
  lieutenantAgenda: string
}

/** Six origin-specific battlefield silhouettes. No square may isolate the
 * left-hand squad from the right-hand antagonist or obstruct a spawn. */
const ORIGIN_WALLS: Readonly<Record<string, readonly [number, number][]>> = {
  accident: [
    [3, 1],
    [5, 4],
  ],
  mutant: [
    [4, 1],
    [4, 4],
  ],
  tech: [
    [3, 2],
    [5, 2],
  ],
  magic: [
    [4, 2],
    [6, 3],
  ],
  alien: [
    [3, 3],
    [5, 1],
  ],
  psychic: [
    [4, 3],
    [6, 1],
  ],
}

const AFFINITIES = [
  'fire',
  'air',
  'earth',
  'water',
  'discipline',
  'genius',
  'birthright',
  'social',
] as const
const ORIGINS = [
  'accident',
  'mutant',
  'tech',
  'magic',
  'alien',
  'psychic',
] as const

const KEY = (p: Point) => p.x + ',' + p.y
const tile = (cover?: Tile['cover'], elevation = 0): Tile => ({
  elevation,
  ...(cover ? { cover } : {}),
})
const POSITIONS = [
  { x: 2, y: 1 },
  { x: 2, y: 3 },
  { x: 3, y: 4 },
  { x: 4, y: 0 },
  { x: 4, y: 5 },
  { x: 5, y: 3 },
  { x: 6, y: 2 },
  { x: 6, y: 4 },
  { x: 7, y: 2 },
  { x: 3, y: 0 },
  { x: 5, y: 0 },
  { x: 6, y: 5 },
]
const SPAWNS = [
  { id: 'backdraft', x: 0, y: 4 },
  { id: 'priya', x: 1, y: 5 },
  { id: 'hattie', x: 0, y: 2 },
  { id: 'pip', x: 7, y: 1 },
  { id: 'vee', x: 8, y: 3 },
  { id: 'remy', x: 7, y: 4 },
]

/** The two axes together determine a distinct traversable geometry for all 48
 * canonical villains. Existing authored stage text supplies the character-
 * specific reason these physical structures matter. */
export function rivalArenaFor(signature: SignaturePowerId): RivalArena {
  return buildArena(signature, 'lair')
}

export function originArenaFor(signature: SignaturePowerId): RivalArena {
  return buildArena(signature, 'origin')
}

function buildArena(
  signature: SignaturePowerId,
  kind: 'lair' | 'origin',
): RivalArena {
  const [origin, affinity] = signature.split('-')
  const originIndex = ORIGINS.indexOf(origin as (typeof ORIGINS)[number])
  const affinityIndex = AFFINITIES.indexOf(
    affinity as (typeof AFFINITIES)[number],
  )
  if (originIndex < 0 || affinityIndex < 0)
    throw new Error('Unknown rival arena')
  const campaign = campaignStagesFor(signature)
  const phaseOffset = kind === 'origin' ? 3 : 0
  const blocked = new Set(
    (ORIGIN_WALLS[origin] ?? []).map(([x, y]) => x + ',' + y),
  )
  // A third distinctive blocker never seals off the two armies.
  const extra = [
    { x: 3, y: 0 },
    { x: 4, y: 5 },
    { x: 5, y: 0 },
    { x: 3, y: 5 },
  ][(originIndex + affinityIndex + phaseOffset) % 4]!
  blocked.add(KEY(extra))
  const objectivePoint = {
    x: 4 + ((affinityIndex + phaseOffset) % 3),
    y: 1 + ((originIndex + phaseOffset) % 4),
  }
  if (blocked.has(KEY(objectivePoint))) blocked.delete(KEY(objectivePoint))
  const secretPoint = {
    x: 2 + ((originIndex + phaseOffset) % 2),
    y: 2 + ((affinityIndex + phaseOffset) % 3),
  }
  if (blocked.has(KEY(secretPoint))) blocked.delete(KEY(secretPoint))
  const shiftPoint = {
    x: 4 + ((originIndex + phaseOffset) % 2),
    y: (affinityIndex + phaseOffset) % 2 ? 4 : 1,
  }
  if (blocked.has(KEY(shiftPoint))) blocked.delete(KEY(shiftPoint))

  const tiles: Record<string, Tile> = {}
  for (const key of blocked) tiles[key] = { elevation: 0, wall: true }
  for (let i = 0; i < 5; i++) {
    const point =
      POSITIONS[
        (i * 2 + originIndex + affinityIndex * 3 + phaseOffset) %
          POSITIONS.length
      ]!
    const key = KEY(point)
    if (
      blocked.has(key) ||
      key === KEY(objectivePoint) ||
      key === KEY(secretPoint)
    )
      continue
    tiles[key] = tile(
      i % 2 === 0 ? { north: 'half', west: 'half' } : { east: 'full' },
      i === 3 ? 1 : 0,
    )
  }
  const rise =
    POSITIONS[
      (originIndex * 5 + affinityIndex + phaseOffset) % POSITIONS.length
    ]!
  if (!blocked.has(KEY(rise)) && KEY(rise) !== KEY(objectivePoint))
    tiles[KEY(rise)] = tile(undefined, 1)
  if (!blocked.has(KEY(shiftPoint)))
    tiles[KEY(shiftPoint)] = tile({ west: 'half' })

  const stage: StageDraft = {
    version: 1,
    id: (kind === 'origin' ? 'hero-origin-' : 'rival-lair-') + signature,
    title: kind === 'origin' ? campaign.opening.title : campaign.lair.title,
    venue: kind === 'origin' ? campaign.opening.venue : campaign.lair.venue,
    objective:
      kind === 'origin' ? campaign.opening.inciting : campaign.lair.objective,
    map: { width: 9, height: 6, tiles },
    spawns: SPAWNS.map((spawn) => ({ ...spawn })),
    secrets: [secretPoint],
    hazards: [shiftPoint],
    turnLimit: 12 - (affinityIndex % 3),
  }
  return {
    stage,
    objectivePoint,
    secretPoint,
    shiftPoint,
    opening:
      kind === 'origin' ? campaign.opening.powerUse : campaign.lair.arena,
    turningPoint:
      kind === 'origin' ? campaign.opening.inciting : campaign.lieutenant.power,
    secret: kind === 'origin' ? campaign.opening.choice : campaign.lair.secret,
    lieutenantAgenda:
      kind === 'origin'
        ? campaign.opening.powerUse
        : campaign.lieutenant.agenda,
  }
}

/** Turn-three scripted environmental transformation; no wall can suddenly
 * seal an exit. Change geometry used by the actual hit/cover calculations. */
export function shiftRivalArena(
  arena: RivalArena,
  stage: StageDraft,
): StageDraft {
  const point = arena.shiftPoint
  const key = KEY(point)
  const tiles = { ...stage.map.tiles }
  const old = tiles[key] ?? { elevation: 0 }
  tiles[key] = {
    elevation: old.elevation === 0 ? 1 : 0,
    cover: old.cover?.west ? { east: 'full' } : { west: 'half' },
  }
  return { ...stage, map: { ...stage.map, tiles } }
}
