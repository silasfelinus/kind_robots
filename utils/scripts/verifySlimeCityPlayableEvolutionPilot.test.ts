// The useful-but-fragile L1 -> synergistic L2 -> counterable L3
// design contract, tested against real Clash state and commands.
import assert from 'node:assert/strict'
import {
  applyClashCommand,
  canClashPlay,
  clashCardText,
  clashPlayCost,
  clashPower,
  chooseClashCpu,
  createClash,
  endClashTurn,
  playClash,
  replayClash,
  strikeClash,
  type ClashUnit,
} from '../slimeCity/clash'
import {
  clashEvolutionStage,
  clashEvolutionChoice,
  clashEvolutionStats,
  clashStageTitle,
} from '../slimeCity/clashEvolutions'
import {
  allianceProblems,
  allianceStarter,
  soloProblems,
  soloStarter,
} from '../slimeCity/alliance'
import { cardById, CARDS, type Side } from '../slimeCity/prototypes'

const bridge = 's2-ironjaw-union-bridgebearer'
const dread = 's3-ironjaw-dreadnought'
const encore = 's3-bloodfairies-encore'
const unit = (
  side: Side,
  lane: number,
  uid: number,
  extra: Partial<ClashUnit> = {},
): ClashUnit => ({
  uid,
  side,
  lane,
  cardId: side === 'player' ? 'scrapper' : 'pogo',
  hp: 8,
  maxHp: 8,
  attack: 2,
  armor: 0,
  keywords: [],
  surge: 0,
  rooted: false,
  ambushUsed: false,
  attacked: false,
  fresh: false,
  gear: [],
  level: 1,
  ...extra,
})
const first = (id: string, level: number, lane = 2) => {
  const s = createClash('ironjaw', 'bloodfairies', 22910 + level)
  s.round = 3
  s.phase = 'play'
  s.plays.player = 0
  s.hands.player = [id]
  s.units = []
  s.levels.player[id] = level
  return playClash(s, 'player', id, lane)
}
const find = (s: ReturnType<typeof createClash>, side: Side, lane: number) =>
  s.units.find((u) => u.side === side && u.lane === lane)

// The first play *does something*. Bridge is still a useful blocker even
// if its vulnerable apprentice is immediately removed by an opposing spell.
{
  const card = cardById(bridge)
  assert.ok(clashEvolutionStage(bridge, 1)?.abilities.length)
  assert.ok(clashCardText(card, 1).includes('summon 1/2'))
  assert.equal(
    clashEvolutionStage('s1-roof-phantom', 1),
    undefined,
    'unchanged cards do not acquire a phantom L1 rule',
  )
  const s = first(bridge, 1)
  assert.equal(s.levels.player[bridge], 2)
  assert.equal(find(s, 'player', 2)?.token, undefined)
  const apprentice = find(s, 'player', 1)
  assert.equal(apprentice?.token, true)
  assert.equal(apprentice.hp, 2)
  assert.equal(apprentice.attack, 1)
  // A real rival play counteracts the early investment. The bridge itself
  // remains, but its nearby combo is interrupted.
  const answer = structuredClone(s)
  answer.active = 'enemy'
  answer.phase = 'play'
  answer.plays.enemy = 0
  answer.hands.enemy = ['pinprick']
  assert.equal(canClashPlay(answer, 'enemy', 'pinprick', 1), true)
  const counter = playClash(answer, 'enemy', 'pinprick', 1)
  assert.equal(find(counter, 'player', 1), undefined, 'apprentice is fragile')
  assert.ok(find(counter, 'player', 2), 'the original defender did a job')
  assert.deepEqual(playClash(answer, 'enemy', 'pinprick', 1), counter)
}
{
  const s = first(bridge, 2)
  const apprentice = find(s, 'player', 1)!
  assert.ok(apprentice.token)
  assert.equal(apprentice.hp, 3, 'L2 apprentices now hold a better line')
  assert.ok(
    clashPower(s, apprentice) > apprentice.attack,
    'adjacent L2 bridge provides real combo power to its worker',
  )
}
{
  const s = first(bridge, 3)
  const lead = find(s, 'player', 2)!
  assert.equal(clashPower(s, lead), 0, 'L3 bridge deliberately stops striking')
  for (const lane of [1, 3]) {
    const apprentice = find(s, 'player', lane)!
    assert.ok(apprentice.token)
    assert.equal(apprentice.hp, 4)
    assert.ok(clashPower(s, apprentice) > apprentice.attack)
  }
  // An enemy can occupy or sweep the lanes: the L3 summon is not
  // unanswerable or an extra collectible card.
  const occupied = createClash('ironjaw', 'bloodfairies', 22935)
  occupied.hands.player = [bridge]
  occupied.levels.player[bridge] = 3
  occupied.units = [unit('player', 1, 51), unit('player', 3, 52)]
  const blocked = playClash(occupied, 'player', bridge, 2)
  assert.equal(blocked.units.filter((u) => u.side === 'player').length, 3)
  assert.equal(blocked.units.filter((u) => u.token).length, 0)
}

