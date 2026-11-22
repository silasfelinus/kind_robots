import {
  isCrewTellKind,
  type CrewTellKind,
  type CrewTellReceipt,
} from './crewTelegraphArt'

/** Private original combat paintings. IDs are immutable ledger receipts, not public URLs. */
export type CrewCombatPose = 'idle' | 'strike' | 'hit' | 'defeat'

export const CREW_COMBAT_POSES: readonly CrewCombatPose[] = [
  'idle',
  'strike',
  'hit',
  'defeat',
]

export const CREW_COMBAT_ART: Readonly<
  Record<CrewTellKind, Record<CrewCombatPose, CrewTellReceipt>>
> = {
  burrow: {
    idle: {
      artKey: 'every-villain-tactics/henchmen/accident-earth/combat/idle',
      jobId: 76658,
      imageId: 278823,
      title: 'Warren Wreckers idle pose',
    },
    strike: {
      artKey: 'every-villain-tactics/henchmen/accident-earth/combat/strike',
      jobId: 76659,
      imageId: 278824,
      title: 'Warren Wreckers strike pose',
    },
    hit: {
      artKey: 'every-villain-tactics/henchmen/accident-earth/combat/hit',
      jobId: 76660,
      imageId: 278825,
      title: 'Warren Wreckers hit pose',
    },
    defeat: {
      artKey: 'every-villain-tactics/henchmen/accident-earth/combat/defeat',
      jobId: 76661,
      imageId: 278826,
      title: 'Warren Wreckers defeat pose',
    },
  },
  phase: {
    idle: {
      artKey: 'every-villain-tactics/henchmen/alien-discipline/combat/idle',
      jobId: 76662,
      imageId: 278827,
      title: 'Clockwork Wombat Ronin idle pose',
    },
    strike: {
      artKey: 'every-villain-tactics/henchmen/alien-discipline/combat/strike',
      jobId: 76663,
      imageId: 278828,
      title: 'Clockwork Wombat Ronin strike pose',
    },
    hit: {
      artKey: 'every-villain-tactics/henchmen/alien-discipline/combat/hit',
      jobId: 76664,
      imageId: 278829,
      title: 'Clockwork Wombat Ronin hit pose',
    },
    defeat: {
      artKey: 'every-villain-tactics/henchmen/alien-discipline/combat/defeat',
      jobId: 76665,
      imageId: 278830,
      title: 'Clockwork Wombat Ronin defeat pose',
    },
  },
  windup: {
    idle: {
      artKey: 'every-villain-tactics/henchmen/accident-birthright/combat/idle',
      jobId: 76666,
      imageId: 278831,
      title: 'Licensed Legends idle pose',
    },
    strike: {
      artKey:
        'every-villain-tactics/henchmen/accident-birthright/combat/strike',
      jobId: 76667,
      imageId: 278832,
      title: 'Licensed Legends strike pose',
    },
    hit: {
      artKey: 'every-villain-tactics/henchmen/accident-birthright/combat/hit',
      jobId: 76668,
      imageId: 278833,
      title: 'Licensed Legends hit pose',
    },
    defeat: {
      artKey:
        'every-villain-tactics/henchmen/accident-birthright/combat/defeat',
      jobId: 76669,
      imageId: 278834,
      title: 'Licensed Legends defeat pose',
    },
  },
}

export function crewCombatReceipt(
  unit: {
    id: string
    hp: number
    maxHp: number
    henchmanType?: string | null
    lieutenantName?: string
  },
  impact: {
    attacker?: string
    target?: string
    hit?: boolean
  } | null = null,
): CrewTellReceipt | null {
  if (
    unit.maxHp !== 1 ||
    unit.lieutenantName ||
    !isCrewTellKind(unit.henchmanType)
  )
    return null
  const pose: CrewCombatPose =
    impact?.attacker === unit.id
      ? 'strike'
      : impact?.target === unit.id && impact.hit
        ? 'hit'
        : unit.hp <= 0
          ? 'defeat'
          : 'idle'
  return CREW_COMBAT_ART[unit.henchmanType][pose]
}
