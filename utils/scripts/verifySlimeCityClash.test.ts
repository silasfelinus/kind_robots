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
  CLASH_MAX_LEVEL,
  CLASH_LANES,
  CLASH_PLAYS,
  CLASH_ROUND_LIMIT,
  CLASH_SECOND_SEAT_BONUS,
  CLASH_TRAIT_TEXT,
  applyClashCommand,
  canClashPlay,
  chooseClashCpu,
  clashBalance,
  clashBossMax,
  clashCardBadge,
  clashCardText,
  clashLevel,
  clashPlayCost,
  createClash,
  endClashTurn,
  nextClashStrike,
  passClash,
  playClash,
  replayClash,
  strikeClash,
  type ClashState,
  type ClashUnit,
} from '../slimeCity/clash'
import { sweepClash } from './slimeCityClashBalanceReport'

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
    fresh: false,
    gear: [],
    level: 1,
  }
}
function finishTurn(input: ClashState): ClashState {
  let s = input
  const side = s.active
  if (s.phase === 'play') s = passClash(s, side)
  while (nextClashStrike(s, side) >= 0) s = strikeClash(s, side)
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
assert.doesNotMatch(view, /clash-attack-boss/, 'no manual attack picking')
assert.match(view, /strikeClash/, 'board drives the automatic alley sweep')
const hand = readFileSync('components/slime-city-clash-hand.vue', 'utf8')
const cardFace = readFileSync(
  'components/slime-city-clash-card-face.vue',
  'utf8',
)
assert.match(view, /<SlimeCityClashHand/, 'Clash uses the floating fanned hand')
assert.doesNotMatch(
  view,
  /class="clash-tray"/,
  'the hand takes no layout space',
)
assert.match(
  view,
  /class="clash-hand-zone"/,
  'a fixed zone keeps the board still',
)
assert.match(view, /:data-clash-lane="lane"/, 'alleys accept dragged cards')
assert.match(hand, /data-testid="clash-hand-toggle"/, 'closed hand is an icon')
assert.match(hand, /:aria-expanded="isOpen"/)
assert.match(hand, /data-testid="clash-detail"/, 'tapped fighters show rules')
assert.match(hand, /cxh-deal-enter-active/, 'cards deal out of the icon')
assert.match(hand, /prefers-reduced-motion/)
assert.match(cardFace, /clashCardBadge/, 'hand cards show their effect')
assert.match(cardFace, /:fallback-image-id="[\s\S]*?slimeArtId\(\s*'crews'/)
assert.match(cardFace, /class="ccf-level"/, 'cards show their level')
assert.match(
  hand,
  /data-testid="clash-level-up"/,
  'playing a card shows level up',
)
assert.match(view, /class="clash-stars"/, 'fighters show their level')
assert.match(cardFace, /clashCardText/, 'selected cards show their rules')
assert.match(view, /@keyframes clash-lunge-up/)
assert.match(view, /prefers-reduced-motion/)
assert.match(view, /chooseClashCpu/)
assert.match(view, /clashPlayCost/)
assert.doesNotMatch(view, /class="clash-top"/)
assert.doesNotMatch(view, /\? RULES/)
assert.doesNotMatch(view, /THE PITWORKS · MAIN EVENT/)
assert.match(view, /slimeArtId\('boards', 'pitworks-blackout'\)/)
const nav = readFileSync('components/navigation/channel-select.vue', 'utf8')
assert.match(nav, /class="slime-nav-title"/)
const artwork = readFileSync('components/slime-city-artwork.vue', 'utf8')
assert.match(artwork, /fallbackImageId/)
const artStore = readFileSync('stores/slimeCityArt.ts', 'utf8')
assert.match(artStore, /headers: token \? \{ Authorization:/)
assert.doesNotMatch(
  artStore,
  /if \(!token \|\| images.value\[artImageId\]\) return/,
)

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
  for (let level = 1; level <= CLASH_MAX_LEVEL; level++) {
    const b = clashBalance(card, level)
    assert.equal(b.level, level)
    assert.ok(b.plays === 1 || b.plays === 2)
    if (card.kind === 'creature') {
      assert.ok(b.attack >= 2 && b.attack <= (b.plays === 2 ? 7 : 5), card.id)
      assert.ok(b.hp >= 2 && b.hp <= (b.plays === 2 ? 17 : 13), card.id)
      assert.ok(b.armor >= 0 && b.armor <= 1)
      for (const k of card.keywords ?? [])
        assert.ok(
          clashCardText(card, level).includes(CLASH_TRAIT_TEXT[k]),
          card.id + k,
        )
    } else assert.ok(b.power >= 1 && b.power <= 7, card.id)
    const badge = clashCardBadge(card, level)
    assert.ok(badge.length > 0 && badge.length < 16, card.id)
    assert.ok(
      !/\bAP\b|\bmana\b|\bmovement\b/i.test(clashCardText(card, level)),
      card.id,
    )
  }
  const low = clashBalance(card, 1)
  const high = clashBalance(card, CLASH_MAX_LEVEL)
  assert.ok(
    card.kind === 'creature'
      ? high.attack * 2 + high.hp > low.attack * 2 + low.hp
      : high.power > low.power || high.bonus > low.bonus,
    card.id + ' is clearly stronger at max level',
  )
  assert.match(clashCardText(card, 1), /Levels up when played/)
  assert.match(clashCardText(card, CLASH_MAX_LEVEL), /Max level\./)
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
assert.equal(
  initial.boss.enemy,
  CLASH_BOSS_HP + CLASH_SECOND_SEAT_BONUS,
  'the second seat starts with a boss-life coin',
)
assert.equal(clashBossMax('enemy'), CLASH_BOSS_HP + CLASH_SECOND_SEAT_BONUS)

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
assert.equal(second.phase, 'attack', 'the second play starts the alley sweep')
assert.equal(second.cursor, 0)
assert.equal(
  nextClashStrike(second, 'player'),
  -1,
  'fresh fighters in empty alleys cannot reach the boss yet',
)
assert.equal(
  endClashTurn(second, 'player').active,
  'enemy',
  'with no ready strikes the turn can end',
)

// Solforge-style leveling: playing a card brings it back one level stronger.
const leveling = createClash('catgirls', 'ironjaw', 8)
leveling.hands.player = ['lynx', 'mau']
assert.equal(clashLevel(leveling, 'player', 'lynx'), 1)
const leveled = playClash(leveling, 'player', 'lynx', 0)
assert.equal(clashLevel(leveled, 'player', 'lynx'), 2, 'played cards level up')
assert.equal(leveled.units[0]!.level, 1, 'the fighter on the board is level 1')
assert.equal(clashLevel(leveled, 'enemy', 'lynx'), 1, 'levels are per crew')
assert.ok(leveled.log.some((x) => /levels up to 2/.test(x.text)))
const veteran = createClash('catgirls', 'ironjaw', 9)
veteran.levels.player.lynx = CLASH_MAX_LEVEL
veteran.hands.player = ['lynx']
const maxed = playClash(veteran, 'player', 'lynx', 1)
assert.equal(clashLevel(maxed, 'player', 'lynx'), CLASH_MAX_LEVEL, 'caps at 3')
assert.equal(
  maxed.units[0]!.maxHp,
  clashBalance(cardById('lynx'), CLASH_MAX_LEVEL).hp,
)
assert.ok(
  maxed.units[0]!.attack > clashBalance(cardById('lynx'), 1).attack,
  'a level-3 fighter hits harder than its level-1 debut',
)

const lanes = createClash('catgirls', 'ironjaw', 11)
lanes.phase = 'attack'
lanes.units = [
  follower('player', 0, 1, 4, 3),
  follower('enemy', 0, 2, 3, 2),
  follower('player', 2, 3, 4, 2),
  follower('enemy', 4, 4, 5, 2),
]
assert.equal(nextClashStrike(lanes, 'player'), 0, 'sweep starts at alley 1')
assert.equal(
  endClashTurn(lanes, 'player'),
  lanes,
  'cannot skip pending alley strikes',
)
const struck = strikeClash(lanes, 'player')
assert.equal(struck.strike?.lane, 0)
assert.equal(struck.strike?.target, 'unit')
assert.equal(struck.strike?.dealt, 3)
assert.equal(struck.strike?.returned, 2, 'blocker strikes back at once')
assert.equal(struck.strike?.defenderFell, true)
assert.equal(struck.units.length, 3, 'defender fell from three power')
assert.equal(
  struck.units.find((u) => u.uid === 1)!.hp,
  2,
  'attacker simultaneously took two counter damage',
)
assert.equal(
  struck.units.find((u) => u.uid === 4)!.hp,
  5,
  'fighters in other alleys are never targeted',
)
assert.equal(nextClashStrike(struck, 'player'), 2, 'sweep moves left to right')
const face = strikeClash(struck, 'player')
assert.equal(face.strike?.target, 'boss')
assert.equal(face.boss.enemy, clashBossMax('enemy') - 2)
assert.ok(face.log.some((x) => x.kind === 'boss'))
assert.equal(nextClashStrike(face, 'player'), -1)
assert.equal(strikeClash(face, 'player'), face)
assert.equal(endClashTurn(face, 'player').active, 'enemy')

const brawl = createClash('catgirls', 'ironjaw', 12)
brawl.phase = 'attack'
brawl.units = [
  { ...follower('player', 1, 1, 4, 2), fresh: true },
  follower('enemy', 1, 2, 4, 2),
]
assert.equal(
  nextClashStrike(brawl, 'player'),
  1,
  'a fresh fighter still brawls with a blocker',
)

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
assert.equal(recovered.boss.enemy, clashBossMax('enemy') - 3)
assert.equal(recovered.boss.player, CLASH_BOSS_HP - 2)
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
trap.traps = [{ side: 'enemy', lane: 0, cardId: 'shocktrap', level: 1 }]
trap.hands.player = ['lynx']
const sprung = playClash(trap, 'player', 'lynx', 0)
assert.equal(sprung.traps.length, 0)
assert.ok(
  sprung.units.length === 0 || sprung.units[0]!.hp < sprung.units[0]!.maxHp,
  'trap springs on a fighter landing across it',
)

const tripwire = createClash('catgirls', 'ironjaw', 21)
tripwire.phase = 'attack'
tripwire.units = [follower('player', 3, 1, 9, 3)]
tripwire.traps = [{ side: 'enemy', lane: 3, cardId: 'shocktrap', level: 1 }]
const tripped = strikeClash(tripwire, 'player')
assert.equal(tripped.traps.length, 0, 'unblocked strike springs the trap')
assert.equal(tripped.boss.enemy, clashBossMax('enemy'), 'the trap eats the hit')
assert.ok(tripped.units[0]!.hp < 9)

const rooted = createClash('catgirls', 'ironjaw', 19)
rooted.phase = 'attack'
rooted.units = [
  { ...follower('player', 1, 1), rooted: true },
  follower('enemy', 1, 2),
]
assert.equal(nextClashStrike(rooted, 'player'), -1, 'stunned fighter skips')
const afterRoot = finishTurn(rooted)
assert.equal(
  afterRoot.units[0]!.rooted,
  false,
  'root clears after affected turn',
)
assert.equal(afterRoot.active, 'enemy')

// Balance acceptance (2026-11-07 Clash rebalance): CPU sweeps across every crew
// pairing keep each crew and the first seat near even. Report:
// npx tsx utils/scripts/slimeCityClashBalanceReport.ts 150 9000
const sweep = sweepClash(10, 700)
assert.ok(
  sweep.firstSeatWins / sweep.games > 0.4 &&
    sweep.firstSeatWins / sweep.games < 0.62,
  'first seat advantage stays small',
)
assert.ok(sweep.roundLimit / sweep.games < 0.1, 'matches end by knockout')
for (const [crew, r] of Object.entries(sweep.crews))
  assert.ok(
    r.wins / r.games > 0.35 && r.wins / r.games < 0.65,
    crew + ' win rate ' + ((100 * r.wins) / r.games).toFixed(1) + '%',
  )

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
    ' round-limit results; UI, two plays, alley strikes, traps, recovery, balance and replay pass',
)
