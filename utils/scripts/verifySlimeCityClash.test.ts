// Canonical Slime City CLASH regression suite. Legacy formats are intentionally
// not used for balance acceptance; all 300 cards have Clash-only profiles.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { alleyDeck } from '../slimeCity/alleys'
import { CLASH_TWISTS } from '../slimeCity/clashTwists'
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
  clashDeck,
  clashPower,
  clashBossMax,
  clashCardBadge,
  clashCardText,
  clashLevel,
  clashPlayCost,
  clashPlayLimit,
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
import { clashSpectacle } from '../slimeCity/clashSpectacle'

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
// Silas, 2026-11-08 PT: "we don't need the legacy modes, period."
assert.doesNotMatch(gamePage, /slime-legacy-toggle/)
assert.doesNotMatch(gamePage, /<SlimeCityArena|<SlimeCityAlleys/)
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
  /data-testid="clash-level-tabs"/,
  'players can preview upgraded versions',
)
assert.match(
  hand,
  /data-testid="clash-level-up"/,
  'playing a card shows level up',
)
assert.match(view, /class="clash-stars"/, 'fighters show their level')
assert.match(view, /<SlimeCityClashMoment :moment="spectacle"/)
assert.match(
  view,
  /commit\(strikeClash\(/,
  'strike VFX follows a committed command',
)
assert.match(view, /commit\(useClashPower\(/, 'general powers receive VFX')
const spectacleFace = readFileSync(
  'components/slime-city-clash-moment.vue',
  'utf8',
)
assert.match(spectacleFace, /<SlimeCityArtwork/, 'spectacle uses real card art')
assert.match(spectacleFace, /data-testid="clash-spectacle"/)
assert.match(
  spectacleFace,
  /prefers-reduced-motion/,
  'spectacle respects reduced motion',
)
assert.match(
  spectacleFace,
  /pointer-events: none/,
  'VFX do not steal lane taps',
)
assert.match(
  spectacleFace,
  /scx-legend/,
  'level-three moments are visually distinct',
)
assert.match(spectacleFace, /scx-effect-heal/, 'healing has a dedicated look')
assert.match(
  spectacleFace,
  /scx-effect-blast/,
  'explosions have a dedicated look',
)
assert.match(
  spectacleFace,
  /scx-effect-summon/,
  'summons have a dedicated look',
)

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
  const clashOnly = clashDeck(team.id)
  assert.equal(clashOnly.length, 20, 'Clash retains 20 cards')
  assert.equal(new Set(clashOnly).size, 20, 'Clash has distinct IDs')
  assert.equal(
    clashOnly.filter((id) => cardById(id).team === 'mercenary').length,
    1,
    'each crew has one accessible mercenary guest',
  )
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
      const nonattacker =
        level === 3 &&
        ['calico', 'watcher', 'merc-roof-dentist'].includes(card.id)
      const hatchling =
        level === 1 && ['chimera', 'juggernaut'].includes(card.id)
      assert.ok(
        nonattacker
          ? b.attack === 0
          : hatchling
            ? b.attack === 1
            : b.attack >= 2 && b.attack <= (b.plays === 2 ? 8 : 6),
        card.id,
      )
      assert.ok(b.hp >= 2 && b.hp <= (b.plays === 2 ? 22 : 16), card.id)
      assert.ok(b.armor >= 0 && b.armor <= 1)
      for (const k of card.keywords ?? [])
        assert.ok(
          clashCardText(card, level).includes(CLASH_TRAIT_TEXT[k]),
          card.id + k,
        )
    } else assert.ok(b.power >= 1 && b.power <= 10, card.id)
    const badge = clashCardBadge(card, level)
    assert.ok(badge.length > 0 && badge.length < 16, card.id)
    assert.ok(
      !/\bAP\b|\bmana\b|\bmovement\b/i.test(clashCardText(card, level)),
      card.id,
    )
  }
  const low = clashBalance(card, 1)
  const high = clashBalance(card, CLASH_MAX_LEVEL)
  // Silas, 2026-11-07 PT: "there needs to be real ramping of power between
  // levels 1-3. we want it to be appealing to upgrade in most cases."
  if (card.kind === 'creature') {
    const value = (lv: number): number => {
      const b = clashBalance(card, lv)
      return b.attack * 2 + b.hp
    }
    if (['calico', 'watcher', 'merc-roof-dentist'].includes(card.id)) {
      assert.equal(high.attack, 0, card.id + ' becomes a genuine nonattacker')
      assert.ok(high.hp > low.hp, card.id + ' gains real durability')
      assert.match(clashCardText(card, 3), /Never attacks/)
    } else {
      assert.ok(value(1) < value(2) && value(2) < value(3), card.id + ' ramps')
      assert.ok(
        value(3) >= value(1) * 1.6,
        card.id + ' level 3 is a big upgrade',
      )
    }
  } else assert.ok(high.power > low.power || high.bonus > low.bonus, card.id)
  const faces = [1, 2, 3].map(
    (lv) => clashCardText(card, lv) + '|' + clashCardBadge(card, lv),
  )
  assert.ok(
    faces[0] !== faces[1] && faces[1] !== faces[2],
    card.id + ' visibly improves at every level',
  )
  // Silas, 2026-11-07 PT: no power/toughness or next-level stats in the text.
  for (let level = 1; level <= CLASH_MAX_LEVEL; level++) {
    const text = clashCardText(card, level)
    assert.doesNotMatch(text, /Levels up|Max level|next level/i, card.id)
    assert.doesNotMatch(text, /Costs both card plays|Strikes straight/, card.id)
    if (card.kind === 'creature')
      assert.doesNotMatch(text, /\d+ power, \d+ life/, card.id)
    assert.ok(text.length <= 160, card.id + ' text stays short')
  }
}
assert.ok(
  CARDS.length >= 300,
  'the entire published roster gets Clash balancing',
)
assert.equal(clashPlayCost(cardById('lynx')), 1)
assert.equal(
  Object.keys(CLASH_TWISTS).length,
  15,
  'initial Clash-only ability slice',
)
for (const id of Object.keys(CLASH_TWISTS)) {
  const card = cardById(id)
  assert.ok(
    [
      'catgirls',
      'bloodfairies',
      'ironjaw',
      'riot',
      'undertow',
      'exchange',
      'mercenary',
    ].includes(card.team),
  )
  assert.ok(
    new Set([1, 2, 3].map((lv) => clashCardText(card, lv))).size === 3,
    id + ' meaningful evolution text',
  )
}

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
// Silas, 2026-11-07 PT: "first player should only get one card play, not two."
const opener = createClash('catgirls', 'ironjaw', 3)
assert.equal(
  clashPlayLimit(opener, 'player'),
  1,
  'first player opens with one play',
)
const heavyCard = CARDS.find(
  (c) =>
    c.team === 'catgirls' && c.kind === 'creature' && clashPlayCost(c) === 2,
)!
opener.hands.player = [heavyCard.id, 'calico', 'splice-runner']
assert.equal(
  canClashPlay(opener, 'player', heavyCard.id, 0),
  false,
  'no two-play card on the opening turn',
)
const opened = playClash(opener, 'player', 'calico', 0)
assert.equal(opened.phase, 'attack', 'one play ends the opening placement')
assert.equal(canClashPlay(opened, 'player', 'splice-runner', 1), false)
const rivalOpening = finishTurn(opened)
assert.equal(rivalOpening.active, 'enemy')
assert.equal(clashPlayLimit(rivalOpening, 'enemy'), 2, 'the rival plays two')
const secondRound = finishTurn(rivalOpening)
assert.equal(secondRound.round, 2)
assert.equal(clashPlayLimit(secondRound, 'player'), 2, 'two plays from round 2')

const special = createClash('catgirls', 'ironjaw', 4)
special.round = 2
special.hands.player = [heavy.id, 'lynx']
const paid = playClash(special, 'player', heavy.id, 0)
assert.equal(paid.plays.player, 2)
assert.equal(paid.phase, 'attack', 'a special consumes both plays')
assert.equal(paid.units.length, 1)
assert.equal(canClashPlay(paid, 'player', 'lynx', 1), false)
assert.equal(playClash(paid, 'player', 'lynx', 1), paid)

const normal = createClash('catgirls', 'ironjaw', 6)
normal.round = 2
normal.hands.player = ['calico', 'splice-runner']
const first = playClash(normal, 'player', 'calico', 0)
assert.equal(first.plays.player, 1)
assert.equal(first.phase, 'play')
assert.equal(first.active, 'player', 'both placements belong to same turn')
const second = playClash(first, 'player', 'splice-runner', 1)
assert.equal(second.plays.player, 2)
assert.equal(second.phase, 'attack', 'the second play starts the alley sweep')
assert.equal(second.cursor, 0)
assert.equal(
  nextClashStrike(second, 'player'),
  -1,
  'summoning sickness: fighters wait a turn before striking',
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
  -1,
  'a fresh fighter blocks but does not strike, even with a blocker across',
)
brawl.units[0]!.keywords = ['ambush']
assert.equal(
  nextClashStrike(brawl, 'player'),
  1,
  'Ambush lets a fighter strike the turn it lands',
)
const ambushDebut = createClash('catgirls', 'ironjaw', 16)
ambushDebut.round = 2
ambushDebut.hands.player = ['lynx', 'calico']
const ambushed = playClash(
  playClash(ambushDebut, 'player', 'lynx', 0),
  'player',
  'calico',
  1,
)
assert.equal(nextClashStrike(ambushed, 'player'), 0, 'fresh Ambush strikes')
const afterAmbush = strikeClash(ambushed, 'player')
assert.equal(afterAmbush.strike?.target, 'boss')
assert.equal(
  nextClashStrike(afterAmbush, 'player'),
  -1,
  'the fresh non-Ambush fighter waits',
)

const healing = createClash('catgirls', 'ironjaw', 13)
healing.phase = 'attack'
healing.units = [follower('player', 2, 1, 5, 3), follower('enemy', 4, 2, 5, 2)]
healing.units[0]!.hp = 2
healing.units[1]!.hp = 3
const recovered = finishRound(healing)
assert.equal(recovered.round, 2)
assert.equal(recovered.units[0]!.hp, 2, 'damage sticks between rounds')
assert.equal(recovered.units[1]!.hp, 3, 'rival damage sticks too')
const regen = createClash('catgirls', 'ironjaw', 14)
regen.phase = 'attack'
regen.units = [
  { ...follower('player', 2, 1, 5, 3), hp: 2, keywords: ['regen'] },
  { ...follower('enemy', 4, 2, 5, 2), hp: 3, keywords: ['regen'] },
]
const patched = finishRound(regen)
assert.equal(patched.units[0]!.hp, 3, 'Regen recovers exactly one')
assert.equal(patched.units[1]!.hp, 4, 'rival Regen recovers one')
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

// Version-specific ability acceptance: setup, payoff, counter and replay-safe state.
const hatched = createClash('catgirls', 'ironjaw', 221)
hatched.round = 2
hatched.levels.player.chimera = 3
hatched.hands.player = ['chimera']
const apex = playClash(hatched, 'player', 'chimera', 2)
assert.ok(apex.units[0]!.attack >= 7, 'Madame Chimera becomes an apex threat')
assert.ok(
  clashBalance(cardById('chimera'), 1).attack < 2,
  'apex starts fragile',
)

const chorus = createClash('bloodfairies', 'ironjaw', 222)
chorus.round = 2
chorus.levels.player.sprite = 3
chorus.hands.player = ['sprite']
const joined = playClash(chorus, 'player', 'sprite', 2)
assert.equal(
  joined.units.length,
  3,
  'L3 Bloodsprite fills both adjacent empty alleys',
)
assert.equal(joined.units.filter((u) => u.token).length, 2)
assert.deepEqual(joined.units.map((u) => u.lane).sort(), [1, 2, 3])
assert.equal(joined.hands.player.length, 0, 'tokens cost no extra cards')
const occupied = createClash('bloodfairies', 'ironjaw', 223)
occupied.round = 2
occupied.levels.player.sprite = 3
occupied.hands.player = ['sprite']
occupied.units = [follower('player', 1, 80)]
assert.equal(
  playClash(occupied, 'player', 'sprite', 2).units.length,
  3,
  'no overwrite of occupied allied alley',
)

const medics = createClash('catgirls', 'ironjaw', 224)
medics.phase = 'attack'
medics.units = [
  { ...follower('player', 1, 1, 7, 0), cardId: 'calico', attack: 0, level: 3 },
  { ...follower('player', 2, 2, 9, 3), hp: 2 },
]
assert.equal(clashPower(medics, medics.units[0]!), 0)
assert.equal(
  nextClashStrike(medics, 'player'),
  2,
  'the medic blocks but never attacks',
)
const treated = finishRound(medics)
assert.equal(
  treated.units.find((u) => u.uid === 2)?.hp,
  4,
  'L3 clinic heals neighbor for two',
)

const band = createClash('bloodfairies', 'ironjaw', 225)
band.units = [
  { ...follower('player', 1, 1), cardId: 'queen', level: 3 },
  { ...follower('player', 4, 2), cardId: 'sprite', keywords: ['swarm'] },
]
assert.equal(
  clashPower(band, band.units[1]!),
  3,
  'L3 queen gives a global ally anthem',
)
const spy = createClash('undertow', 'ironjaw', 226)
spy.units = [
  { ...follower('player', 1, 1), cardId: 'watcher', level: 3, attack: 0 },
  follower('enemy', 2, 2),
]
assert.equal(
  clashPower(spy, spy.units[1]!),
  1,
  'L3 watcher weakens adjacent rivals',
)

const transferred = createClash('exchange', 'ironjaw', 227)
transferred.round = 2
transferred.levels.player.broker = 3
transferred.hands.player = ['broker']
transferred.units = [follower('player', 2, 99)]
const bought = playClash(transferred, 'player', 'broker', 2)
assert.equal(bought.units.length, 1, 'broker must sacrifice an occupied ally')
assert.ok(bought.units[0]!.attack > clashBalance(cardById('broker'), 3).attack)
assert.ok(bought.units[0]!.maxHp > clashBalance(cardById('broker'), 3).hp)

const fallenRat = createClash('riot', 'ironjaw', 228)
fallenRat.round = 2
fallenRat.phase = 'attack'
fallenRat.units = [
  { ...follower('player', 1, 1, 2, 3), cardId: 'rat', hp: 1, level: 2 },
  { ...follower('enemy', 1, 2, 10, 3) },
]
const ratAfter = strikeClash(fallenRat, 'player')
assert.equal(ratAfter.deathMarks.player.rat, 1, 'knockout is remembered')
ratAfter.phase = 'play'
ratAfter.plays.player = 0
ratAfter.hands.player = ['rat']
const ratAgain = playClash(ratAfter, 'player', 'rat', 2)
assert.equal(
  ratAgain.units.find((u) => u.side === 'player')?.attack,
  clashBalance(cardById('rat'), 1).attack + 1,
  'a replayed rat is stronger specifically because it died',
)

const unpredictable = createClash('riot', 'ironjaw', 229)
unpredictable.phase = 'attack'
unpredictable.units = [
  { ...follower('player', 1, 1, 6, 3), cardId: 'firebrand', level: 2 },
  { ...follower('enemy', 1, 2, 12, 2) },
]
const rolled = strikeClash(unpredictable, 'player')
assert.ok(
  rolled.log.some((x) => /Firebrand (misfires|doubles its fire)/.test(x.text)),
  'RNG resolution is legible',
)
const sameRoll = strikeClash(structuredClone(unpredictable), 'player')
assert.deepEqual(
  sameRoll,
  rolled,
  'the same seeded Firebrand situation always rolls identically',
)

// Combat choreography is a pure projection of committed gameplay commands.
const theater = createClash('catgirls', 'ironjaw', 811)
theater.hands.player = ['lynx']
const firstEntry = playClash(theater, 'player', 'lynx', 1)
assert.equal(clashSpectacle(theater, firstEntry)?.kind, 'play')
assert.equal(clashSpectacle(theater, firstEntry)?.grade, 'flash')
assert.equal(
  clashSpectacle(firstEntry, firstEntry),
  null,
  'no duplicate cue on rerender',
)
assert.deepEqual(
  clashSpectacle(theater, firstEntry),
  clashSpectacle(structuredClone(theater), structuredClone(firstEntry)),
  'same commands produce identical spectacle cues',
)
const marquee = createClash('catgirls', 'ironjaw', 812)
marquee.round = 2
marquee.levels.player.chimera = 3
marquee.hands.player = ['chimera']
const showcaseApex = playClash(marquee, 'player', 'chimera', 2)
assert.equal(clashSpectacle(marquee, showcaseApex)?.grade, 'legend')
assert.match(clashSpectacle(marquee, showcaseApex)?.eyebrow ?? '', /FINAL FORM/)
assert.equal(clashSpectacle(marquee, showcaseApex)?.cardId, 'chimera')
const nursery = createClash('bloodfairies', 'ironjaw', 813)
nursery.round = 2
nursery.levels.player.sprite = 2
nursery.hands.player = ['sprite']
const dancers = playClash(nursery, 'player', 'sprite', 2)
assert.equal(clashSpectacle(nursery, dancers)?.grade, 'feature')
assert.match(
  clashSpectacle(nursery, dancers)?.detail ?? '',
  /fighters take the field/,
)
const firefight = createClash('catgirls', 'ironjaw', 814)
firefight.phase = 'attack'
firefight.units = [
  follower('player', 0, 101, 7, 6),
  follower('enemy', 0, 102, 2, 2),
]
const critical = strikeClash(firefight, 'player')
assert.equal(clashSpectacle(firefight, critical)?.kind, 'strike')
assert.equal(clashSpectacle(firefight, critical)?.grade, 'feature')
assert.equal(clashSpectacle(firefight, critical)?.eyebrow, 'KNOCKOUT')
const bossBattle = createClash('catgirls', 'ironjaw', 815)
bossBattle.phase = 'attack'
bossBattle.boss.enemy = 4
bossBattle.units = [follower('player', 0, 103, 8, 5)]
const finisher = strikeClash(bossBattle, 'player')
assert.equal(clashSpectacle(bossBattle, finisher)?.kind, 'victory')
assert.equal(clashSpectacle(bossBattle, finisher)?.grade, 'legend')
const hazard = createClash('catgirls', 'ironjaw', 816)
hazard.phase = 'attack'
hazard.units = [follower('player', 3, 104, 9, 3)]
hazard.traps = [{ side: 'enemy', lane: 3, cardId: 'shocktrap', level: 1 }]
const sprungHazard = strikeClash(hazard, 'player')
assert.equal(clashSpectacle(hazard, sprungHazard)?.eyebrow, 'TRAP SPRUNG')
assert.equal(clashSpectacle(hazard, sprungHazard)?.cardId, 'shocktrap')
const general = createClash('catgirls', 'ironjaw', 817)
const generalAfter = structuredClone(general)
generalAfter.commands.push({ t: 'power', side: 'player', lane: 2 })
assert.equal(clashSpectacle(general, generalAfter)?.kind, 'power')
assert.equal(clashSpectacle(general, generalAfter)?.grade, 'legend')
assert.equal(clashSpectacle(nursery, dancers)?.effect, 'summon')
assert.equal(clashSpectacle(hazard, sprungHazard)?.effect, 'trap')
assert.equal(clashSpectacle(general, generalAfter)?.effect, 'power')
const healingShow = createClash('catgirls', 'ironjaw', 818)
healingShow.round = 2
healingShow.hands.player = ['reknit']
healingShow.units = [{ ...follower('player', 1, 111, 9, 2), hp: 3 }]
const healedShow = playClash(healingShow, 'player', 'reknit', 1)
assert.equal(clashSpectacle(healingShow, healedShow)?.effect, 'heal')
const fireworksShow = createClash('riot', 'ironjaw', 819)
fireworksShow.round = 2
fireworksShow.hands.player = ['firestorm']
fireworksShow.units = [follower('enemy', 1, 112, 9, 2)]
const explodedShow = playClash(fireworksShow, 'player', 'firestorm', 1)
assert.equal(clashSpectacle(fireworksShow, explodedShow)?.effect, 'blast')

// Balance acceptance (2026-11-07 Clash rebalance): CPU sweeps across every crew
// pairing keep each crew and the first seat near even. Report:
// npx tsx utils/scripts/slimeCityClashBalanceReport.ts 150 9000
// 40 seeds (1200 games): a 10-seed sample swung the first seat by 13 points.
const sweep = sweepClash(40, 700)
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
