// Campaign battlefields (conductor slime-city t-009): every chapter of all six
// crew campaigns is fought on its own authored BLACKOUT field and objective.
// Pins the data, the HOLD OUT and HEIST engine hooks, winnability by seeded
// play (never by doing nothing), campaign reachability and save shape.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  campaignBattleTerms,
  campaignChapter,
  campaignEnding,
  createCampaignSave,
  FACTION_CAMPAIGNS,
  resolveCampaignBattle,
  type CampaignApproach,
  type CampaignSave,
} from '../slimeCity/campaign'
import {
  applyBattlefield,
  campaignBattlefield,
  CAMPAIGN_BATTLEFIELDS,
  describeBattlefield,
  OBJECTIVE_GOALS,
  OBJECTIVE_LABELS,
  type CampaignBattlefield,
} from '../slimeCity/campaignBattlefields'
import { applyTerms } from '../slimeCity/city'
import {
  advance,
  cardById,
  cpuTurn,
  createMatch,
  deployAs,
  flagHome,
  stanceAs,
  TEAMS,
  type MatchState,
  type TeamId,
} from '../slimeCity/prototypes'
import { newSlimeCityStory, validSlimeCityStory } from '../slimeCity/storySave'

const crews = TEAMS.map((team) => team.id)
const approaches: CampaignApproach[] = ['conviction', 'cunning']
const SEEDS = Array.from({ length: 16 }, (_, i) => 1000 + i * 37)
const NUMBER_WORDS: Record<string, number> = {
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  twenty: 20,
}

// --- Data: six crews, five authored battlefields each ----------------------
const titles = new Set<string>()
const objectivesUsed = new Set<string>()
for (const team of crews) {
  const fields = CAMPAIGN_BATTLEFIELDS[team]
  const chapters = FACTION_CAMPAIGNS[team].chapters
  assert.equal(fields.length, chapters.length, team + ' has five battlefields')
  const crewObjectives = new Set(fields.map((field) => field.objective))
  assert.ok(
    crewObjectives.size >= 3,
    team + ' mixes at least three objectives across its campaign',
  )
  fields.forEach((field, index) => {
    const where = team + ' chapter ' + (index + 1) + ' ' + field.title
    assert.equal(campaignBattlefield(team, index), field)
    assert.ok(!titles.has(field.title), where + ' has a unique title')
    titles.add(field.title)
    objectivesUsed.add(field.objective)
    assert.ok(field.briefing.length > 80, where + ' has an authored briefing')
    // A briefing that names a round count must match the clock it sets.
    for (const match of field.briefing.matchAll(/\b([a-z]+) rounds\b/gi)) {
      const said = NUMBER_WORDS[match[1]!.toLowerCase()]
      if (said !== undefined)
        assert.equal(said, field.rounds, where + ' briefing names its clock')
    }
    if (field.objective === 'beast') assert.ok(field.beast, where + ' beast')
    else assert.equal(field.beast, undefined, where + ' has no stray beast')
    const foe = chapters[index]!.foe
    const squares = new Set<string>()
    for (const fighter of field.fighters ?? []) {
      const card = cardById(fighter.card)
      assert.equal(card.kind, 'creature', where + ' places creatures only')
      assert.equal(
        card.team,
        fighter.side === 'player' ? team : foe,
        where + ' places ' + card.name + ' with its own crew',
      )
      assert.ok(fighter.col >= 0 && fighter.col <= 9 && fighter.row >= 0)
      assert.ok(fighter.row <= 5)
      const key = fighter.col + ',' + fighter.row
      assert.ok(!squares.has(key), where + ' never stacks fighters')
      squares.add(key)
    }
    for (const trap of field.traps ?? []) {
      assert.ok(
        trap.col >= 2 && trap.col <= 7,
        where + ' traps sit in no-man’s-land',
      )
      assert.ok(trap.damage >= 1 && trap.damage <= 3, where + ' trap damage')
      assert.ok(!squares.has(trap.col + ',' + trap.row), where + ' trap')
    }
    const lines = describeBattlefield(field)
    assert.equal(lines[0], OBJECTIVE_GOALS[field.objective])
    if (field.rounds)
      assert.ok(lines.includes('Round limit ' + field.rounds + '.'), where)
  })
}
assert.deepEqual(
  [...objectivesUsed].sort(),
  Object.keys(OBJECTIVE_LABELS).sort(),
  'all four objectives appear in the campaigns',
)

// --- Applying a battlefield ----------------------------------------------
function fieldMatch(
  team: TeamId,
  index: number,
  choice: CampaignApproach,
  seed: number,
  save: CampaignSave = createCampaignSave(),
): MatchState {
  const chapter = FACTION_CAMPAIGNS[team].chapters[index]!
  const terms = chapter.choices.find((option) => option.id === choice)!.terms
  const termed = applyTerms(
    createMatch('blackout', team, chapter.foe, seed),
    campaignBattleTerms(save, team, terms),
  )
  return applyBattlefield(termed, campaignBattlefield(team, index)!)
}

