import assert from 'node:assert/strict'
import {
  campaignBattleTerms,
  campaignEchoFor,
  campaignFavorsFor,
  createCampaignSave,
  FACTION_CAMPAIGNS,
  resolveCampaignBattle,
  type CampaignApproach,
  type CampaignSave,
} from '../slimeCity/campaign'
import { playHeadless, type MatchMetrics } from '../slimeCity/playtest'
import { TEAMS, type TeamId } from '../slimeCity/prototypes'

const seeds = [4421, 9083]
const approaches: CampaignApproach[] = ['conviction', 'cunning']
const score = (m: MatchMetrics) =>
  m.victor === 'player' ? 1 : m.victor === 'draw' ? 0.5 : 0

function earnedSave(
  team: TeamId,
  index: number,
  lastChoice: CampaignApproach,
): CampaignSave {
  let save = createCampaignSave()
  for (let chapterIndex = 0; chapterIndex <= index; chapterIndex++) {
    const chapter = FACTION_CAMPAIGNS[team].chapters[chapterIndex]!
    const choice = chapterIndex === index ? lastChoice : 'conviction'
    save = resolveCampaignBattle(
      save,
      team,
      chapterIndex,
      chapter.foe,
      choice,
      'player',
    )
  }
  return save
}

interface Trial {
  team: TeamId
  chapter: number
  source: number
  sourceChoice: CampaignApproach
  nextChoice: CampaignApproach
  seed: number
  rival: TeamId
  base: MatchMetrics
  supported: MatchMetrics
  changedOutcome: boolean
  changedCommands: boolean
}

const trials: Trial[] = []
const baselineCache = new Map<string, ReturnType<typeof playHeadless>>()
for (const team of TEAMS) {
  const chapters = FACTION_CAMPAIGNS[team.id].chapters
  for (let source = 0; source < chapters.length - 1; source++) {
    for (const sourceChoice of approaches) {
      const save = earnedSave(team.id, source, sourceChoice)
      const chosenFavor = campaignFavorsFor(save, team.id)[source]
      assert.equal(chosenFavor?.chapterIndex, source)
      assert.equal(chosenFavor?.choice, sourceChoice)
      const chapter = chapters[source + 1]!
      for (const nextChoice of approaches) {
        const approachTerms = chapter.choices.find(
          (choice) => choice.id === nextChoice,
        )!.terms
        const supportedTerms = campaignBattleTerms(
          save,
          team.id,
          approachTerms,
          source,
        )
        assert.notDeepEqual(supportedTerms, approachTerms)
        for (const seed of seeds) {
          const baselineKey = [team.id, source, nextChoice, seed].join(':')
          let baseline = baselineCache.get(baselineKey)
          if (!baseline) {
            baseline = playHeadless(
              'blackout', team.id, chapter.foe, seed, undefined, {}, approachTerms,
            )
            baselineCache.set(baselineKey, baseline)
          }
          const supported = playHeadless(
            'blackout', team.id, chapter.foe, seed, undefined, {}, supportedTerms,
          )
          assert.ok(baseline.state.victor)
          assert.ok(supported.state.victor)
          assert.equal(supported.metrics.commands, supported.state.commands.length)
          assert.equal(supported.metrics.playerTeam, team.id)
          assert.equal(supported.metrics.enemyTeam, chapter.foe)
          assert.ok(supported.metrics.rounds <= supported.state.maxRounds + 5)
          trials.push({
            team: team.id,
            chapter: source + 2,
            source,
            sourceChoice,
            nextChoice,
            seed,
            rival: chapter.foe,
            base: baseline.metrics,
            supported: supported.metrics,
            changedOutcome: baseline.metrics.victor !== supported.metrics.victor,
            changedCommands: JSON.stringify(baseline.state.commands) !==
              JSON.stringify(supported.state.commands),
          })
        }
      }
      // Prove the same seed and exact earned support replays identically.
      const next = chapters[source + 1]!
      const terms = campaignBattleTerms(
        save, team.id, next.choices[0]!.terms, source,
      )
      const first = playHeadless('blackout', team.id, next.foe, seeds[0]!, undefined, {}, terms)
      const second = playHeadless('blackout', team.id, next.foe, seeds[0]!, undefined, {}, terms)
      assert.deepEqual(first.state, second.state)
      assert.deepEqual(first.metrics, second.metrics)
    }
  }
  // The finale currently awards a fifth favor but has no next story fight.
  const finale = earnedSave(team.id, 4, 'conviction')
  assert.equal(campaignFavorsFor(finale, team.id).length, 5)
  assert.equal(campaignEchoFor(finale, team.id), null)
}
assert.equal(trials.length, 192)
assert.equal(baselineCache.size, 96)

function stats(rows: Trial[]) {
  const baseWins = rows.reduce((n, r) => n + score(r.base), 0)
  const favorWins = rows.reduce((n, r) => n + score(r.supported), 0)
  return {
    trials: rows.length,
    baselineScore: baseWins,
    favoredScore: favorWins,
    delta: favorWins - baseWins,
    changedOutcomes: rows.filter((r) => r.changedOutcome).length,
    changedCommands: rows.filter((r) => r.changedCommands).length,
    stalled: rows.filter((r) => r.supported.firstContact === null).length,
    draws: rows.filter((r) => r.supported.victor === 'draw').length,
    averageRounds: Number(
      (rows.reduce((n, r) => n + r.supported.rounds, 0) / rows.length).toFixed(1),
    ),
  }
}

const crewReports = TEAMS.map((crew) => ({
  crew: crew.id,
  ...stats(trials.filter((r) => r.team === crew.id)),
}))
const favorReports = TEAMS.flatMap((crew) =>
  [0, 1, 2, 3].flatMap((source) =>
    approaches.map((choice) => ({
      crew: crew.id,
      earnedChapter: source + 1,
      choice,
      ...stats(trials.filter(
        (r) => r.team === crew.id &&
          r.source === source && r.sourceChoice === choice,
      )),
    })),
  ),
)
const report = {
  method: 'actual Blackout engine, both sides CPU; same-seed paired no-favor control',
  seeds,
  scope: 'six crews x four usable earned chapters x two past decisions x two next approaches x two seeds',
  ...stats(trials),
  crews: crewReports,
  favors: favorReports,
  blockedFifthChapterFavors: 6,
}
assert.ok(report.changedCommands > 0, 'Support should change actual combat choices')
assert.ok(report.changedOutcomes > 0, 'Support should change at least one result')
console.log('SLIME_SUPPORT_PLAYTEST_REPORT ' + JSON.stringify(report))
console.log(
  'Slime City actual-engine campaign audit: 192 paired comparisons, 96 controls, ' +
  'six deterministic replays, all crews and earned choices PASS',
)
