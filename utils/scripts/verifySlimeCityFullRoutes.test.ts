// Slime City full-route campaign QA (conductor slime-city/t-012).
//
// Every crew, every one of the 32 conviction/cunning decision paths through
// its five chapters, under several seeds, played through the REAL Blackout
// engine with the same earned-favor terms Story mode applies. Real defeats
// and draws are fed back into the save exactly as the UI does, and the
// player "retries" on the next seed until the chapter is won.
//
// The contract checked on every route:
// - each route finishes (five wins, five decisions) within a bounded retry
//   budget, so no chapter is unwinnable under any earned favor;
// - defeats and draws never advance the story, never record a decision, and
//   are counted exactly;
// - stale, replayed, wrong-rival or post-finale results are ignored;
// - favors equal wins and point at the chapter foe; the active story echo
//   disappears at the finale and the crew legacy appears only then;
// - the ending is triumph iff at least three choices were conviction, so
//   both endings are reachable for every crew;
// - the whole run is deterministic: the same seed reproduces the same saves.
import assert from 'node:assert/strict'
import {
  campaignBattleTerms,
  campaignEchoFor,
  campaignEnding,
  campaignFavorsFor,
  campaignLegacyFor,
  createCampaignSave,
  FACTION_CAMPAIGNS,
  resolveCampaignBattle,
  type CampaignApproach,
  type CampaignResult,
  type CampaignSave,
} from '../slimeCity/campaign'
import { playHeadless } from '../slimeCity/playtest'
import { TEAMS, type TeamId } from '../slimeCity/prototypes'

const SEEDS = [1187, 52021, 900913]
const MAX_ATTEMPTS = 40
const APPROACHES: CampaignApproach[] = ['conviction', 'cunning']
const CHAPTERS = 5

const matchCache = new Map<string, CampaignResult>()

function fight(
  team: TeamId,
  foe: TeamId,
  seed: number,
  terms: ReturnType<typeof campaignBattleTerms>,
): CampaignResult {
  const key = [team, foe, seed, JSON.stringify(terms)].join('|')
  const cached = matchCache.get(key)
  if (cached) return cached
  const { state } = playHeadless(
    'blackout',
    team,
    foe,
    seed,
    undefined,
    {},
    terms,
  )
  assert.ok(state.victor, `${team} vs ${foe} seed ${seed} never ended`)
  const result: CampaignResult =
    state.victor === 'player'
      ? 'player'
      : state.victor === 'enemy'
        ? 'enemy'
        : 'draw'
  matchCache.set(key, result)
  return result
}

function pathFor(mask: number): CampaignApproach[] {
  return Array.from({ length: CHAPTERS }, (_, i) =>
    (mask >> i) & 1 ? 'cunning' : 'conviction',
  )
}

interface RouteOutcome {
  save: CampaignSave
  losses: number
  draws: number
  attempts: number
}

