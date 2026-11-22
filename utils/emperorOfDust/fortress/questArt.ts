// Quest images (conductor projects/emperor-of-dust/art/QUESTS-ROUND-1.yaml): a
// notice that presents each quest, and a success and a failure scene for the
// dawn report. Each listed asset is a file at
// public/emperor-of-dust/quests/<asset>.webp; until a quest's art is exported
// the game shows Silas's painted map, cropped around the quest's region.

import { emperorMediaArtUrl } from './artDelivery'
import { QUEST_OUTCOME_PLATES } from './deliveredPlates'
import { REGIONS } from './factions'
import type { QuestResultTier } from './types'

export type QuestArtVariant = 'notice' | 'success' | 'failure'

export const QUEST_ART: readonly string[] = [
  'q-d01-well-road',
  'q-d01-well-road-success',
  'q-d01-well-road-failure',
  'q-d01-aqueduct-repair',
  'q-d01-aqueduct-repair-success',
  'q-d01-aqueduct-repair-failure',
  'q-d01-toll-parley',
  'q-d01-toll-parley-success',
  'q-d01-toll-parley-failure',
  'q-d01-toll-break',
  'q-d01-toll-break-success',
  'q-d01-toll-break-failure',
  'q-d01-mirefen-escort',
  'q-d01-mirefen-escort-success',
  'q-d01-mirefen-escort-failure',
  'q-d01-mirefen-inspect',
  'q-d01-mirefen-inspect-success',
  'q-d01-mirefen-inspect-failure',
  'q-d02-grain-cart',
  'q-d02-grain-cart-success',
  'q-d02-grain-cart-failure',
  'q-d02-crow-contract',
  'q-d02-crow-contract-success',
  'q-d02-crow-contract-failure',
  'q-d02-mole-audit',
  'q-d02-mole-audit-success',
  'q-d02-mole-audit-failure',
  'q-d03-three-wells',
  'q-d03-three-wells-success',
  'q-d03-three-wells-failure',
  'q-d03-bell-vigil',
  'q-d03-bell-vigil-success',
  'q-d03-bell-vigil-failure',
  'q-d03-bell-search',
  'q-d03-bell-search-success',
  'q-d03-bell-search-failure',
  'q-d03-toll-audit',
  'q-d03-toll-audit-success',
  'q-d03-toll-audit-failure',
  'q-d03-fen-ambush',
  'q-d03-fen-ambush-success',
  'q-d03-fen-ambush-failure',
  'q-d03-fen-hail',
  'q-d03-fen-hail-success',
  'q-d03-fen-hail-failure',
  'q-d04-survey-flags',
  'q-d04-survey-flags-success',
  'q-d04-survey-flags-failure',
  'q-d04-crow-elders',
  'q-d04-crow-elders-success',
  'q-d04-crow-elders-failure',
  'q-d04-crow-roost',
  'q-d04-crow-roost-success',
  'q-d04-crow-roost-failure',
  'q-d04-feast-armed',
  'q-d04-feast-armed-success',
  'q-d04-feast-armed-failure',
  'q-d05-flour-barrels',
  'q-d05-flour-barrels-success',
  'q-d05-flour-barrels-failure',
  'q-d05-toll-standoff',
  'q-d05-toll-standoff-success',
  'q-d05-toll-standoff-failure',
  'q-d05-saltroad-escort',
  'q-d05-saltroad-escort-success',
  'q-d05-saltroad-escort-failure',
  'q-d06-empty-stable',
  'q-d06-empty-stable-success',
  'q-d06-empty-stable-failure',
  'q-d07-crow-favor',
  'q-d07-crow-favor-success',
  'q-d07-crow-favor-failure',
  'q-d07-galleries',
  'q-d07-galleries-success',
  'q-d07-galleries-failure',
  'q-d08-escort-to-bell',
  'q-d08-escort-to-bell-success',
  'q-d08-escort-to-bell-failure',
  'q-d09-iron-convoy',
  'q-d09-iron-convoy-success',
  'q-d09-iron-convoy-failure',
  'q-d10-freehold-raid',
  'q-d10-freehold-raid-success',
  'q-d10-freehold-raid-failure',
  'q-d12-mirefen-defense',
  'q-d12-mirefen-defense-success',
  'q-d12-mirefen-defense-failure',
  'q-d12-mirefen-cellars',
  'q-d12-mirefen-cellars-success',
  'q-d12-mirefen-cellars-failure',
  'q-d13-water-engine',
  'q-d13-water-engine-success',
  'q-d13-water-engine-failure',
  'q-d13-engine-sabotage',
  'q-d13-engine-sabotage-success',
  'q-d13-engine-sabotage-failure',
  'q-d14-sick-courier',
  'q-d14-sick-courier-success',
  'q-d14-sick-courier-failure',
  'q-d15-study-glass',
  'q-d15-study-glass-success',
  'q-d15-study-glass-failure',
  'q-d16-hidden-grain',
  'q-d16-hidden-grain-success',
  'q-d16-hidden-grain-failure',
  'q-d17-who-lies',
  'q-d17-who-lies-success',
  'q-d17-who-lies-failure',
  'q-d18-refugee-road',
  'q-d18-refugee-road-success',
  'q-d18-refugee-road-failure',
  'q-d19-bell-speech',
  'q-d19-bell-speech-success',
  'q-d19-bell-speech-failure',
  'q-d20-ford-dam',
  'q-d20-ford-dam-success',
  'q-d20-ford-dam-failure',
  'q-d22-ford-bodies',
  'q-d22-ford-bodies-success',
  'q-d22-ford-bodies-failure',
  'q-d23-blue-lantern',
  'q-d23-blue-lantern-success',
  'q-d23-blue-lantern-failure',
  'q-d24-mission-road',
  'q-d24-mission-road-success',
  'q-d24-mission-road-failure',
  'q-d24-coldbrook-visit',
  'q-d24-coldbrook-visit-success',
  'q-d24-coldbrook-visit-failure',
  'q-d26-dry-well',
  'q-d26-dry-well-success',
  'q-d26-dry-well-failure',
  'q-d27-flint-evidence',
  'q-d27-flint-evidence-success',
  'q-d27-flint-evidence-failure',
  'q-d28-rot-cure',
  'q-d28-rot-cure-success',
  'q-d28-rot-cure-failure',
  'q-d30-hold-the-line',
  'q-d30-hold-the-line-success',
  'q-d30-hold-the-line-failure',
  'q-d31-iron-rain',
  'q-d31-iron-rain-success',
  'q-d31-iron-rain-failure',
  'q-d33-thistledown',
  'q-d33-thistledown-success',
  'q-d33-thistledown-failure',
  'q-d33-waystation',
  'q-d33-waystation-success',
  'q-d33-waystation-failure',
  'q-d35-trestle',
  'q-d35-trestle-success',
  'q-d35-trestle-failure',
  'q-d35-tunnel',
  'q-d35-tunnel-success',
  'q-d35-tunnel-failure',
  'q-d36-bell-rehearsal',
  'q-d36-bell-rehearsal-success',
  'q-d36-bell-rehearsal-failure',
  'q-d41-stragglers',
  'q-d41-stragglers-success',
  'q-d41-stragglers-failure',
  'q-d42-tunnel-props',
  'q-d42-tunnel-props-success',
  'q-d42-tunnel-props-failure',
  'q-d42-crow-watch',
  'q-d42-crow-watch-success',
  'q-d42-crow-watch-failure',
  'q-d42-bell-water',
  'q-d42-bell-water-success',
  'q-d42-bell-water-failure',
  'q-d42-wagon-wheels',
  'q-d42-wagon-wheels-success',
  'q-d42-wagon-wheels-failure',
  'q-d42-caravan-guard',
  'q-d42-caravan-guard-success',
  'q-d42-caravan-guard-failure',
  'q-d42-barn-harvest',
  'q-d42-barn-harvest-success',
  'q-d42-barn-harvest-failure',
  'q-d42-rail-salvage',
  'q-d42-rail-salvage-success',
  'q-d42-rail-salvage-failure',
  'q-d42-cave-forage',
  'q-d42-cave-forage-success',
  'q-d44-komodo-bargain',
  'q-d44-komodo-bargain-success',
  'q-d44-komodo-bargain-failure',
  'q-d46-well-that-spoke',
  'q-d46-well-that-spoke-success',
  'q-d46-well-that-spoke-failure',
  'q-d48-bell-clapper',
  'q-d48-bell-clapper-success',
  'q-d48-bell-clapper-failure',
  'q-d50-last-dispatch',
  'q-d50-last-dispatch-success',
  'q-d50-last-dispatch-failure',
  'q-d50-crypt-path',
  'q-d50-crypt-path-success',
  'q-d50-crypt-path-failure',
  'q-d50-ring-the-bell',
  'q-d50-ring-the-bell-success',
  'q-d50-ring-the-bell-failure',
  'r-bandit-sighting',
  'r-bandit-sighting-success',
  'r-bandit-sighting-failure',
  'r-sick-herd',
  'r-sick-herd-success',
  'r-sick-herd-failure',
  'r-lost-caravan',
  'r-lost-caravan-success',
  'r-lost-caravan-failure',
  'r-boundary-dispute',
  'r-boundary-dispute-success',
  'r-boundary-dispute-failure',
  'r-strange-relic',
  'r-strange-relic-success',
  'r-strange-relic-failure',
  'r-roost-storm',
  'r-roost-storm-success',
  'r-roost-storm-failure',
  'r-fen-lantern',
  'r-fen-lantern-success',
  'r-fen-lantern-failure',
  'r-wagon-escort',
  'r-wagon-escort-success',
  'r-wagon-escort-failure',
  'r-tunnel-rescue',
  'r-tunnel-rescue-success',
  'r-tunnel-rescue-failure',
  'r-salvage-claim',
  'r-salvage-claim-success',
  'r-salvage-claim-failure',
  'r-bell-thief',
  'r-bell-thief-success',
  'r-bell-thief-failure',
  'r-checkpoint',
  'r-checkpoint-success',
  'r-checkpoint-failure',
  'r-dead-engine',
  'r-dead-engine-success',
  'r-dead-engine-failure',
  'r-debt-collector',
  'r-debt-collector-success',
  'r-debt-collector-failure',
  'r-deserter',
  'r-deserter-success',
  'r-deserter-failure',
  'r-face-at-window',
  'r-face-at-window-success',
  'r-face-at-window-failure',
  'r-fen-gave-back',
  'r-fen-gave-back-success',
  'r-fen-gave-back-failure',
  'r-ferry-stalled',
  'r-ferry-stalled-success',
  'r-ferry-stalled-failure',
  'r-fever-ward',
  'r-fever-ward-failure',
  'r-fever-ward-success',
  'r-graves',
  'r-graves-success',
  'r-graves-failure',
  'r-hidden-bread',
  'r-hidden-bread-success',
  'r-hidden-bread-failure',
  'r-last-straggler',
  'r-last-straggler-success',
  'r-last-straggler-failure',
  'r-low-galleries',
  'r-low-galleries-success',
  'r-low-galleries-failure',
  'r-pack-raid',
  'r-pack-raid-success',
  'r-pack-raid-failure',
  'r-runaway-runner',
  'r-runaway-runner-success',
  'r-runaway-runner-failure',
  'r-salt-weigh',
  'r-salt-weigh-success',
  'r-salt-weigh-failure',
  'r-thistle-smoke',
  'r-thistle-smoke-success',
  'r-thistle-smoke-failure',
  'r-trestle-sags',
  'r-trestle-sags-success',
  'r-trestle-sags-failure',
  'r-verge-scouts',
  'r-verge-scouts-success',
  'r-verge-scouts-failure',
  'r-well-poison',
  'r-well-poison-success',
  'r-well-poison-failure',
]

