import type { RunSave } from '~/types/ruler-hooked'
import { startFishingEncounter } from './encounter'

export type SimpleFishingStage = 'CAST' | 'HOOK' | 'REEL' | 'LANDED' | 'ESCAPED'
export type ReelInput = 'TAP' | 'RELEASE'

export interface SimpleFishingEncounter {
  fishSlug: string
  fishName: string
  catchBehavior: string
  rarity: string
  affinity: string
  stage: SimpleFishingStage
  stops: number[]
  progress: number
  tension: number
  cue: string
  actions: ReelInput[]
}

const clamp = (value: number): number => Math.max(0, Math.min(100, value))

export function startSimpleFishing(save: RunSave): SimpleFishingEncounter {
  const fish = startFishingEncounter(save)
  return {
    fishSlug: fish.fishSlug,
    fishName: fish.fishName,
    catchBehavior: fish.catchBehavior,
    rarity: fish.rarity,
    affinity: fish.affinity,
    stage: 'CAST',
    stops: [],
    progress: 0,
    tension: 0,
    cue: 'Stop the moving marker once to cast. Then stop it again when the fish bites.',
    actions: [],
  }
}

export function applySimpleFishingStop(
  state: SimpleFishingEncounter,
  position: number,
): SimpleFishingEncounter {
  if (state.stage !== 'CAST' && state.stage !== 'HOOK') return state
  const stop = clamp(Number.isFinite(position) ? position : 0)
  const stops = [...state.stops, stop]
  if (state.stage === 'CAST') {
    return {
      ...state,
      stops,
      stage: 'HOOK',
      cue: 'Cast away. The water ripples. Stop the marker again to set the hook.',
    }
  }
  const firstQuality = 1 - Math.min(1, Math.abs(stops[0]! - 50) / 50)
  const secondQuality = 1 - Math.min(1, Math.abs(stop - 50) / 50)
  return {
    ...state,
    stops,
    stage: 'REEL',
    progress: Math.round(10 + 20 * (firstQuality + secondQuality) / 2),
    tension: 15,
    cue: 'Hooked! Tap REEL to pull. Tap GIVE SLACK whenever tension climbs above 65%.',
  }
}

export function applySimpleReel(
  state: SimpleFishingEncounter,
  action: ReelInput,
): SimpleFishingEncounter {
  if (state.stage !== 'REEL') return state
  const actions = [...state.actions, action]
  if (action === 'RELEASE') {
    return {
      ...state,
      actions,
      tension: clamp(state.tension - 34),
      progress: clamp(state.progress - 2),
      cue: 'The line relaxes. Keep reeling when you are ready.',
    }
  }
  const progress = clamp(state.progress + 13)
  const tension = clamp(state.tension + 19)
  if (progress >= 100) {
    return {
      ...state,
      actions,
      progress: 100,
      tension,
      stage: 'LANDED',
      cue: state.fishName + ' lands in the net!',
    }
  }
  if (tension >= 100) {
    return {
      ...state,
      actions,
      progress,
      tension,
      stage: 'ESCAPED',
      cue: 'The line snaps! Give slack before the tension reaches 100%.',
    }
  }
  return {
    ...state,
    actions,
    progress,
    tension,
    cue: tension >= 65
      ? 'The line is taut. Tap GIVE SLACK now.'
      : 'Good pull. Keep reeling, or give slack to lower tension.',
  }
}

export function simpleFishingFinished(state: SimpleFishingEncounter): boolean {
  return state.stage === 'LANDED' || state.stage === 'ESCAPED'
}
