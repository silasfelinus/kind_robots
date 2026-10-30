import { campaignStagesFor } from '../cometAcademy/identityCampaignStages'
import type { SignaturePowerId } from '../cometAcademy/specialPowers'
import { inside, tileAt, type Point, type TacticalMap } from './combat'

export type SignatureThreat = {
  name: string
  power: string
  counter: string
  attack: string
  counterVerb: string
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
const ORIGIN_SIGNALS: Record<string, Point> = {
  accident: { x: 1, y: 0 },
  mutant: { x: -1, y: 0 },
  tech: { x: 0, y: 1 },
  magic: { x: 0, y: -1 },
  alien: { x: 2, y: 0 },
  psychic: { x: 0, y: 2 },
}
const COUNTER_VERBS: Record<string, string> = {
  accident: 'Override the damaged relay',
  mutant: 'Ground the unstable growth',
  tech: 'Disconnect the control console',
  magic: 'Break the marked sigil',
  alien: 'Reverse the field polarity',
  psychic: 'Silence the psychic amplifier',
}
const ATTACK_NAMES = [
  'Fireline',
  'Pressure Column',
  'Ground Zero',
  'Crosscurrent',
  'Precision Cross',
  'Containment Ring',
  'Crownfall',
  'Chain Reaction',
] as const

/** A lieutenant's named canonical motive remains individual. Their affinity
 * controls eight mechanically different footprints, while origin controls six
 * different counter locations and actions. No new alias or identity is minted. */
export function signatureThreatFor(signature: SignaturePowerId): SignatureThreat {
  const stages = campaignStagesFor(signature)
  const [origin, affinity] = signature.split('-')
  const index = AFFINITIES.indexOf(affinity as (typeof AFFINITIES)[number])
  if (index < 0 || !ORIGIN_SIGNALS[origin!]) {
    throw new Error('Unknown lieutenant signature: ' + signature)
  }
  return {
    name: stages.lieutenant.name,
    power: stages.lieutenant.power,
    counter: stages.lieutenant.counter,
    attack: ATTACK_NAMES[index]!,
    counterVerb: COUNTER_VERBS[origin!]!,
  }
}

/** The cells shown to the player are exactly the ones the deterministic AI
 * will damage on its next activation. Walls block explosions but never hide
 * telegraphed damage behind an RNG roll. */
export function signatureThreatCells(
  map: TacticalMap,
  signature: SignaturePowerId,
  target: Point,
): Point[] {
  const affinity = signature.split('-')[1]!
  const marked: Point[] = []
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const dx = Math.abs(x - target.x)
      const dy = Math.abs(y - target.y)
      const match =
        affinity === 'fire'
          ? dy === 0
          : affinity === 'air'
            ? dx === 0
            : affinity === 'earth'
              ? Math.max(dx, dy) <= 1
              : affinity === 'water'
                ? dx === dy && dx <= 3
                : affinity === 'discipline'
                  ? (dx === 0 && dy <= 2) || (dy === 0 && dx <= 2)
                  : affinity === 'genius'
                    ? Math.max(dx, dy) === 2 || (dx === 0 && dy === 0)
                    : affinity === 'birthright'
                      ? (dx === 1 && dy === 1) || (dx === 0 && dy === 0)
                      : (dx === 2 && dy === 1) ||
                        (dx === 1 && dy === 2) ||
                        (dx === 0 && dy === 0)
      if (match && !tileAt(map, { x, y }).wall) marked.push({ x, y })
    }
  }
  return marked
}

export function signatureCounterPoint(
  map: TacticalMap,
  signature: SignaturePowerId,
  target: Point,
): Point {
  const origin = signature.split('-')[0]!
  const preferred = ORIGIN_SIGNALS[origin]
  if (!preferred) throw new Error('Unknown signal origin: ' + origin)
  const candidates: Point[] = [
    { x: target.x + preferred.x, y: target.y + preferred.y },
    { x: target.x - preferred.x, y: target.y - preferred.y },
    { x: target.x + preferred.y, y: target.y - preferred.x },
    { x: target.x - preferred.y, y: target.y + preferred.x },
    target,
  ]
  return candidates.find((p) => inside(map, p) && !tileAt(map, p).wall) ?? target
}