const AVAILABLE = new Set(QUEST_ART)
const MAP = '/emperor-of-dust/map/wasteland.webp'

const templateOf = (questId: string) => questId.split('@')[0] ?? questId

/** The rendered image for a quest, or undefined while it has none. */
export const questArtUrl = (
  questId: string,
  variant: QuestArtVariant = 'notice',
): string | undefined => {
  const base = templateOf(questId)
  const asset = variant === 'notice' ? base : `${base}-${variant}`
  if (AVAILABLE.has(asset)) return `/emperor-of-dust/quests/${asset}.webp`
  return AVAILABLE.has(base)
    ? `/emperor-of-dust/quests/${base}.webp`
    : undefined
}

/**
 * A curated consequence plate for one quest outcome (deliveredPlates.ts,
 * generated from the conductor ledgers' keep verdicts). Partial and expired
 * results get their own scenes here; a triumph shares the success plate.
 */
export const questOutcomePlateUrl = (
  questId: string,
  tier: QuestResultTier | 'expired',
): string | undefined => {
  const outcome = tier === 'triumph' ? 'success' : tier
  const file = QUEST_OUTCOME_PLATES[`${templateOf(questId)}:${outcome}`]
  return file ? `/emperor-of-dust/audiences/${file}.webp` : undefined
}

