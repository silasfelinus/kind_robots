import type { RainbowCheckpoint } from './rainbowCheckpoints'
import type { RainbowHangar } from './rainbowHangar'
import type { RainbowSave } from './rainbowLoadouts'

type Act = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/**
 * Only completed Acts are replayable. Mastery is account-wide, so it cannot
 * unlock another save slot; medals and the actual slot checkpoint can.
 */
export function canReplayRainbowAct(
  act: number,
  save: RainbowSave | null,
  hangar: RainbowHangar,
): boolean {
  if (!Number.isInteger(act) || act < 1 || act > 8) return false
  const cleared = act as Act
  return Boolean(
    hangar.medals[cleared] ||
    save?.medals[cleared] ||
    (save && save.checkpoint.act > act),
  )
}

/**
 * An isolated Act replay is not a campaign continuation. Carry over only
 * decisions made BEFORE the selected Act; its rescue/fork state begins fresh.
 * This never mutates the original checkpoint, medals, or save-slot object.
 */
export function rainbowActReplaySave(
  act: number,
  save: RainbowSave | null,
  hangar: RainbowHangar,
): RainbowSave | null {
  if (!canReplayRainbowAct(act, save, hangar)) return null

  const target = act as Act
  const c = save?.checkpoint
  const prior = (completedAct: number) => act > completedAct
  const checkpoint: RainbowCheckpoint = {
    act: target,
    frame: 0,
    score: 0,
    rescuedStation: prior(1) && (c?.rescuedStation ?? false),
    rescuedNemi: prior(2) && (c?.rescuedNemi ?? false),
    trenchRoute: prior(3) ? (c?.trenchRoute ?? null) : null,
    routeSettled: prior(3) && (c?.routeSettled ?? false),
    nurseryGuardianOutcome: prior(3)
      ? (c?.nurseryGuardianOutcome ?? 'escaped')
      : 'waiting',
    freedChoir: prior(3) && (c?.freedChoir ?? false),
    rescuedCourier: prior(4) && (c?.rescuedCourier ?? false),
    cadetsHome: prior(4) && (c?.cadetsHome ?? false),
    wreckRoute: prior(5) ? (c?.wreckRoute ?? null) : null,
    armoryGuardianOutcome: prior(5)
      ? (c?.armoryGuardianOutcome ?? 'escaped')
      : 'waiting',
    wreckSettled: prior(5) && (c?.wreckSettled ?? false),
    podsSaved: prior(5) ? (c?.podsSaved ?? 0) : 0,
    reefRoute: prior(6) ? (c?.reefRoute ?? null) : null,
    reefSettled: prior(6) && (c?.reefSettled ?? false),
    pylonsDown: prior(6) ? (c?.pylonsDown ?? 0) : 0,
    pearlWardenOutcome: prior(6)
      ? (c?.pearlWardenOutcome ?? 'escaped')
      : 'waiting',
    rescuedNavigator: prior(7) && (c?.rescuedNavigator ?? false),
    // A replay is a fresh Act, even when the source slot has spent continues.
    // The clean-flight X4 entrance must not be disqualified on arrival.
    actContinues: 0,
    captivesFreed: 0,
    allegiance: prior(5) ? (c?.allegiance ?? null) : null,
    schoolBonuses: 0,
  }
  const guardians: RainbowSave['guardians'] = {}
  for (let previous = 1; previous < act; previous++) {
    const result = save?.guardians[previous as Act]
    if (result) guardians[previous as Act] = result
  }
  return {
    v: 1,
    difficulty: save?.difficulty ?? 'normal',
    checkpoint,
    guardians,
    medals: {},
    ...(save?.pilot !== undefined ? { pilot: save.pilot } : {}),
    ...(save?.pilots ? { pilots: [...save.pilots] } : {}),
  }
}
