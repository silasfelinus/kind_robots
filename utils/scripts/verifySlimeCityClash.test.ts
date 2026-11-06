// Canonical Slime City CLASH regression suite. Legacy formats are intentionally
// not used for balance acceptance; all 300 cards have Clash-only profiles.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { alleyDeck } from '../slimeCity/alleys'
import { CARDS, TEAMS, cardById, type Side } from '../slimeCity/prototypes'
import {
  CLASH_BOSS_HP,
  CLASH_DECK_SIZE,
  CLASH_HAND_SIZE,
  CLASH_LANES,
  CLASH_PLAYS,
  CLASH_ROUND_LIMIT,
  applyClashCommand,
  attackClash,
  canClashAttack,
  canClashPlay,
  chooseClashCpu,
  clashBalance,
  clashCardText,
  clashPlayCost,
  createClash,
  endClashTurn,
  passClash,
  playClash,
  replayClash,
  type ClashState,
  type ClashUnit,
} from '../slimeCity/clash'

function follower(
  side: Side,
  lane: number,
  uid: number,
  hp = 4,
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
    attacked: false,
    gear: [],
  }
}
function finishTurn(input: ClashState): ClashState {
  let s = input
  const side = s.active
  if (s.phase === 'play') s = passClash(s, side)
  return endClashTurn(s, side)
}
function finishRound(input: ClashState): ClashState {
  const s = finishTurn(input)
  return finishTurn(s)
}