/**
 * Painted choices for the quest viewport. Already-shipped static art loads
 * immediately. A missing outcome first probes the curated durable share
 * and falls back to the original shipped notice, never a blank panel.
 */
export function questArtCandidates(
  questId: string,
  variant: QuestArtVariant = 'notice',
  tier?: QuestResultTier | 'expired',
): string[] {
  const plate = tier ? questOutcomePlateUrl(questId, tier) : undefined
  if (plate) {
    const rest = questArtCandidates(questId, variant)
    return [plate, ...rest.filter((url) => url !== plate)]
  }
  const base = templateOf(questId)
  const asset = variant === 'notice' ? base : `${base}-${variant}`
  const staticExact = AVAILABLE.has(asset)
    ? `/emperor-of-dust/quests/${asset}.webp`
    : undefined
  if (staticExact) return [staticExact]

  const staticFallback = questArtUrl(questId, variant)
  return [emperorMediaArtUrl(`quests/${asset}`), staticFallback].filter(
    (candidate): candidate is string => Boolean(candidate),
  )
}

/** Which outcome scene a dawn result shows. */
export const outcomeVariant = (
  tier: QuestResultTier | 'expired',
): QuestArtVariant =>
  tier === 'triumph' || tier === 'success'
    ? 'success'
    : tier === 'expired'
      ? 'notice'
      : 'failure'

/** The painted map, zoomed onto a region, as an inline style. */
export const regionCropStyle = (regionId: string): Record<string, string> => {
  const region = REGIONS.find((entry) => entry.id === regionId)
  return {
    backgroundImage: `url(${MAP})`,
    backgroundSize: '320%',
    backgroundPosition: `${region?.x ?? 50}% ${region?.y ?? 50}%`,
  }
}
