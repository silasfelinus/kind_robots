import RAPIER from '@dimforge/rapier3d-compat'
import type { ArcadeGameModule } from '../types'
import { PinballRuntime } from '../pinball/runtime'
import { ZUZU_RULESET } from '../pinball/tables/zuzuLastBell/rules'
import { ZUZU_LAST_BELL_GREYBOX } from '../pinball/tables/zuzuLastBell/table'

let ready: Promise<void> | null = null

export function prepare(): Promise<void> {
  ready ??= RAPIER.init()
  return ready
}

const zuzuPinball: ArcadeGameModule = {
  create: (options) =>
    new PinballRuntime(
      options,
      RAPIER,
      ZUZU_LAST_BELL_GREYBOX,
      undefined,
      ZUZU_RULESET,
    ),
  guide: () => [
    {
      title: 'THE LAST BELL',
      lines: [
        'ARROWS = FLIPPERS',
        'DOWN = HOLD PLUNGER',
        'RELEASE TO LAUNCH',
        'UP = NUDGE',
        'B = CAMERA VIEW',
      ],
      scale: 1,
    },
    {
      title: 'FIVE SEALS',
      lines: [
        'MORTUARY TELLS A CHAPTER',
        'HIT ITS BLINKING SHOTS',
        'FINISH ONE TO BREAK A SEAL',
        'BELL LANE REOPENS IT',
        'SOFT PLUNGE: SKILL SHOT',
      ],
      scale: 1,
    },
    {
      title: 'RIVER CROC',
      lines: [
        'THE RIVER CROC ALWAYS PAYS',
        'FIVE SWALLOWS: EXTRA BALL',
        'ABBEY SEALS: BONUS X',
        'SEALS DOWN: STRIKE THE RELIC',
        'RAMPS AND ORBITS COMBO',
      ],
      scale: 1,
    },
    {
      title: 'HARVEST MOON',
      lines: [
        'VILLAGE RAMP LIGHTS LOCK',
        'BELL LANE: THE CITADEL',
        'LOCK 3 FOR MULTIBALL',
        'RAMPS TRADE JACKPOTS',
        'ORBIT COMBO: SUPER',
      ],
      scale: 1,
    },
    {
      title: 'STORM AND BELL',
      lines: [
        'SEALS, THEN BOTH ORBITS',
        'STORM CROW: FOUR BALLS',
        'EVERY LANE A LADDER',
        'FIFTH SEAL: LAST BELL',
        'SIX BALLS, ALL JACKPOTS',
      ],
      scale: 1,
    },
    {
      title: 'WATERING HOLE',
      lines: [
        'FEED HIM IN HOMESTEAD',
        'THE COYOTE COMES TO DRINK',
        'ORBIT, THEN FEED THE CROC',
        'DEATH ROLL JACKPOT',
        'EACH ONE BIGGER, QUICKER',
      ],
      scale: 1,
    },
  ],
}

export const create = zuzuPinball.create
export const guide = zuzuPinball.guide
export default zuzuPinball
