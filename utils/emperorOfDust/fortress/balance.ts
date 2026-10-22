// Seeded balance simulation (conductor emperor-of-dust t-009). Policy bots
// play whole 50-day campaigns through the real engine, so the report shows
// what each play style earns and the balance test can hold the line: every
// hideout and every ending stays reachable, careful play rarely loses the
// crypt, and a full barracks does not live on the Ledger's loans.
import { questDef } from './content'
import { type EndingId, endingOf } from './endings'
import {
  assignQuest,
  audienceScene,
  audiencesToday,
  chooseAudienceOption,
  createRun,
  finishDay,
  followerStatus,
  isOver,
  optionBlockers,
  previewQuest,
  recruit,
  upgradeBeds,
} from './engine'
import type {
  AudienceOption,
  FortressRun,
  KingdomFactionId,
  QuestDef,
} from './types'

export type Policy = {
  id: string
  title: string
  /** Higher wins; ties go to the option listed first. */
  score: (option: AudienceOption, run: FortressRun, seed: number) => number
  /** Quests for this faction are staffed first. */
  focus?: KingdomFactionId
  /** Lowest success chance the policy will send a party at. */
  minChance: number
  /** Sends the smallest party, first come, whatever the odds. */
  reckless?: boolean
}

/** The seven factions that can host the court in Act V. */
export const HOST_FACTIONS: readonly KingdomFactionId[] = [
  'moles',
  'storm-crows',
  'hollow-bell',
  'jackalwire',
  'saltroad',
  'freeholds',
  'rustline',
]

/** Each host faction's hideout (engine selectHideout). */
export const HOST_HIDEOUT: Record<string, string> = {
  moles: 'mole-tunnels',
  'storm-crows': 'crow-cave',
  'hollow-bell': 'bell-cellars',
  jackalwire: 'wagon-circle',
  saltroad: 'moving-caravan',
  freeholds: 'freehold-barn',
  rustline: 'rail-station',
}

const gains = (option: AudienceOption, except?: KingdomFactionId) =>
  Object.entries(option.effects.affinity ?? {}).reduce(
    (sum, [id, delta]) =>
      sum +
      (id !== except &&
      (HOST_FACTIONS.includes(id as KingdomFactionId) || id === 'mire-mothers')
        ? Math.max(0, delta ?? 0)
        : 0),
    0,
  )

/** A focused patron: their faction first; between equals, help no other host. */
const patron = (faction: KingdomFactionId): Policy => ({
  id: `patron:${faction}`,
  title: `Patron of ${faction}`,
  focus: faction,
  minChance: 45,
  score: (option) =>
    (option.effects.affinity?.[faction] ?? 0) * 10 +
    (option.effects.strength?.[faction] ?? 0) * 5 +
    (option.postsQuests?.length ?? 0) -
    gains(option, faction),
})

export const POLICIES: readonly Policy[] = [
  {
    id: 'greedy',
    title: 'Takes the first answer',
    minChance: 45,
    score: () => 0,
  },
  {
    id: 'random',
    title: 'Answers at random',
    minChance: 45,
    score: (option, run, seed) =>
      (seed * 31 + run.day * 17 + option.id.length * 7 + option.label.length) %
      13,
  },
  {
    id: 'spurn-all',
    title: 'Favours nobody',
    minChance: 45,
    score: (option) => -gains(option),
  },
  {
    id: 'marshal',
    title: 'Builds a Gate Watch mandate',
    minChance: 45,
    score: (option) =>
      (option.id === 'sign-watch-writ' || option.id === 'iron' ? 100 : 0) +
      (option.effects.local?.['gate-watch'] ?? 0) * 5,
  },
  {
    id: 'reckless',
    title: 'Sends anyone, anywhere',
    minChance: 0,
    reckless: true,
    score: () => 0,
  },
  {
    id: 'idle',
    title: 'Never sends a party',
    minChance: 101,
    score: (option) =>
      -Object.values(option.effects.affinity ?? {}).reduce<number>(
        (sum, delta) => sum + (delta ?? 0),
        0,
      ),
  },
  ...HOST_FACTIONS.map(patron),
  patron('mire-mothers'),
]

const ready = (run: FortressRun) =>
  run.roster
    .filter((state) => followerStatus(run, state.id) === 'ready')
    .map((state) => state.id)

/** The best-odds party for a quest; smaller wins unless it costs 5 points. */
const bestParty = (run: FortressRun, quest: QuestDef, pool: string[]) => {
  let best: { party: string[]; chance: number } | null = null
  const max = Math.min(quest.party.max, pool.length)
  const visit = (start: number, picked: string[]) => {
    if (picked.length >= quest.party.min) {
      const chance = previewQuest(run, quest.id, picked).chance
      if (
        !best ||
        chance > best.chance + 4 ||
        (chance >= best.chance && picked.length < best.party.length)
      )
        best = { party: [...picked], chance }
    }
    if (picked.length === max) return
    for (let i = start; i < pool.length; i += 1)
      visit(i + 1, [...picked, pool[i]!])
  }
  visit(0, [])
  return best as { party: string[]; chance: number } | null
}