// Dreadnought makes a useful opening shield, then protects the bridge's
// produced worker. L3's dangerous weak opening becomes a growing thunder
// engine only if the board holds through actual round-end triggers.
{
  const s = createClash('ironjaw', 'bloodfairies', 22940)
  s.hands.player = [dread]
  s.units = [unit('player', 1, 55)]
  const l1 = playClash(s, 'player', dread, 0)
  assert.equal(find(l1, 'player', 1)?.guard, 1)
  assert.ok(clashCardText(cardById(dread), 1).includes('shield'))
  const levelTwo = structuredClone(s)
  levelTwo.levels.player[dread] = 2
  const l2 = playClash(levelTwo, 'player', dread, 0)
  const holder = find(l2, 'player', 0)!
  assert.ok(holder)
  assert.ok(
    clashEvolutionStage(dread, 2)?.abilities.some((a) => a.when === 'hit'),
  )
  // With a real strike, the convoy keeps its neighbor alive instead of
  // gaining only an invisible +1 stat on the card sheet.
  const duringStrike = structuredClone(l2)
  duringStrike.phase = 'attack'
  duringStrike.cursor = 0
  find(duringStrike, 'player', 0)!.fresh = false
  duringStrike.units.push(unit('enemy', 0, 59, { hp: 20, maxHp: 20 }))
  const resolved = strikeClash(duringStrike, 'player')
  assert.equal(
    find(resolved, 'player', 1)?.guard,
    1,
    'L2 gives the real neighboring fighter protection after a hit',
  )
  const levelThree = structuredClone(s)
  levelThree.levels.player[dread] = 3
  levelThree.units.push(unit('enemy', 0, 56, { hp: 12, maxHp: 12 }))
  const l3 = playClash(levelThree, 'player', dread, 0)
  assert.ok(find(l3, 'enemy', 0)!.hp < 12, 'Thunderhead hits on arrival')
  assert.equal(find(l3, 'player', 1)?.guard, 2)
  assert.equal(
    clashEvolutionStats(dread, 3)?.hp,
    -4,
    'L3 deliberately exposes four life of its normal budget',
  )
  assert.equal(clashStageTitle(dread, 3), 'Thunderhead of Scrap')
  assert.ok(clashCardText(cardById(dread), 3).includes('life'))
  // The late payoff is EARNED by surviving a real complete round;
  // it does not appear automatically as an inflated opening body.
  const closing = structuredClone(l3)
  closing.active = 'enemy'
  closing.phase = 'attack'
  closing.cursor = 5
  for (const rival of closing.units.filter((u) => u.side === 'enemy'))
    rival.attacked = true
  const afterRound = endClashTurn(closing, 'enemy')
  assert.notEqual(afterRound, closing)
  assert.ok(
    find(afterRound, 'player', 0)!.attack > find(l3, 'player', 0)!.attack,
  )
  assert.ok(find(afterRound, 'player', 0)!.maxHp > find(l3, 'player', 0)!.maxHp)
}

