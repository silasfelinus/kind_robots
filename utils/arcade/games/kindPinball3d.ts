// /utils/arcade/games/kindPinball3d.ts
//
// Kind Pinball 3D (conductor kind-pinball/t-004): the arcade adapter for the
// Three.js + Rapier pinball runtime. It is the hall's Kind Pinball
// (t-024); a device without WebGL plays the Canvas 2D table instead
// (utils/arcade/games.ts).
//
// Three.js and Rapier are only ever loaded through this module, which the
// arcade registry imports lazily, so no other page pays for them.

import RAPIER from '@dimforge/rapier3d-compat'
import type { ArcadeGameModule } from '../types'
import { pinballGuide } from '../pinball/guide'
import { PinballRuntime } from '../pinball/runtime'
import { AMI_VILLAGE_GREYBOX } from '../pinball/tables/amiVillage/table'

let ready: Promise<void> | null = null

/** Initialise Rapier's WASM once; the registry awaits this before create(). */
export function prepare(): Promise<void> {
  ready ??= RAPIER.init()
  return ready
}

const kindPinball3d: ArcadeGameModule = {
  create: (options) => new PinballRuntime(options, RAPIER, AMI_VILLAGE_GREYBOX),
  guide: (earned) => pinballGuide(earned, AMI_VILLAGE_GREYBOX),
}

export const create = kindPinball3d.create
export const guide = kindPinball3d.guide
export default kindPinball3d
