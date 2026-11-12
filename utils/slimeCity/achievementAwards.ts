// Slime City achievements (conductor slime-city t-060): which catalog codes a
// deed earns. Each helper compares the state before and after one deed, so a
// save that loads already finished earns nothing; only playing it does.
// plugins/slime-city-achievements.client.ts hands the codes to the
// achievement store, which ignores repeats.

import type { TowerRun } from './allianceTower'
import {
  campaignEnding,
  FACTION_CAMPAIGNS,
  type CampaignSave,
} from './campaign'
import type { CityState } from './city'
import { CLASH_MAX_LEVEL, type ClashState } from './clash'
import type { TeamId } from './prototypes'
import type { PvpSnapshot } from './pvp'

/** One achievement per crew campaign told to its end. */
export const CAMPAIGN_ACHIEVEMENTS: Record<TeamId, string> = {
  catgirls: 'slime-city-campaign-catgirls',
  bloodfairies: 'slime-city-campaign-bloodfairies',
  ironjaw: 'slime-city-campaign-ironjaw',
  riot: 'slime-city-campaign-riot',
  undertow: 'slime-city-campaign-undertow',
  exchange: 'slime-city-campaign-exchange',
}

const CREWS = Object.keys(CAMPAIGN_ACHIEVEMENTS) as TeamId[]

/** The tower floor that counts as halfway up. */
export const TOWER_HALFWAY = 6

/** A campaign bout was settled for `team`. */
export function campaignAchievements(
  before: CampaignSave,
  after: CampaignSave,
  team: TeamId,
): string[] {
  const codes: string[] = []
  if (after[team].wins > before[team].wins) codes.push('slime-city-chapter-won')
  const ending = campaignEnding(after, team)
  if (!ending || campaignEnding(before, team)) return codes
  codes.push(
    ending === FACTION_CAMPAIGNS[team].triumph
      ? 'slime-city-conviction-triumph'
      : 'slime-city-cunning-compromise',
  )
  // Finishing a crew also counts the crews this account finished before
  // these achievements existed, so an old save is never left behind.
  const finished = CREWS.filter((crew) => campaignEnding(after, crew))
  for (const crew of finished) codes.push(CAMPAIGN_ACHIEVEMENTS[crew])
  if (finished.length === CREWS.length) codes.push('slime-city-all-crews')
  return codes
}

/** A tower floor's Clash was settled. */
export function towerAchievements(
  before: TowerRun | null | undefined,
  after: TowerRun | null | undefined,
): string[] {
  if (!before || !after || before === after) return []
  const codes: string[] = []
  if (before.floor < TOWER_HALFWAY && after.floor >= TOWER_HALFWAY)
    codes.push('slime-city-tower-floor-6')
  if (before.phase !== 'complete' && after.phase === 'complete')
    codes.push('slime-city-tower-summit')
  return codes
}

/** Any finished Clash against the CPU, from the player's seat. */
export function clashAchievements(
  state: Pick<ClashState, 'victor' | 'levels'>,
): string[] {
  const codes: string[] = []
  if (state.victor === 'player') codes.push('slime-city-first-clash-win')
  const levels = Object.values(state.levels?.player ?? {})
  if (levels.some((level) => level >= CLASH_MAX_LEVEL))
    codes.push('slime-city-third-form')
  return codes
}

/** A city rival bout or the Grand Pit's final call changed the city. */
export function cityAchievements(
  before: CityState,
  after: CityState,
): string[] {
  const codes: string[] = []
  if (after.cleared.length > before.cleared.length)
    codes.push('slime-city-district-champion')
  if (!before.finaleChoice && after.finaleChoice)
    codes.push('slime-city-city-finale')
  return codes
}

/** A duel against another player that the server says this seat won. */
export function pvpAchievements(
  duel: Pick<PvpSnapshot, 'stage' | 'outcome' | 'seat'> | null,
): string[] {
  return duel?.stage === 'finished' && duel.outcome === duel.seat
    ? ['slime-city-pvp-win']
    : []
}