// A playable first-verse buff costs one slot in CLASH only. The chorus
// compounds from one LEECH singer, to three, to all allies or a dangerous
// volatile soloist. Its early plan can be stopped by killing the singer.
{
  assert.equal(cardById(encore).cost, 4, 'legacy card definition untouched')
  assert.equal(clashPlayCost(cardById(encore)), 1, 'one-slot CLASH support')
  const old = createClash('bloodfairies', 'ironjaw', 22960)
  old.hands.player = [encore]
  old.units = [
    unit('player', 2, 60),
    unit('player', 1, 61),
    unit('player', 3, 62),
  ]
  assert.ok(canClashPlay(old, 'player', encore, 2))
  const l1 = playClash(old, 'player', encore, 2)
  assert.equal(l1.plays.player, 1)
  assert.ok(find(l1, 'player', 2)?.keywords.includes('leech'))
  assert.ok(!find(l1, 'player', 1)?.keywords.includes('leech'))
  assert.deepEqual(playClash(old, 'player', encore, 2), l1)
  const levelTwo = structuredClone(old)
  levelTwo.levels.player[encore] = 2
  const l2 = playClash(levelTwo, 'player', encore, 2)
  for (const lane of [1, 2, 3])
    assert.ok(find(l2, 'player', lane)?.keywords.includes('leech'))
  const options = clashEvolutionChoice(encore, 3)
  assert.equal(options?.length, 2)
  const levelThree = structuredClone(old)
  levelThree.levels.player[encore] = 3
  levelThree.fallen = { player: ['pogo'], enemy: [] }
  const encoreAct = playClash(levelThree, 'player', encore, 2)
  assert.equal(encoreAct.units.filter((u) => u.side === 'player').length, 4)
  assert.ok(
    encoreAct.units
      .filter((u) => u.side === 'player')
      .every((u) => u.keywords.includes('leech')),
  )
  const dangerous = playClash(levelThree, 'player', encore, 2, 1)
  assert.ok(find(dangerous, 'player', 2)?.keywords.includes('volatile'))
  assert.ok(find(dangerous, 'player', 1)?.keywords.includes('leech'))
  assert.equal(dangerous.units.filter((u) => u.side === 'player').length, 3)
  const cpu = structuredClone(levelThree)
  cpu.hands.player = [encore]
  assert.equal(chooseClashCpu(cpu, 'player').t, 'play')
  const cpuNoCasualty = structuredClone(cpu)
  cpuNoCasualty.fallen = { player: [], enemy: [] }
  const choice = chooseClashCpu(cpuNoCasualty, 'player')
  assert.equal(choice.t, 'play')
  if (choice.t === 'play') assert.equal(choice.choice, 1)
}

// Both legal formats execute the *real command interpreter* and replay
// deterministically. These are deliberately small bounded game samples,
// not a spurious claim about all 300 cards' matchup balance.
const includeCards = (deck: string[], wanted: string[]): string[] => {
  const keep = deck.filter((id) => !wanted.includes(id))
  return [...wanted, ...keep.slice(0, deck.length - wanted.length)]
}
const solo = includeCards(soloStarter('ironjaw'), [bridge, dread])
assert.deepEqual(soloProblems('ironjaw', solo), [])
const alliance = allianceStarter('ironjaw', 'bloodfairies')
alliance.cards = includeCards(alliance.cards, [bridge, dread, encore])
assert.deepEqual(allianceProblems(alliance), [])
assert.equal(CARDS.length, 300, 'no additional collectible identities')
for (const format of ['standard', 'alliance'] as const) {
  for (const seed of [22980, 22981]) {
    const options =
      format === 'alliance'
        ? {
            alliance: {
              player: alliance,
              enemy: allianceStarter('bloodfairies', 'ironjaw'),
            },
          }
        : { decks: { player: solo } }
    let state = createClash('ironjaw', 'bloodfairies', seed, options)
    let moves = 0
    while (!state.victor && moves++ < 900) {
      const command = chooseClashCpu(state, state.active)
      const next = applyClashCommand(state, command)
      assert.notEqual(next, state, 'CPU makes a legal move')
      state = next
    }
    assert.ok(state.victor, format + ' resolves within replay bounds')
    assert.deepEqual(
      replayClash('ironjaw', 'bloodfairies', seed, state.commands, options),
      state,
      format + ' replay including all level-one effects is exact',
    )
  }
}
console.log(
  'Slime City playable evolution pilot: Bridgebearer apprentices, Dreadnought investment, Bloodfairy encore and two-format command replays PASS',
)
