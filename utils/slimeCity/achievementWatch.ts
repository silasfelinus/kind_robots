// Slime City achievements (conductor slime-city t-060): watch the store's
// actions and award what each one earned. Only the deeds below are judged,
// each by comparing the store before and after it ran, so loading a story or
// signing in (hydrateStory, hydrateProgression) never awards anything.

import { allianceProblems, type AllianceDeck } from './alliance'
import {
  CAMPAIGN_ACHIEVEMENTS,
  campaignAchievements,
  cityAchievements,
  clashAchievements,
  towerAchievements,
} from './achievementAwards'
import type { TowerRun } from './allianceTower'
import type { CampaignSave } from './campaign'
import type { CityState } from './city'
import type { ClashState } from './clash'
import type { TeamId } from './prototypes'

/** The parts of the Slime City store an award is judged from. */
export interface SlimeCitySnapshot {
  campaignSave: CampaignSave
  city: CityState
  towerRun: TowerRun | null
  playAlliance: AllianceDeck
  progress: unknown
  progressError: string
  clashResult: unknown
}

type ActionContext = {
  name: string
  args: unknown[]
  after: (callback: () => void) => void
}

/** The Slime City store as the watcher sees it (a Pinia store). */
export interface SlimeCityAchievementSource extends SlimeCitySnapshot {
  $onAction: (
    callback: (context: ActionContext) => void,
    detached?: boolean,
  ) => () => void
}

/** Actions that can end a bout (the Clash, and the retired arena). */
const BOUT_ACTIONS = new Set([
  'settleClash',
  'touchSquare',
  'dropCard',
  'nextRound',
])
/** Collection actions that save the Alliance deck when it is legal. */
const DECK_ACTIONS = new Set([
  'setAlly',
  'swapAllianceGeneral',
  'toggleAllianceCard',
  'dealStarterDeck',
  'restoreAllianceStarter',
])
const CREWS = Object.keys(CAMPAIGN_ACHIEVEMENTS) as TeamId[]
/** Every store action the watcher judges, for the contract test. */
export const WATCHED_ACTIONS: readonly string[] = [
  ...BOUT_ACTIONS,
  ...DECK_ACTIONS,
  'chooseFinale',
  'purchasePack',
]

function snapshot(lab: SlimeCitySnapshot): SlimeCitySnapshot {
  return {
    campaignSave: lab.campaignSave,
    city: lab.city,
    towerRun: lab.towerRun,
    playAlliance: lab.playAlliance,
    progress: lab.progress,
    progressError: lab.progressError,
    clashResult: lab.clashResult,
  }
}

/** The codes one finished store action earned. */
export function actionAchievements(
  name: string,
  args: readonly unknown[],
  before: SlimeCitySnapshot,
  now: SlimeCitySnapshot,
): string[] {
  const codes: string[] = []
  if (name === 'settleClash' && !before.clashResult && now.clashResult) {
    const state = args[1] as Pick<ClashState, 'victor' | 'levels'> | undefined
    if (state) codes.push(...clashAchievements(state))
  }
  if (BOUT_ACTIONS.has(name)) {
    for (const crew of CREWS)
      codes.push(
        ...campaignAchievements(before.campaignSave, now.campaignSave, crew),
      )
    codes.push(...towerAchievements(before.towerRun, now.towerRun))
    codes.push(...cityAchievements(before.city, now.city))
  }
  if (name === 'chooseFinale')
    codes.push(...cityAchievements(before.city, now.city))
  if (
    name === 'purchasePack' &&
    now.progress !== before.progress &&
    !now.progressError
  )
    codes.push('slime-city-first-pack')
  if (
    DECK_ACTIONS.has(name) &&
    now.playAlliance !== before.playAlliance &&
    !allianceProblems(now.playAlliance).length
  )
    codes.push('slime-city-alliance-builder')
  return [...new Set(codes)]
}

/** Award each deed's codes as the store's actions finish. */
export function watchSlimeCityAchievements(
  lab: SlimeCityAchievementSource,
  award: (codes: string[]) => void,
): () => void {
  return lab.$onAction(({ name, args, after }) => {
    const before = snapshot(lab)
    after(() => {
      const codes = actionAchievements(name, args, before, snapshot(lab))
      if (codes.length) award(codes)
    })
  }, true)
}
