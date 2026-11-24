// /utils/scripts/rainbowCampaignMatrix.ts
//
// Conductor rainbow t-013 (campaign QA): fly the real engine from a fresh start to THE END with the attract
// autopilot, for crews of one to four, two seeds, and two dock policies (let the dock launch itself, or launch
// from it as soon as A is allowed, which takes the X1 detour). Each run records the route graph it flew (Acts,
// detours, forks, road, choice), its rescues and how long it took. The autopilot never loses a ship, so this
// proves campaign continuity and branch coverage, not difficulty: that stays a human playtest question.
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { ROSEFIN } from '../arcade/games/rainbowRosefin'
import { emptyInput } from '../arcade/types'

export type CampaignRun = {
  crew: number
  seed: number
  dock: 'self' | 'early'
  reachedEnd: boolean
  frames: number
  minutes: number
  acts: string[]
  trenchRoute: string | null
  wreckRoute: string | null
  reefRoute: string | null
  allegiance: string | null
  stoodDown: boolean
  finalChoice: string | null
  rescues: string[]
  freedChoir: boolean
  cadetsHome: boolean
  lamps: number
  shoalFreed: boolean
  score: number
}

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/** Fly one fresh campaign to THE END (or the frame cap). */
export function flyCampaign(
  crew: number,
  seed: number,
  dock: 'self' | 'early',
  cap = 700000,
): CampaignRun {
  const game = createRainbowPrincessPreview({
    players: crew,
    demo: true,
    rng: seeded(seed),
    sound: { play() {} },
    hiScore: 0,
  })
  const acts: string[] = []
  let frame = 0
  for (; frame < cap && !game.over; frame++) {
    const input = emptyInput()
    if (dock === 'early')
      input.pressed.a = game.snapshot.docked === ROSEFIN.dockMinFrames - 1
    game.update(input)
    const act: string = game.snapshot.act
    if (acts.at(-1) !== act) acts.push(act)
  }
  const s = game.snapshot
  return {
    crew,
    seed,
    dock,
    reachedEnd: game.over && s.stage === 'end',
    frames: frame,
    minutes: Math.round((frame / 3600) * 10) / 10,
    acts,
    trenchRoute: s.trenchRoute,
    wreckRoute: s.wreckRoute,
    reefRoute: s.reefRoute,
    allegiance: s.allegiance,
    stoodDown: s.stoodDown,
    finalChoice: s.finalChoice,
    rescues: (
      [
        'rescuedStation',
        'rescuedNemi',
        'securedSalvage',
        'rescuedCourier',
        'freedDepot',
        'stoppedRelay',
        'rescuedNavigator',
      ] as const
    ).filter((flag) => s[flag]),
    freedChoir: s.freedChoir,
    cadetsHome: s.cadetsHome,
    lamps: s.lighthouseLamps.toString(2).replace(/0/g, '').length,
    shoalFreed: s.shoalGuardianOutcome === 'defeated',
    score: s.score,
  }
}

export const CAMPAIGN_CREWS = [1, 2, 3, 4] as const
export const CAMPAIGN_SEEDS = [7, 1234] as const
export const CAMPAIGN_DOCKS = ['self', 'early'] as const

/** The median of a list of numbers. */
export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2
}
