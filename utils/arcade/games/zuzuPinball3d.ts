import RAPIER from '@dimforge/rapier3d-compat'
import type { ArcadeGameModule } from '../types'
import { PinballRuntime } from '../pinball/runtime'
import { ZUZU_LAST_BELL_GREYBOX } from '../pinball/tables/zuzuLastBell/table'

let ready: Promise<void> | null = null

export function prepare(): Promise<void> {
  ready ??= RAPIER.init()
  return ready
}

const zuzuPinball: ArcadeGameModule = {
  create: (options) => new PinballRuntime(options, RAPIER, ZUZU_LAST_BELL_GREYBOX),
  guide: () => [
    {
      title: 'THE LAST BELL',
      lines: [
        'PRIVATE ENGINEERING TABLE',
        'ARROWS = FLIPPERS',
        'DOWN = HOLD PLUNGER',
        'RELEASE TO LAUNCH',
        'UP = NUDGE',
        'B = CAMERA VIEW',
      ],
      scale: 1,
    },
    {
      title: 'THE WATER HAS TEETH',
      lines: [
        'LEFT BANK: RIVER CROC',
        'AIM INTO THE OPEN MOUTH',
        'CAPTURE THEN SAFE EJECT',
        'CENTER: ABBEY BELL',
        'THIS IS PHYSICS GREYBOX',
        'RULES AND ART IN PROGRESS',
      ],
      scale: 1,
    },
  ],
}

export const create = zuzuPinball.create
export const guide = zuzuPinball.guide
export default zuzuPinball