for (const team of crews)
  CAMPAIGN_BATTLEFIELDS[team].forEach((field, index) => {
    for (const seed of SEEDS.slice(0, 4)) {
      const chapter = FACTION_CAMPAIGNS[team].chapters[index]!
      const fresh = createMatch('blackout', team, chapter.foe, seed)
      const before = JSON.stringify(fresh)
      const built = applyBattlefield(fresh, field)
      assert.equal(JSON.stringify(fresh), before, 'applyBattlefield is pure')
      const where = team + ' ' + field.title + ' seed ' + seed
      assert.equal(
        built.units.length,
        (field.fighters ?? []).length,
        where + ' places every fighter',
      )
      for (const unit of built.units) {
        assert.equal(unit.summonedRound, 0, where + ' veterans strike at once')
        for (const side of ['player', 'enemy'] as const) {
          const home = flagHome(built, side)
          assert.ok(
            unit.x !== home.x || unit.y !== home.y,
            where + ' keeps flags clear',
          )
        }
      }
      assert.equal(
        built.traps.filter((trap) => trap.set).length,
        (field.traps ?? []).length,
        where + ' arms every set-piece trap',
      )
      assert.equal(built.maxRounds, field.rounds ?? fresh.maxRounds)
      assert.equal(built.bases.player, field.bases?.player ?? 16)
      assert.equal(built.bases.enemy, field.bases?.enemy ?? 16)
      assert.equal(built.holdout === true, field.objective === 'holdout')
      assert.equal(built.heist === true, field.objective === 'heist')
      assert.equal(built.monster?.hp ?? null, field.beast?.hp ?? null)
      if (built.monster) {
        assert.ok(
          !built.units.some(
            (u) => u.x === built.monster!.x && u.y === built.monster!.y,
          ),
        )
        assert.equal(
          built.monster.x,
          field.beast!.col ?? built.monster.x,
          where + ' beast column',
        )
      }
    }
    // TURF story bouts have no bases or fighters: the field stays off.
    const turf = createMatch(
      'turf',
      team,
      FACTION_CAMPAIGNS[team].chapters[index]!.foe,
      SEEDS[0],
    )
    assert.equal(applyBattlefield(turf, field), turf)
  })

// --- Engine hooks: HOLD OUT, HEIST, set traps, the beast's square ----------
const holdField: CampaignBattlefield = {
  title: 'TEST HOLD',
  objective: 'holdout',
  briefing: 'x',
  rounds: 8,
}
{
  let state = applyBattlefield(
    createMatch('blackout', 'ironjaw', 'exchange', 77),
    holdField,
  )
  state.units = []
  state.piles = { player: [], enemy: [] }
  state.hands = { player: [], enemy: [] }
  state.round = 8
  state.bases.player = 1
  state.bases.enemy = 16
  state = advance(state)
  assert.equal(state.victor, 'player', 'a base standing at the bell holds')
  assert.equal(state.winPath, 'time')
  let stolen = applyBattlefield(
    createMatch('blackout', 'ironjaw', 'exchange', 77),
    holdField,
  )
  stolen.round = 8
  stolen.units = []
  stolen.piles = { player: [], enemy: [] }
  stolen.hands = { player: [], enemy: [] }
  stolen.flags.player.carrier = 999
  stolen = advance(stolen)
  assert.equal(stolen.victor, 'enemy', 'a stolen flag at the bell loses')
}
{
  const heistField: CampaignBattlefield = {
    title: 'TEST HEIST',
    objective: 'heist',
    briefing: 'x',
  }
  let state = applyBattlefield(
    createMatch('blackout', 'riot', 'ironjaw', 91),
    heistField,
  )
  for (let i = 0; i < 40 && !state.victor; i++)
    state = advance(cpuTurn(state, 'player'))
  assert.equal(state.bases.enemy, 16, 'the vault never takes damage')
  assert.notEqual(state.winPath, 'base')
  assert.ok(
    state.victor === 'enemy' || state.winPath === 'flag',
    'a heist is won only by a flag run',
  )
}
{
  // Set-piece traps never use up a crew's own trap slot.
  const field = campaignBattlefield('undertow', 0)!
  const state = fieldMatch('undertow', 0, 'conviction', SEEDS[0]!)
  assert.equal(state.traps.filter((t) => t.side === 'player').length, 3)
  // Deal the crew's trap card into hand: its own slot is still open.
  state.hands.player = ['tripwire', ...state.hands.player.slice(1)]
  state.mana = 10
  const free = [5, 6, 7]
    .flatMap((x) => [0, 1, 2, 3, 4, 5].map((y) => ({ x, y })))
    .find(
      (c) =>
        !state.traps.some((t) => t.x === c.x && t.y === c.y) &&
        !state.units.some((u) => u.x === c.x && u.y === c.y),
    )!
  const armed = deployAs(state, 'player', 'tripwire', free.x, free.y)
  assert.equal(
    armed.traps.length,
    state.traps.length + 1,
    field.title + ': the crew can still arm its own trap card',
  )
  // A beast standing in your deploy zone blocks that square.
  const press = fieldMatch('ironjaw', 3, 'conviction', SEEDS[1]!)
  const lair = press.monster!
  assert.equal(lair.x, 1)
  press.hands.player = ['scrapper', ...press.hands.player.slice(1)]
  press.mana = 10
  assert.equal(
    deployAs(press, 'player', 'scrapper', lair.x, lair.y),
    press,
    'nothing deploys onto the beast',
  )
  const beside = lair.y === 0 ? 1 : lair.y - 1
  assert.notEqual(
    deployAs(press, 'player', 'scrapper', lair.x, beside),
    press,
    'the square beside the beast is still open',
  )
}