function playRoute(
  team: TeamId,
  path: CampaignApproach[],
  baseSeed: number,
): RouteOutcome {
  const campaign = FACTION_CAMPAIGNS[team]
  let save = createCampaignSave()
  let losses = 0
  let draws = 0
  let attempts = 0
  for (let index = 0; index < CHAPTERS; index++) {
    const chapter = campaign.chapters[index]!
    const choice = path[index]!
    const choiceTerms = chapter.choices.find((c) => c.id === choice)!.terms
    let won = false
    for (let attempt = 0; attempt < MAX_ATTEMPTS && !won; attempt++) {
      attempts++
      const before = save[team]
      // Favors available at this point equal the wins so far, and each one
      // names the rival of the chapter that earned it.
      const favors = campaignFavorsFor(save, team)
      assert.equal(favors.length, index)
      favors.forEach((favor, i) => {
        assert.equal(favor.chapterIndex, i)
        assert.equal(favor.ally, campaign.chapters[i]!.foe)
        assert.equal(favor.choice, path[i])
      })
      assert.equal(campaignLegacyFor(save, team), null)
      if (index > 0) assert.ok(campaignEchoFor(save, team))
      else assert.equal(campaignEchoFor(save, team), null)

      const terms = campaignBattleTerms(save, team, choiceTerms)
      const seed = baseSeed + index * 101 + attempt * 7919
      const result = fight(team, chapter.foe, seed, terms)

      // A result reported against the wrong rival or chapter is ignored.
      const wrongFoe = TEAMS.find(
        (t) => t.id !== chapter.foe && t.id !== team,
      )!.id
      assert.strictEqual(
        resolveCampaignBattle(save, team, index, wrongFoe, choice, result),
        save,
      )
      assert.strictEqual(
        resolveCampaignBattle(
          save,
          team,
          index + 1,
          chapter.foe,
          choice,
          result,
        ),
        save,
      )

      const next = resolveCampaignBattle(
        save,
        team,
        index,
        chapter.foe,
        choice,
        result,
      )
      const after = next[team]
      assert.equal(after.lastApproach, choice)
      assert.equal(after.lastResult, result)
      assert.ok(after.lastScene && after.lastScene.length > 0)
      if (result === 'player') {
        assert.equal(after.wins, before.wins + 1)
        assert.deepEqual(after.decisions, [...before.decisions, choice])
        assert.ok(after.lastScene!.startsWith(chapter.victory))
        won = true
      } else {
        assert.equal(after.wins, before.wins)
        assert.deepEqual(after.decisions, before.decisions)
        if (result === 'enemy') {
          losses++
          assert.equal(after.losses, before.losses + 1)
          assert.ok(after.lastScene!.startsWith(chapter.defeat))
        } else {
          draws++
          assert.equal(after.losses, before.losses)
        }
      }
      // Other crews' progress is never touched.
      for (const other of TEAMS) {
        if (other.id !== team)
          assert.strictEqual(next[other.id], save[other.id])
      }
      save = next
    }
    assert.ok(
      won,
      `${team} chapter ${index + 1} (${choice}) unwon after ${MAX_ATTEMPTS} attempts from seed ${baseSeed}`,
    )
  }
  return { save, losses, draws, attempts }
}

let routes = 0
let totalAttempts = 0
const endingsSeen = new Map<TeamId, Set<string>>()

for (const crew of TEAMS) {
  const team = crew.id
  const campaign = FACTION_CAMPAIGNS[team]
  assert.equal(campaign.chapters.length, CHAPTERS)
  assert.notEqual(campaign.triumph, campaign.compromise)
  endingsSeen.set(team, new Set())
  for (let mask = 0; mask < 1 << CHAPTERS; mask++) {
    const path = pathFor(mask)
    for (const seed of SEEDS) {
      const outcome = playRoute(team, path, seed)
      const progress = outcome.save[team]
      routes++
      totalAttempts += outcome.attempts

      assert.equal(progress.wins, CHAPTERS)
      assert.deepEqual(progress.decisions, path)
      assert.equal(progress.losses, outcome.losses)
      assert.equal(outcome.attempts, CHAPTERS + outcome.losses + outcome.draws)

      const conviction = path.filter((c) => c === 'conviction').length
      const ending = campaignEnding(outcome.save, team)
      assert.equal(
        ending,
        conviction >= 3 ? campaign.triumph : campaign.compromise,
      )
      endingsSeen.get(team)!.add(ending!)

      // Finale: the story echo is gone; the crew legacy carries all five
      // favors into city fights, defaulting to the finale's.
      assert.equal(campaignEchoFor(outcome.save, team), null)
      const legacy = campaignLegacyFor(outcome.save, team)
      assert.equal(legacy?.chapterIndex, CHAPTERS - 1)
      for (let i = 0; i < CHAPTERS; i++)
        assert.equal(campaignLegacyFor(outcome.save, team, i)?.chapterIndex, i)

      // Nothing past the finale can change the finished campaign.
      const last = campaign.chapters[CHAPTERS - 1]!
      for (const result of ['player', 'enemy', 'draw'] as const) {
        assert.strictEqual(
          resolveCampaignBattle(
            outcome.save,
            team,
            CHAPTERS - 1,
            last.foe,
            'conviction',
            result,
          ),
          outcome.save,
        )
      }

      // Same seed, same route, same save: reproducible for bug reports.
      if (mask === 0 || mask === (1 << CHAPTERS) - 1) {
        matchCache.clear()
        const replay = playRoute(team, path, seed)
        assert.deepEqual(replay.save, outcome.save)
      }
    }
  }
  assert.equal(
    endingsSeen.get(team)!.size,
    2,
    `${team} must reach both its triumph and compromise endings`,
  )
}

assert.equal(routes, TEAMS.length * (1 << CHAPTERS) * SEEDS.length)
console.log(
  `Slime City full routes: ${routes} routes across ${TEAMS.length} crews, ` +
    `${totalAttempts} engine fights, both endings reached for every crew.`,
)