const playPage = readFileSync('pages/play/slime-city.vue', 'utf8')
const gamePage = readFileSync('pages/admin/slime-city.vue', 'utf8')
const store = readFileSync('stores/slimeCity.ts', 'utf8')
const view = readFileSync('components/slime-city-clash.vue', 'utf8')
assert.match(playPage, /<SlimeCityGame \/>/)
assert.match(store, />\('clash'\)/, 'Clash is the starting game view')
assert.match(gamePage, /data-testid="slime-clash-tab"/)
assert.match(gamePage, /data-testid="slime-legacy-toggle"/)
assert.match(gamePage, /<select[\s\S]*data-testid="slime-legacy-toggle"/)
assert.doesNotMatch(gamePage, /v-if="legacyOpen"/)
assert.match(gamePage, /data-testid="slime-collection-tab"/)
assert.match(gamePage, /data-testid="slime-gallery-tab"/)
assert.match(gamePage, /data-testid="slime-rewards-tab"/)
assert.match(gamePage, /<SlimeCityClash v-else-if="lab\.view === 'clash'"/)
assert.doesNotMatch(gamePage, /Clash[^\n]*user\.isAdmin/)
assert.match(view, /data-testid="clash-attack-boss"/)
assert.match(view, /chooseClashCpu/)
assert.match(view, /clashPlayCost/)
assert.doesNotMatch(view, /class="clash-top"/)
assert.doesNotMatch(view, /\? RULES/)
assert.doesNotMatch(view, /THE PITWORKS · MAIN EVENT/)
assert.match(view, /slimeArtId\('boards', 'pitworks-blackout'\)/)
assert.match(view, /:fallback-image-id="slimeArtId\('crews'/)
const nav = readFileSync('components/navigation/channel-select.vue', 'utf8')
assert.match(nav, /class="slime-nav-title"/)
const artwork = readFileSync('components/slime-city-artwork.vue', 'utf8')
assert.match(artwork, /fallbackImageId/)
const artStore = readFileSync('stores/slimeCityArt.ts', 'utf8')
assert.match(artStore, /headers: token \? \{ Authorization:/)
assert.doesNotMatch(artStore, /if \(!token \|\| images.value\[artImageId\]\) return/)

assert.equal(CLASH_PLAYS, 2)
assert.equal(CLASH_LANES, 5)
assert.equal(CLASH_DECK_SIZE, 20)
assert.equal(CLASH_HAND_SIZE, 5)
for (const team of TEAMS) {
  const deck = alleyDeck(team.id)
  assert.equal(deck.length, 20, team.name + ' 20-card deck')
  assert.equal(new Set(deck).size, 20, team.name + ' distinct cards')
  for (const id of deck) {
    const card = cardById(id)
    assert.ok(card.team === team.id || card.team === 'mercenary')
  }
}
for (const card of CARDS) {
  const b = clashBalance(card)
  assert.ok(b.plays === 1 || b.plays === 2)
  assert.ok(b.attack >= 2 && b.attack <= 5)
  assert.ok(b.hp >= 2 && b.hp <= 9)
  assert.ok(b.armor >= 0 && b.armor <= 1)
  assert.ok(b.power >= 1 && b.power <= 4)
  assert.ok(!/\bAP\b|\bmana\b|\bmovement\b/i.test(clashCardText(card)), card.id)
}
assert.ok(
  CARDS.length >= 300,
  'the entire published roster gets Clash balancing',
)
assert.equal(clashPlayCost(cardById('lynx')), 1)

const initial = createClash('catgirls', 'ironjaw', 42)
assert.deepEqual(initial, createClash('catgirls', 'ironjaw', 42))
assert.equal(initial.hands.player.length, CLASH_HAND_SIZE)
assert.equal(initial.hands.enemy.length, 0, 'rival draws only on its turn')
assert.equal(initial.decks.player.length, CLASH_DECK_SIZE - CLASH_HAND_SIZE)
assert.equal(initial.phase, 'play')
assert.equal(initial.active, 'player')
assert.equal(initial.boss.player, CLASH_BOSS_HP)

const heavy = CARDS.find(
  (c) =>
    c.team === 'catgirls' && c.kind === 'creature' && clashPlayCost(c) === 2,
)!
assert.ok(heavy, 'catgirls have a two-play signature follower')
const special = createClash('catgirls', 'ironjaw', 4)
special.hands.player = [heavy.id, 'lynx']
const paid = playClash(special, 'player', heavy.id, 0)
assert.equal(paid.plays.player, 2)
assert.equal(paid.phase, 'attack', 'a special consumes both plays')
assert.equal(paid.units.length, 1)
assert.equal(canClashPlay(paid, 'player', 'lynx', 1), false)
assert.equal(playClash(paid, 'player', 'lynx', 1), paid)

const normal = createClash('catgirls', 'ironjaw', 6)
normal.hands.player = ['lynx', 'mau']
const first = playClash(normal, 'player', 'lynx', 0)
assert.equal(first.plays.player, 1)
assert.equal(first.phase, 'play')
assert.equal(first.active, 'player', 'both placements belong to same turn')
const second = playClash(first, 'player', 'mau', 1)
assert.equal(second.plays.player, 2)
assert.equal(second.phase, 'attack')
assert.equal(
  second.active,
  'player',
  'attacks follow placements, not rival plays',
)
assert.equal(
  canClashAttack(second, 'player', second.units[0]!.uid, 'boss'),
  true,
)

const trade = createClash('catgirls', 'ironjaw', 11)
trade.phase = 'attack'
trade.units = [follower('player', 0, 1, 4, 3), follower('enemy', 4, 2, 3, 2)]
assert.equal(
  canClashAttack(trade, 'player', 1, 'boss'),
  false,
  'rival followers guard boss globally',
)
assert.equal(
  canClashAttack(trade, 'player', 1, 2),
  true,
  'follower target can be in any lane',
)
assert.equal(
  canClashAttack(trade, 'player', 2, 1),
  false,
  'cannot attack with opposing unit',
)
const struck = attackClash(trade, 'player', 1, 2)
assert.equal(struck.units.length, 1, 'defender fell from three power')
assert.equal(
  struck.units[0]!.hp,
  2,
  'attacker simultaneously took two counter damage',
)
assert.equal(
  struck.units[0]!.attacked,
  true,
  'one attack per follower per turn',
)
assert.equal(canClashAttack(struck, 'player', 1, 'boss'), false)
const extra = follower('player', 2, 3, 4, 2)
struck.units.push(extra)
assert.equal(canClashAttack(struck, 'player', 3, 'boss'), true)
const face = attackClash(struck, 'player', 3, 'boss')
assert.equal(face.boss.enemy, CLASH_BOSS_HP - 2)
assert.ok(face.log.some((x) => x.kind === 'boss'))
assert.equal(attackClash(face, 'player', 3, 'boss'), face)

const healing = createClash('catgirls', 'ironjaw', 13)
healing.phase = 'attack'
healing.units = [follower('player', 2, 1, 5, 3), follower('enemy', 4, 2, 5, 2)]
healing.units[0]!.hp = 2
healing.units[1]!.hp = 3
const recovered = finishRound(healing)
assert.equal(recovered.round, 2)
assert.equal(
  recovered.units[0]!.hp,
  3,
  'living friend heals exactly one after two turns',
)
assert.equal(recovered.units[1]!.hp, 4, 'living foe heals one too')
assert.equal(recovered.hands.player.length, 5)
assert.equal(recovered.hands.enemy.length, 0)

const expiring = createClash('catgirls', 'ironjaw', 15)
const originalHand = [...expiring.hands.player]
const afterPlayer = finishTurn(expiring)
assert.deepEqual(
  afterPlayer.hands.player,
  [],
  'unplayed cards discarded, no carryover',
)
assert.equal(afterPlayer.discards.player.length, 5)
assert.ok(originalHand.every((id) => afterPlayer.discards.player.includes(id)))
assert.equal(afterPlayer.active, 'enemy')
assert.equal(afterPlayer.hands.enemy.length, 5)
const afterRival = finishTurn(afterPlayer)
assert.equal(afterRival.hands.player.length, 5, 'new random hand next round')
assert.ok(afterRival.hands.player.every((id) => !originalHand.includes(id)))
assert.equal(afterRival.hands.enemy.length, 0)

const replace = createClash('catgirls', 'ironjaw', 17)
replace.hands.player = ['lynx']
replace.units = [follower('player', 0, 99)]
const swapped = playClash(replace, 'player', 'lynx', 0)
assert.equal(swapped.units.length, 1)
assert.notEqual(swapped.units[0]!.uid, 99)
assert.ok(swapped.discards.player.includes('lynx'))

const trap = createClash('catgirls', 'ironjaw', 18)
trap.traps = [{ side: 'enemy', lane: 0, cardId: 'shocktrap' }]
trap.hands.player = ['lynx']
const sprung = playClash(trap, 'player', 'lynx', 0)
assert.equal(sprung.traps.length, 0)
assert.equal(sprung.units.length, 0, 'trap knocks out low-life entrant')

const rooted = createClash('catgirls', 'ironjaw', 19)
rooted.phase = 'attack'
rooted.units = [
  { ...follower('player', 0, 1), rooted: true },
  follower('enemy', 1, 2),
]
assert.equal(canClashAttack(rooted, 'player', 1, 2), false)
const afterRoot = finishTurn(rooted)
assert.equal(
  afterRoot.units[0]!.rooted,
  false,
  'root clears after affected turn',
)
assert.equal(afterRoot.active, 'enemy')

// Long adversarial CPU playthroughs on every crew pairing, all rules and replay.
let simulated = 0
let timeoutWinners = 0
for (const player of TEAMS) {
  for (const enemy of TEAMS) {
    for (let seed = 1; seed <= 3; seed++) {
      let s = createClash(player.id, enemy.id, seed)
      for (let step = 0; !s.victor && step < 240; step++) {
        const command = chooseClashCpu(s, s.active)
        const next = applyClashCommand(s, command)
        assert.notEqual(next, s, 'CPU must issue legal actionable commands')
        s = next
      }
      assert.ok(s.victor, player.name + ' vs ' + enemy.name + ' must conclude')
      assert.ok(s.round <= CLASH_ROUND_LIMIT)
      assert.deepEqual(
        replayClash(player.id, enemy.id, seed, s.commands),
        s,
        'seeded replay must be exact',
      )
      timeoutWinners += s.round >= CLASH_ROUND_LIMIT ? 1 : 0
      simulated++
    }
  }
}
console.log(
  'Clash primary contract: ' +
    CARDS.length +
    ' balanced cards, ' +
    simulated +
    ' complete seeded cross-crew CPU games, ' +
    timeoutWinners +
    ' round-limit results; UI, two plays, attacks, recovery and replay pass',
)