// --- Winnable by seeded play, never by doing nothing ----------------------
/** A seeded player: the CPU's own choices, plus DEFEND orders in a HOLD OUT. */
function play(state: MatchState, idle: boolean): MatchState {
  let current = state
  for (let guard = 0; guard < 200 && !current.victor; guard++) {
    if (!idle) {
      current = cpuTurn(current, 'player')
      if (current.holdout)
        for (const unit of current.units)
          if (unit.side === 'player' && unit.stance !== 'defend')
            current = stanceAs(current, 'player', unit.id, 'defend')
    }
    current = advance(current)
  }
  return current
}

const firstWin: Record<string, number> = {}
for (const team of crews)
  for (let index = 0; index < 5; index++)
    for (const choice of approaches) {
      const where = team + ' chapter ' + (index + 1) + ' ' + choice
      let wins = 0
      for (const seed of SEEDS) {
        const done = play(fieldMatch(team, index, choice, seed), false)
        assert.ok(done.victor, where + ' finishes')
        if (done.victor === 'player') {
          wins++
          firstWin[team + ':' + index + ':' + choice] ??= seed
        }
        const idle = play(fieldMatch(team, index, choice, seed), true)
        assert.notEqual(idle.victor, 'player', where + ' idle never wins')
      }
      assert.ok(wins >= 2, where + ' is winnable by seeded play (' + wins + ')')
    }

// --- Reachability: each campaign plays through to its ending ----------------
for (const team of crews) {
  let save = createCampaignSave()
  for (let index = 0; index < 5; index++) {
    const chapter = campaignChapter(save, team)!
    assert.equal(chapter, FACTION_CAMPAIGNS[team].chapters[index])
    const choice = approaches[index % 2]!
    // A lost bout records the attempt but never advances the story.
    const lossSeed = SEEDS.find(
      (seed) =>
        play(fieldMatch(team, index, choice, seed, save), false).victor !==
        'player',
    )
    if (lossSeed !== undefined) {
      const lost = play(fieldMatch(team, index, choice, lossSeed, save), false)
      const after = resolveCampaignBattle(
        save,
        team,
        index,
        chapter.foe,
        choice,
        lost.victor!,
      )
      assert.equal(after[team].wins, index, team + ' loss holds the chapter')
    }
    const seed = SEEDS.find(
      (s) =>
        play(fieldMatch(team, index, choice, s, save), false).victor ===
        'player',
    )
    assert.ok(
      seed !== undefined,
      team + ' chapter ' + (index + 1) + ' winnable mid-campaign',
    )
    const won = play(fieldMatch(team, index, choice, seed!, save), false)
    save = resolveCampaignBattle(
      save,
      team,
      index,
      chapter.foe,
      choice,
      won.victor!,
    )
    assert.equal(save[team].wins, index + 1)
  }
  assert.equal(campaignChapter(save, team), null)
  assert.ok(campaignEnding(save, team), team + ' reaches its ending')
  // Saves: the finished campaign round-trips through the account story shape.
  const story = { ...newSlimeCityStory(), campaigns: save }
  const restored: unknown = JSON.parse(JSON.stringify(story))
  assert.ok(validSlimeCityStory(restored), team + ' save stays valid')
}

// --- Wiring: story bouts build the field; the UI shows it -------------------
const store = readFileSync(
  new URL('../../stores/slimeCity.ts', import.meta.url),
  'utf8',
)
assert.match(store, /applyBattlefield\(termed, field\)/)
const panel = readFileSync(
  new URL('../../components/slime-city-campaign.vue', import.meta.url),
  'utf8',
)
assert.match(panel, /data-testid="slime-campaign-field"/)
const arena = readFileSync(
  new URL('../../components/slime-city-arena.vue', import.meta.url),
  'utf8',
)
assert.match(arena, /data-testid="slime-bout-objective"/)

console.log(
  'Slime City campaign battlefields: 30 authored fields, 4 objectives, ' +
    Object.keys(firstWin).length +
    ' seeded-winnable chapter approaches, idle never wins, six campaigns reach their endings PASS',
)
