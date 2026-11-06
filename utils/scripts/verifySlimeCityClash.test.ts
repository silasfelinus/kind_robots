// Fun-first Clash contract: automatic combat, simultaneous hits, placement,
// replacement, banked mana, legal CPU decisions and deterministic replays.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { alleyDeck } from '../slimeCity/alleys'
import { cardById } from '../slimeCity/prototypes'
import {
  CLASH_BOSS_HP,
  CLASH_HAND_SIZE,
  CLASH_LANES,
  CLASH_PLAYS,
  CLASH_ROUND_LIMIT,
  applyClashCommand,
  canClashPlay,
  chooseClashCpu,
  clashCardText,
  clashUnitAt,
  createClash,
  passClash,
  playClash,
  replayClash,
  type ClashState,
  type ClashUnit,
} from '../slimeCity/clash'

function mock(
  side: 'player' | 'enemy',
  lane: number,
  uid: number,
  hp = 2,
  attack = 2,
): ClashUnit {
  return {
    uid,
    side,
    lane,
    cardId: side === 'player' ? 'lynx' : 'scrapper',
    hp,
    maxHp: hp,
    attack,
    armor: 0,
    keywords: [],
    surge: 0,
    rooted: false,
    ambushUsed: false,
    gear: [],
  }
}
function fourPasses(input: ClashState): ClashState {
  let s = input
  for (let i = 0; i < CLASH_PLAYS * 2; i++) s = passClash(s, s.active)
  return s
}

const adminPage = readFileSync('pages/admin/slime-city.vue', 'utf8')
assert.match(adminPage, /v-if="user\.isAdmin"[\s\S]*data-testid="slime-clash-tab"/)
assert.match(adminPage, /<SlimeCityClash v-else-if="lab\.view === 'clash' && user\.isAdmin"/)

const a = createClash('catgirls', 'ironjaw', 42)
const b = createClash('catgirls', 'ironjaw', 42)
assert.deepEqual(a, b, 'same seed deals identical hands')
assert.equal(a.hands.player.length, CLASH_HAND_SIZE)
assert.equal(a.hands.enemy.length, CLASH_HAND_SIZE)
assert.equal(alleyDeck('catgirls').length, 20)
assert.equal(a.mana.player, 3)
assert.equal(a.boss.player, CLASH_BOSS_HP)
assert.equal(CLASH_LANES, 5)

const duel = createClash('catgirls', 'ironjaw', 1)
duel.units = [mock('player', 2, 1, 2, 3), mock('enemy', 2, 2, 2, 3)]
const simultaneous = fourPasses(duel)
assert.equal(simultaneous.units.length, 0, 'both creatures strike before dying')
assert.equal(simultaneous.boss.player, CLASH_BOSS_HP)
assert.equal(simultaneous.boss.enemy, CLASH_BOSS_HP)
assert.equal(simultaneous.round, 2)
assert.equal(simultaneous.mana.player, 6, 'unspent mana banks to 6')
assert.ok(simultaneous.log.some((e) => e.text.includes('falls')))

const open = createClash('catgirls', 'ironjaw', 11)
open.units = [mock('player', 1, 1, 3, 4)]
const post = fourPasses(open)
assert.equal(
  post.boss.enemy,
  CLASH_BOSS_HP - 4,
  'open lane attacks boss automatically',
)
assert.equal(post.boss.player, CLASH_BOSS_HP)
assert.ok(post.log.some((e) => e.kind === 'boss'))

const replace = createClash('catgirls', 'ironjaw', 12)
replace.hands.player = ['lynx', 'shredders']
replace.mana.player = 6
replace.units = [mock('player', 0, 99)]
assert.equal(canClashPlay(replace, 'player', 'lynx', 0), true)
const replaced = playClash(replace, 'player', 'lynx', 0)
assert.equal(replaced.units.length, 1, 'single slot stays single')
assert.notEqual(replaced.units[0]!.uid, 99)
assert.ok(replaced.discards.player.includes('lynx'), 'replaced unit discarded')
assert.equal(replaced.plays.player, 1)
assert.equal(replaced.active, 'enemy', 'plays alternate')
assert.equal(
  playClash(replaced, 'player', 'shredders', 0),
  replaced,
  'no double action',
)
assert.equal(
  playClash(replace, 'player', 'missing-card', 0),
  replace,
  'missing card rejected',
)

const gear = createClash('catgirls', 'ironjaw', 13)
gear.units = [mock('player', 3, 55)]
gear.hands.player = ['shredders']
gear.mana.player = 5
const equipped = playClash(gear, 'player', 'shredders', 3)
assert.equal(equipped.units[0]!.attack, 3)
assert.deepEqual(equipped.units[0]!.gear, ['shredders'])
assert.match(
  clashCardText(cardById('spurs')),
  /attack/,
  'no phantom movement AP',
)
assert.doesNotMatch(clashCardText(cardById('overclock')), /AP|movement/)

const mine = createClash('catgirls', 'ironjaw', 14)
mine.traps = [{ side: 'enemy', lane: 0, cardId: 'shocktrap' }]
mine.hands.player = ['lynx']
mine.mana.player = 5
const sprung = playClash(mine, 'player', 'lynx', 0)
assert.equal(sprung.traps.length, 0, 'enemy trap consumed by deployment')
assert.equal(sprung.units.length, 0, 'trap damage can defeat the entrant')

const rooted = createClash('catgirls', 'ironjaw', 15)
rooted.units = [
  mock('player', 0, 1, 3, 4),
  { ...mock('enemy', 0, 2), rooted: true },
]
const stopped = fourPasses(rooted)
assert.equal(
  stopped.units.some((u) => u.side === 'player'),
  true,
  'rooted defender did not retaliate',
)
assert.equal(stopped.boss.player, CLASH_BOSS_HP)

let cpu = createClash('catgirls', 'ironjaw', 42)
for (let i = 0; i < 100 && !cpu.victor; i++) {
  const command = chooseClashCpu(cpu, cpu.active)
  const next = applyClashCommand(cpu, command)
  assert.notEqual(next, cpu, 'CPU never chooses an illegal or blocked action')
  cpu = next
}
assert.ok(cpu.round <= CLASH_ROUND_LIMIT)
assert.ok(cpu.victor, 'bounded matches end with a result')
const replay = replayClash('catgirls', 'ironjaw', 42, cpu.commands)
assert.deepEqual(replay, cpu, 'all commands replay exactly')

console.log(
  'Clash: deterministic decks, replacement, simultaneous combat, effects, CPU and replay pass',
)
