import type { FishingRegion, RunSave } from '~/types/ruler-hooked'

export const FISHING_LOCATIONS: Record<
  FishingRegion,
  { name: string; locked: string }
> = {
  lake: { name: 'Castle Lake', locked: '' },
  near_bank: {
    name: 'Reed Shallows',
    locked: 'Secure public berths, catch-and-release access or the family garden.',
  },
  far_shore: {
    name: 'Upstream Crossing',
    locked: 'Reopen the migration route. A blocked sluice closes this spot.',
  },
  village_edge: {
    name: 'Millrace Pools',
    locked: 'Open the fish ladder to anglers or establish a working waterfront.',
  },
  castle_grounds: {
    name: 'Castle Moat',
    locked: 'Settle the moat petition. A private water monopoly closes access.',
  },
}

export function isFishingRegion(value: unknown): value is FishingRegion {
  return typeof value === 'string' && Object.hasOwn(FISHING_LOCATIONS, value)
}

export function locationUnlocked(save: RunSave, region: FishingRegion): boolean {
  const f = save.flags
  switch (region) {
    case 'lake':
      return true
    case 'near_bank':
      return !f.coveClosed && !f.exclusivePier &&
        !!(f.villageBerths || f.catchRelease || f.newlywedsGarden ||
          f.workingWaterfront || f.marinaRestored)
    case 'far_shore':
      return !f.runBlocked && !f.runStillBlocked &&
        !!(f.sluiceOpened || f.riverCommons || f.riverConcession)
    case 'village_edge':
      return !f.waterMonopoly &&
        !!(f.ladderSpot || f.workingWaterfront || f.riverConcession)
    case 'castle_grounds':
      return !f.waterMonopoly &&
        !!(f.poachersFined || f.poacherKeepers || f.moatHonour ||
          f.moatFishedOut || f.moatRestored)
  }
}