const partyFor = (run: FortressRun, quest: QuestDef, policy: Policy) => {
  const pool = ready(run)
  if (quest.mustInclude && !pool.includes(quest.mustInclude)) return null
  if (policy.reckless) {
    const ordered = quest.mustInclude
      ? [quest.mustInclude, ...pool.filter((id) => id !== quest.mustInclude)]
      : pool
    return ordered.length >= quest.party.min
      ? ordered.slice(0, quest.party.min)
      : null
  }
  const best = bestParty(run, quest, pool)
  if (!best || best.chance < policy.minChance) return null
  if (quest.mustInclude && !best.party.includes(quest.mustInclude)) return null
  return best.party
}

export type CampaignResult = {
  ending: EndingId
  hideout: string
  deaths: number
  loans: number
  wipedOut: number
  brass: number
  roster: number
}

/**
 * One whole campaign, Day 1 to the ending, played by a policy. `onDawn` sees
 * the run at every dawn (Day 1 and after each Finish), as the autosave does.
 */
export const playCampaign = (
  policy: Policy,
  seed: number,
  onDawn?: (run: FortressRun) => void,
): CampaignResult => {
  let run = createRun(seed)
  onDawn?.(run)
  while (!isOver(run)) {
    // Everyone who offers is taken on, with another bed bought if needed.
    for (const id of [...run.recruitable]) {
      try {
        run = recruit(run, id)
      } catch {
        try {
          run = recruit(upgradeBeds(run), id)
        } catch {
          // No bed or no brass: the offer waits.
        }
      }
    }
    for (const audience of audiencesToday(run)) {
      // A scene can run several beats; follow it until it closes or stalls.
      for (let beat = 0; beat < 8; beat += 1) {
        if (run.audiencesHeard.includes(audience.id)) break
        const open = audienceScene(run, audience).options.filter(
          (option) => optionBlockers(run, option).length === 0,
        )
        const pick = open
          .map((option, i) => ({
            option,
            i,
            score: policy.score(option, run, seed),
          }))
          .sort((a, b) => b.score - a.score || a.i - b.i)[0]
        if (!pick) break
        run = chooseAudienceOption(run, audience.id, pick.option.id).run
      }
    }
    const board = [...run.board].sort((a, b) => {
      const qa = questDef(a.questId)!
      const qb = questDef(b.questId)!
      const rank = (q: QuestDef) =>
        (policy.focus && q.faction === policy.focus ? 2 : 0) +
        (q.lethal ? 1 : 0)
      return rank(qb) - rank(qa)
    })
    for (const entry of board) {
      if (!ready(run).length) break
      const party = partyFor(run, questDef(entry.questId)!, policy)
      if (!party) continue
      try {
        run = assignQuest(run, entry.questId, party)
      } catch {
        // A party the engine refuses (a rule the bot does not model) stays home.
      }
    }
    run = finishDay(run).run
    onDawn?.(run)
  }
  return {
    ending: endingOf(run).id,
    hideout: run.hideout ?? 'none',
    deaths: run.memorials.length,
    loans: run.loans,
    wipedOut: run.wipedOut.length,
    brass: run.brass,
    roster: run.roster.filter((state) => !state.dead && !state.departed).length,
  }
}

export type PolicyReport = {
  policy: string
  runs: number
  endings: Partial<Record<EndingId, number>>
  hideouts: Record<string, number>
  /** Campaigns that lost two or more followers. */
  heavyLosses: number
  deaths: number
  loans: number
  wipedOut: number
  brassMin: number
}

/** Seeds 1..runs for every policy. */
export const balanceReport = (runs: number): PolicyReport[] =>
  POLICIES.map((policy) => {
    const report: PolicyReport = {
      policy: policy.id,
      runs,
      endings: {},
      hideouts: {},
      heavyLosses: 0,
      deaths: 0,
      loans: 0,
      wipedOut: 0,
      brassMin: Infinity,
    }
    for (let seed = 1; seed <= runs; seed += 1) {
      const result = playCampaign(policy, seed)
      report.endings[result.ending] = (report.endings[result.ending] ?? 0) + 1
      report.hideouts[result.hideout] =
        (report.hideouts[result.hideout] ?? 0) + 1
      report.heavyLosses += result.deaths >= 2 ? 1 : 0
      report.deaths += result.deaths
      report.loans += result.loans
      report.wipedOut += result.wipedOut
      report.brassMin = Math.min(report.brassMin, result.brass)
    }
    return report
  })
