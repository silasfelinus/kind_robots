import { henchmanForVillain } from '../cometAcademy/villainHenchmen'
import type { SignaturePowerId } from '../cometAcademy/specialPowers'

/**
 * Exact private ArtJob/ArtImage receipts recorded by
 * conductor/projects/every-villain-tactics/art/ONE-HIT-CREW-TELEGRAPHS-2026-11-20.yaml.
 * DONE is a ledger status, not an approved composition or verified media download.
 * Use the authenticated tactics art store to retrieve each image at runtime.
 * Do not copy private images to public/ or expose access tokens in asset URLs.
 */
export type CrewTellKind = 'burrow' | 'phase' | 'windup'
export type CrewTellBeat = 'warning' | 'action' | 'counter' | 'captain'

export type CrewTellReceipt = {
  artKey: string
  jobId: number
  imageId: number
  title: string
}

export const CREW_TELL_BEATS: readonly CrewTellBeat[] = [
  'warning',
  'action',
  'counter',
  'captain',
]

export const CREW_TELL_ART: Readonly<
  Record<
    CrewTellKind,
    { name: string; beats: Record<CrewTellBeat, CrewTellReceipt> }
  >
> = {
  burrow: {
    name: 'Warren Wreckers',
    beats: {
      warning: {
        artKey:
          'every-villain-tactics/henchmen/accident-earth/tells/burrow-warning',
        jobId: 74393,
        imageId: 277786,
        title: 'Dust ring: emergence next turn',
      },
      action: {
        artKey:
          'every-villain-tactics/henchmen/accident-earth/tells/burrow-emergence',
        jobId: 74394,
        imageId: 277787,
        title: 'Warren Wreckers tunnel upward',
      },
      counter: {
        artKey:
          'every-villain-tactics/henchmen/accident-earth/tells/burrow-blocked',
        jobId: 74395,
        imageId: 277788,
        title: 'Stand on the ring to block emergence',
      },
      captain: {
        artKey:
          'every-villain-tactics/henchmen/accident-earth/tells/foreman-closeup',
        jobId: 74396,
        imageId: 277789,
        title: 'Foreman Thumpkin',
      },
    },
  },
  phase: {
    name: 'Clockwork Wombat Ronin',
    beats: {
      warning: {
        artKey:
          'every-villain-tactics/henchmen/alien-discipline/tells/phase-warning',
        jobId: 74397,
        imageId: 277790,
        title: 'Clock-face exit: teleport next turn',
      },
      action: {
        artKey:
          'every-villain-tactics/henchmen/alien-discipline/tells/phase-arrival',
        jobId: 74398,
        imageId: 277791,
        title: 'Ronin emerge from a clock portal',
      },
      counter: {
        artKey:
          'every-villain-tactics/henchmen/alien-discipline/tells/phase-interrupted',
        jobId: 74399,
        imageId: 277792,
        title: 'Occupy the exit to jam the portal',
      },
      captain: {
        artKey:
          'every-villain-tactics/henchmen/alien-discipline/tells/teakettle-closeup',
        jobId: 74400,
        imageId: 277793,
        title: 'Lieutenant Teakettle',
      },
    },
  },
  windup: {
    name: 'Licensed Legends',
    beats: {
      warning: {
        artKey:
          'every-villain-tactics/henchmen/accident-birthright/tells/seal-warning',
        jobId: 74401,
        imageId: 277794,
        title: 'Power seal: step clear of the toys',
      },
      action: {
        artKey:
          'every-villain-tactics/henchmen/accident-birthright/tells/windup-swarm',
        jobId: 74402,
        imageId: 277795,
        title: 'Wind-up mascots swarm the aisle',
      },
      counter: {
        artKey:
          'every-villain-tactics/henchmen/accident-birthright/tells/seal-broken',
        jobId: 74403,
        imageId: 277796,
        title: 'Break the seal to restore powers',
      },
      captain: {
        artKey:
          'every-villain-tactics/henchmen/accident-birthright/tells/sir-cap-closeup',
        jobId: 74404,
        imageId: 277797,
        title: 'Sir Cap-Permission',
      },
    },
  },
}

export function isCrewTellKind(kind: unknown): kind is CrewTellKind {
  return (
    typeof kind === 'string' &&
    Object.prototype.hasOwnProperty.call(CREW_TELL_ART, kind)
  )
}

export function crewTellReceipt(
  kind: string | null | undefined,
  beat: CrewTellBeat,
): CrewTellReceipt | null {
  return isCrewTellKind(kind) ? CREW_TELL_ART[kind].beats[beat] : null
}

/**
 * Bind original captain closeups to the exact canonical one-hit species
 * captain, never a generic rank, powered hero, or multi-hit lieutenant.
 * Canonical names come from the same SPECIES catalog that seeds battle units.
 */
const CREW_CAPTAIN_SIGNATURE: Readonly<Record<CrewTellKind, SignaturePowerId>> =
  {
    burrow: 'accident-earth',
    phase: 'alien-discipline',
    windup: 'accident-birthright',
  }

export function crewCaptainArtReceipt(unit: {
  henchmanType?: string | null
  henchmanName?: string
  lieutenantName?: string
  maxHp: number
}): CrewTellReceipt | null {
  if (
    unit.maxHp !== 1 ||
    unit.lieutenantName ||
    !isCrewTellKind(unit.henchmanType)
  )
    return null
  const captain = henchmanForVillain(
    CREW_CAPTAIN_SIGNATURE[unit.henchmanType],
  ).captain
  return unit.henchmanName === captain
    ? CREW_TELL_ART[unit.henchmanType].beats.captain
    : null
}

export function crewUnitArtReceipt(unit: {
  henchmanType?: string | null
  henchmanName?: string
  lieutenantName?: string
  maxHp: number
}): CrewTellReceipt | null {
  if (unit.maxHp !== 1 || unit.lieutenantName) return null
  return (
    crewCaptainArtReceipt(unit) ?? crewTellReceipt(unit.henchmanType, 'action')
  )
}
