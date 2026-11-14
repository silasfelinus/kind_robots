// Slime City crafted evolutions: the Catgirls pilot (conductor
// projects/slime-city/CLASH-EVOLUTION-PLAN.md, approved 2026-11-08 PT).
// Every pilot card is checked through the real engine: its level stages do
// what the card says, and each level three changes what the card DOES.
import assert from 'node:assert/strict'
import { CARDS, cardById, type Side } from '../slimeCity/prototypes'
import { CLASH_TWISTS } from '../slimeCity/clashTwists'
import { EXCHANGE_EVOLUTIONS } from '../slimeCity/evolutions/exchange'
import {
  CLASH_EVOLUTIONS,
  clashEvolutionChoice,
  clashEvolutionStage,
  clashStageTitle,
} from '../slimeCity/clashEvolutions'
import {
  applyClashCommand,
  activateClash,
  canClashActivate,
  canClashPlay,
  chooseClashCpu,
  clashBalance,
  clashDeck,
  clashCardText,
  clashPower,
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
import { slimeCardArtId, slimeArtId } from '../slimeCity/artManifest'

const PILOT = [
  'splice-runner',
  's1-roof-phantom',
  's1-alley-vet',
  's2-catgirls-parapet-ghost-kitten',
  's3-catgirls-escaped-tiger',
  's3-catgirls-glasswalker',
  'mutual-aid',
  's1-nine-lives',
  's3-catgirls-garrote',
  's3-catgirls-pounce-rig',
  's2-catgirls-backstreet-organ-donor',
]
for (const id of PILOT) assert.ok(CLASH_EVOLUTIONS[id], id + ' is crafted')
for (const id of PILOT) assert.equal(cardById(id).team, 'catgirls', id)
// Silas, 2026-11-08 PT: "300 cards, all need custom better evolutions."
// Every card in the catalog evolves: a hand-built twist or a crafted stage.
for (const card of CARDS)
  assert.ok(
    CLASH_TWISTS[card.id] || CLASH_EVOLUTIONS[card.id],
    card.id + ' has a crafted evolution',
  )
assert.equal(CARDS.length, 300)
// Meat Exchange evolution faces are occult, not generic corporate paperwork.
// The mechanical abilities are still exercised by the full evolution suite below.
const exchangeStages = Object.values(EXCHANGE_EVOLUTIONS).flatMap((e) => [
  e[2].title,
  e[3].title,
  ...(e.choice ? [e.choice.stage.title] : []),
])
assert.equal(
  exchangeStages.length,
  63,
  'all Exchange stages have authored titles',
)
assert.equal(new Set(exchangeStages).size, exchangeStages.length)
for (const title of [
  'The Choir of Unpaid Bones',
  "The Drowned Chapel's Mercy",
  'The Great Devouring',
  'The Ossuary Opens',
  'The Bone Cart',
])
  assert.ok(
    exchangeStages.includes(title),
    title + ' must keep its occult identity',
  )
// Every crafted card, every faction: real stages that fit the card face.
for (const id of Object.keys(CLASH_EVOLUTIONS)) {
  const card = cardById(id)
  assert.ok(!CLASH_TWISTS[id], id + ' is not a hand-built twist too')
  // A trap springs on the rival's turn, and "power now" ends with the round,
  // so a sprung trap may only grant lasting power.
  for (const st of [
    CLASH_EVOLUTIONS[id]![2],
    CLASH_EVOLUTIONS[id]![3],
    ...(CLASH_EVOLUTIONS[id]!.choice
      ? [CLASH_EVOLUTIONS[id]!.choice!.stage]
      : []),
  ])
    for (const ab of st.abilities)
      if (ab.when === 'spring')
        assert.ok(
          !JSON.stringify(ab.do).match(/"do":"power"(?![^}]*"lasting":true)/),
          id + ' ' + st.title + ': no fleeting power on a sprung trap',
        )
  // The pick is kept on fighters and resolved at once for spells; a placed
  // trap or installed gear would forget it, so choices stay off them.
  if (CLASH_EVOLUTIONS[id]!.choice)
    assert.ok(
      card.kind === 'creature' || card.kind === 'spell',
      id + ' choose-one only on fighters and spells',
    )
  const two = clashEvolutionStage(id, 2)!
  const three = clashEvolutionStage(id, 3)!
  assert.ok(two.title && three.title && two.title !== three.title, id)
  assert.notDeepEqual(two, three, id + ' L3 is not the L2 again')
  for (const level of [1, 2, 3]) {
    const text = clashCardText(card, level)
    assert.ok(text.length <= 160, id + ' L' + level + ' fits the card face')
  }
  for (const pick of [0, 1] as const)
    assert.ok(clashCardText(card, 3, pick).length <= 160, id + ' option fits')
  assert.equal(clashStageTitle(id, 1), card.name)
}

// Active abilities are authored independently per evolution, not inherited
// from text the player might never have seen at an earlier level.
for (const [id, level] of [
  ['s1-alley-vet', 1],
  ['s1-alley-vet', 2],
  ['s1-alley-vet', 3],
  ['s1-roof-phantom', 2],
  ['s1-roof-phantom', 3],
  ['s3-catgirls-bicycle-clinic', 2],
  ['s3-catgirls-bicycle-clinic', 3],
  ['s3-bloodfairies-mosh-firefly', 2],
  ['s1-scrap-welder', 2],
  ['s1-blast-radius', 2],
  ['s1-static-listener', 2],
  ['audit-fiend', 2],
] as const) {
  assert.ok(
    clashEvolutionStage(id, level)?.abilities.some((a) => a.when === 'tap'),
    id + ' L' + level + ' has a real tap trigger',
  )
  assert.match(
    clashCardText(cardById(id), level),
    /Tap \(skip strike\): /,
    id + ' L' + level + ' shows its complete active ability',
  )
}

// --- The pilot is a full Solo Clash side: twenty Catgirls, every one with
// its own level-two and level-three story (eight twists + twelve crafted, with
// the crafted Second Pounce Rig left to the deck builder). Silas, 2026-11-11
// PT, "yes on gear to fighters": the Ninth Life Collar folds into the Alley
// Veterinarian, a fighter born with its Regen.
{
  const deck = clashDeck('catgirls')
  assert.equal(deck.length, 20)
  assert.equal(new Set(deck).size, 20)
  for (const id of deck) {
    assert.equal(cardById(id).team, 'catgirls', id)
    assert.ok(CLASH_TWISTS[id] || CLASH_EVOLUTIONS[id], id + ' evolves')
  }
  assert.equal(deck.filter((id) => CLASH_TWISTS[id]).length, 8)
  assert.equal(deck.filter((id) => CLASH_EVOLUTIONS[id]).length, 12)
  assert.ok(!deck.includes('s3-catgirls-pounce-rig'))
  assert.ok(!deck.includes('ninthlife'))
  const fighters = deck.filter((id) => cardById(id).kind === 'creature')
  assert.equal(
    fighters.length,
    14,
    'fighters-first pilot fields fourteen bodies',
  )
}

// --- Choose one at level three (approved 2026-11-08 PT).
const CHOICE = ['splice-runner', 's3-catgirls-escaped-tiger', 'mutual-aid']
assert.deepEqual(
  PILOT.filter((id) => clashEvolutionChoice(id, 3)),
  CHOICE,
  'three pilot cards offer a choice',
)
for (const id of CHOICE) {
  const [a, b] = clashEvolutionChoice(id, 3)!
  assert.notEqual(a.title, b.title)
  assert.equal(clashEvolutionChoice(id, 2), undefined, 'only at level three')
  assert.match(clashCardText(cardById(id), 3), /Choose:/)
}

// --- helpers
function fighter(
  side: Side,
  lane: number,
  uid: number,
  extra: Partial<ClashUnit> = {},
): ClashUnit {
  return {
    uid,
    side,
    lane,
    cardId: side === 'player' ? 'lynx' : 'scrapper',
    hp: 6,
    maxHp: 8,
    attack: 3,
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
  }
}
function board(units: ClashUnit[]): ClashState {
  const s = createClash('catgirls', 'riot', 11)
  s.units = units
  s.nextUid = 100
  s.round = 3
  s.plays.player = 0
  return s
}
function cast(s: ClashState, id: string, lane: number, level = 3): ClashState {
  s.hands.player = [id, ...s.hands.player]
  s.levels.player[id] = level
  const next = playClash(s, 'player', id, lane)
  assert.notEqual(
    next,
    s,
    id + ' L' + level + ' is playable in alley ' + (lane + 1),
  )
  return next
}
const at = (s: ClashState, uid: number) => s.units.find((u) => u.uid === uid)
const mine = (s: ClashState, id: string) =>
  s.units.find((u) => u.side === 'player' && u.cardId === id && !u.token)

// Splice Runner L3, Midnight Ambulance: role shift into a non-fighting
// rescuer that brings back the last fallen fighter.
{
  const s0 = board([])
  s0.fallen = { player: ['s1-alley-vet'], enemy: [] }
  const s = cast(s0, 'splice-runner', 2)
  const echo = s.units.find((u) => u.token && u.cardId === 's1-alley-vet')
  assert.ok(echo, 'the fallen vet returns')
  assert.equal(echo!.attack, 2)
  assert.equal(echo!.hp, 3)
  assert.equal(clashPower(s, mine(s, 'splice-runner')!), 0, 'never strikes')
  assert.deepEqual(s.fallen!.player, [], 'each fallen fighter returns once')
  assert.match(s.lastEvolution!.detail, /Midnight Ambulance/)
  const empty = cast(board([]), 'splice-runner', 2)
  assert.equal(
    empty.units.filter((u) => u.token).length,
    0,
    'no fallen, no echo',
  )
  const two = cast(
    board([fighter('player', 0, 1, { hp: 2 })]),
    'splice-runner',
    2,
    2,
  )
  assert.equal(at(two, 1)!.hp, 5, 'Contraband Courier heals the most hurt 3')
}
// Rooftop Phantom: choose to tap rather than attack; no free automatic bonus.
{
  const s0 = board([])
  const before = s0.boss.enemy
  const landed = cast(s0, 's1-roof-phantom', 1, 2)
  const uid = mine(landed, 's1-roof-phantom')!.uid
  assert.equal(landed.boss.enemy, before, 'a tap does not fire on arrival')
  assert.ok(!canClashActivate(landed, 'player', uid), 'fresh fighters cannot tap')
  const ready = structuredClone(landed)
  mine(ready, 's1-roof-phantom')!.fresh = false
  const tapped = activateClash(ready, 'player', uid)
  assert.equal(tapped.boss.enemy, before - 2, 'Chimney Leap fires on tap')
  assert.ok(at(tapped, uid)!.attacked, 'tapping spends the strike')
  assert.equal(ready.boss.enemy, before, 'tap input remains immutable')
  assert.equal(activateClash(tapped, 'player', uid), tapped, 'cannot tap twice')
  const blocked = cast(board([fighter('enemy', 1, 9)]), 's1-roof-phantom', 1, 2)
  const blockedReady = structuredClone(blocked)
  mine(blockedReady, 's1-roof-phantom')!.fresh = false
  assert.equal(
    activateClash(blockedReady, 'player', mine(blockedReady, 's1-roof-phantom')!.uid).boss.enemy,
    before,
    'a blocked alley gains no boss damage',
  )
  // L3 chooses when to move. It does not sidestep without a tap command.
  let k = cast(board([fighter('enemy', 1, 9)]), 's1-roof-phantom', 1)
  const movedUid = mine(k, 's1-roof-phantom')!.uid
  for (const side of ['player', 'enemy'] as const) {
    k = passClash(k, side)
    while (nextClashStrike(k, side) >= 0) k = strikeClash(k, side)
    k = endClashTurn(k, side)
  }
  assert.equal(at(k, movedUid)!.lane, 1, 'tap movement is a real choice')
  k = activateClash(k, 'player', movedUid)
  const moved = at(k, movedUid)!
  assert.notEqual(moved.lane, 1, 'tapped fighter moves out of the engaged alley')
  assert.equal(Math.abs(moved.lane - 1), 1, 'exactly one alley away')
}
// Alley Veterinarian L1-L3: complete stage text, chosen healing, and Regen.
{
  const s = cast(
    board([
      fighter('player', 0, 1, { hp: 3 }),
      fighter('player', 4, 2, { hp: 8 }),
    ]),
    's1-alley-vet',
    2,
  )
  assert.ok(at(s, 1)!.keywords.includes('regen'))
  assert.ok(!at(s, 2)!.keywords.includes('regen'))
  for (const level of [1, 2, 3] as const) {
    const text = clashCardText(cardById('s1-alley-vet'), level)
    assert.match(text, /Tap \(skip strike\): heal /, 'tap rules stand on their own')
    assert.ok(text.length <= 160, 'fully worded stage fits the card face')
  }
  const unit = mine(s, 's1-alley-vet')!
  const ready = structuredClone(s)
  mine(ready, 's1-alley-vet')!.fresh = false
  const next = activateClash(ready, 'player', unit.uid)
  assert.ok(next.units.find((u) => u.uid === 1)!.hp >= s.units.find((u) => u.uid === 1)!.hp)
  assert.ok(next.units.find((u) => u.uid === unit.uid)!.attacked)
}
// Parapet Ghost-Kitten L3: the rare weaker level three, with a big arrival.
{
  const id = 's2-catgirls-parapet-ghost-kitten'
  const l2 = clashBalance(cardById(id), 2)
  const l3 = clashBalance(cardById(id), 3)
  assert.ok(l3.hp < l2.hp && l3.attack < l2.attack, 'smaller body at L3')
  const s = cast(
    board([
      fighter('enemy', 1, 7),
      fighter('enemy', 2, 8),
      fighter('enemy', 4, 9),
    ]),
    id,
    2,
  )
  assert.ok(at(s, 7)!.rooted && at(s, 8)!.rooted, 'the 3 facing foes freeze')
  assert.ok(!at(s, 9)!.rooted, 'alley 5 is out of reach')
}
// Gene-Spliced Tiger: weaker L1, and at L3 it hunts the strongest foe.
{
  const id = 's3-catgirls-escaped-tiger'
  assert.ok(
    clashBalance(cardById(id), 1).attack < clashBalance(cardById(id), 3).attack,
  )
  const s = cast(
    board([
      fighter('enemy', 0, 7, { attack: 2, hp: 9, maxHp: 9 }),
      fighter('enemy', 4, 8, { attack: 5, hp: 9, maxHp: 9 }),
    ]),
    id,
    2,
  )
  const tiger = mine(s, id)!
  assert.ok(at(s, 8)!.hp < 9, 'it hunts the strongest')
  assert.equal(at(s, 7)!.hp, 9, 'not the weaker one')
  assert.ok(tiger.hp < tiger.maxHp, 'and takes a hit back')
}
// Gutterglass Scout L3: the shield always; the roar only with a crowd.
{
  const lonely = cast(board([]), 's3-catgirls-glasswalker', 2)
  assert.equal(mine(lonely, 's3-catgirls-glasswalker')!.guard, 3)
  const crowd = cast(
    board([fighter('player', 0, 1), fighter('player', 4, 2)]),
    's3-catgirls-glasswalker',
    2,
  )
  assert.equal(at(crowd, 1)!.surge, 1, 'the crowd roars')
  assert.equal(at(lonely, 1), undefined)
}
// Mutual Aid L3: the healthy get stronger for good, the hurt are healed.
{
  const s = cast(
    board([
      fighter('player', 1, 1, { hp: 8 }),
      fighter('player', 3, 2, { hp: 1, maxHp: 12 }),
    ]),
    'mutual-aid',
    3,
  )
  assert.equal(at(s, 1)!.attack, 4, 'unhurt ally +1 power for good')
  assert.equal(
    at(s, 2)!.attack,
    3,
    'a target still hurt after the heal does not grow',
  )
}
// Nine Lives L3: the whole crew survives one lethal hit at 1 life.
{
  const s = cast(
    board([
      fighter('player', 1, 1),
      fighter('player', 4, 2),
      fighter('enemy', 4, 9, { attack: 20 }),
    ]),
    's1-nine-lives',
    1,
  )
  assert.equal(at(s, 2)!.lastChance, 's1-nine-lives')
  // Its own strike into a 20-power blocker would be lethal; the spare life
  // holds at 1 and is spent.
  let e = passClash(s, 'player')
  while (nextClashStrike(e, 'player') >= 0) e = strikeClash(e, 'player')
  assert.equal(at(e, 2)?.hp, 1, 'the spare life holds')
  assert.ok(!at(e, 2)!.lastChance, 'and is spent')
  assert.match(e.lastEvolution!.detail, /No refunds/)
}
// Catwalk Garrote: +2 against a 2-play victim; at L3 it springs twice.
{
  let s = cast(board([]), 's3-catgirls-garrote', 2)
  assert.equal(s.traps.filter((t) => t.lane === 2).length, 1)
  s = passClash(s, 'player')
  s = endClashTurn(s, 'player')
  s.hands.enemy = ['spark-diver']
  s.levels.enemy['spark-diver'] = 1
  s = playClash(s, 'enemy', 'spark-diver', 2)
  assert.equal(
    s.traps.filter((t) => t.lane === 2 && t.side === 'player').length,
    1,
    "Hangman's Line arms again",
  )
  assert.ok(s.traps.find((t) => t.lane === 2)!.token, 'only once')
}
// Second Pounce Rig L3: a knockout sends the wearer's power into the boss.
{
  let s = cast(
    board([
      fighter('player', 1, 1, { attack: 4 }),
      fighter('enemy', 1, 9, { hp: 1, attack: 1 }),
    ]),
    's3-catgirls-pounce-rig',
    1,
  )
  const before = s.boss.enemy
  s = passClash(s, 'player')
  while (nextClashStrike(s, 'player') >= 0) s = strikeClash(s, 'player')
  assert.ok(s.boss.enemy < before, 'the second pounce lands on the boss')
}

// Black Market Run (Splice Runner's other level three): draws two, and the
// pick is recorded in the transcript and on the fighter.
{
  const s0 = board([])
  s0.hands.player = []
  s0.decks.player = ['lynx', 'mau', 'calico']
  s0.hands.player = ['splice-runner']
  s0.levels.player['splice-runner'] = 3
  const s = playClash(s0, 'player', 'splice-runner', 2, 1)
  assert.equal(s.hands.player.length, 2, 'Black Market Run draws 2')
  assert.equal(mine(s, 'splice-runner')!.evoChoice, 1)
  assert.ok(clashPower(s, mine(s, 'splice-runner')!) > 0, 'it still fights')
  assert.deepEqual(s.commands.at(-1), {
    t: 'play',
    side: 'player',
    card: 'splice-runner',
    lane: 2,
    choice: 1,
  })
  const plain = cast(board([]), 'splice-runner', 2)
  assert.equal(mine(plain, 'splice-runner')!.evoChoice, undefined)
  assert.ok(!('choice' in plain.commands.at(-1)!), 'option 0 is the default')
  // A choice below level three is not a choice: nothing is recorded.
  const low = board([])
  low.hands.player = ['splice-runner']
  low.levels.player['splice-runner'] = 2
  const l2 = playClash(low, 'player', 'splice-runner', 2, 1)
  assert.ok(!('choice' in l2.commands.at(-1)!))
}
// Back to the Wild: +3 life, and +2 power with no ally beside it.
{
  const id = 's3-catgirls-escaped-tiger'
  const s0 = board([])
  s0.hands.player = [id]
  s0.levels.player[id] = 3
  const s = playClash(s0, 'player', id, 2, 1)
  const tiger = mine(s, id)!
  assert.equal(tiger.maxHp, clashBalance(cardById(id), 3).hp + 3)
  const alone = clashPower(s, tiger)
  s.units.push(fighter('player', 1, 50))
  assert.equal(clashPower(s, tiger), alone - 2, 'company ends the lone bonus')
}
// Emergency Ward: heal every ally 2 instead of the pharmacy's sharpening.
{
  const s0 = board([
    fighter('player', 1, 1, { hp: 2 }),
    fighter('player', 3, 2, { hp: 3 }),
  ])
  s0.hands.player = ['mutual-aid']
  s0.levels.player['mutual-aid'] = 3
  const s = playClash(s0, 'player', 'mutual-aid', 1, 1)
  assert.equal(at(s, 2)!.hp, 5, 'the ward reaches the whole crew')
  assert.equal(at(s, 2)!.attack, 3, 'no sharpening on this path')
}
// The CPU picks by the board: the ambulance only when someone has fallen.
{
  const cpuPick = (fallen: string[]) => {
    const s = board([])
    s.teams.enemy = 'catgirls'
    s.active = 'enemy'
    s.phase = 'play'
    s.plays.enemy = 0
    s.hands.enemy = ['splice-runner']
    s.levels.enemy['splice-runner'] = 3
    s.fallen = { player: [], enemy: fallen }
    const cmd = chooseClashCpu(s, 'enemy')
    assert.equal(cmd.t, 'play')
    return cmd.t === 'play' ? cmd.choice : undefined
  }
  assert.equal(cpuPick([]), 1, 'nobody to rescue: Black Market Run')
  assert.equal(cpuPick(['mau']), undefined, 'someone fell: Midnight Ambulance')
}

// Backstreet Organ Donor L3: her last donation goes to the most hurt ally.
{
  const id = 's2-catgirls-backstreet-organ-donor'
  let k = board([
    fighter('player', 1, 1, { hp: 2 }),
    fighter('player', 3, 2, { hp: 7 }),
    fighter('player', 2, 3, { cardId: id, level: 3, hp: 1 }),
    fighter('enemy', 2, 9, { attack: 20, hp: 30, maxHp: 30 }),
  ])
  k = passClash(k, 'player')
  while (nextClashStrike(k, 'player') >= 0) k = strikeClash(k, 'player')
  assert.equal(at(k, 3), undefined, 'she falls striking the brute')
  assert.equal(at(k, 1)!.maxHp, 12, 'the most hurt ally gets +4 life')
  assert.equal(at(k, 1)!.attack, 4, 'and +1 power for good')
  assert.equal(at(k, 2)!.maxHp, 8, 'not the healthier one')
}

// Draws earned off-turn wait for the next turn instead of being discarded.
{
  let s = board([fighter('player', 2, 1, { hp: 1 })])
  s.units.push(fighter('enemy', 2, 9, { attack: 20, hp: 30, maxHp: 30 }))
  s.hands.player = ['s2-catgirls-lab-escape-atlas']
  s.levels.player['s2-catgirls-lab-escape-atlas'] = 3
  s = playClash(s, 'player', 's2-catgirls-lab-escape-atlas', 2)
  s = passClash(s, 'player')
  while (nextClashStrike(s, 'player') >= 0) s = strikeClash(s, 'player')
  assert.equal(at(s, 1), undefined, 'the atlas wearer falls')
  assert.equal(s.pendingDraw?.player, 2, 'Every Exit Marked owes 2 cards')
  s = endClashTurn(s, 'player')
  for (let i = 0; s.active === 'enemy' && i < 50; i++)
    s = applyClashCommand(s, chooseClashCpu(s, 'enemy'))
  assert.equal(s.active, 'player')
  assert.equal(s.hands.player.length, 7, 'drawn on the next turn: 5 + 2')
  assert.equal(s.pendingDraw?.player, 0)
}

// --- Mercenary board builders should have tactical, counterable L3 payoffs.
// Empty alleys are a resource: the flashmob floods them with fragile 1/1s,
// while the scaffold raises defensive 0-power wings. A full board denies both.
{
  const empty = cast(
    board([fighter('player', 2, 1)]),
    'merc-flashmob-diversion',
    2,
  )
  const dancers = empty.units.filter((u) => u.side === 'player' && u.token)
  assert.ok(dancers.length >= 2, 'flashmob fills more than one open alley')
  assert.ok(dancers.every((u) => u.hp === 1 && u.attack === 1))

  const crowded = board([
    fighter('player', 0, 1),
    fighter('player', 1, 2),
    fighter('player', 3, 3),
    fighter('player', 4, 4),
  ])
  crowded.hands.player = ['merc-flashmob-diversion']
  crowded.levels.player['merc-flashmob-diversion'] = 3
  assert.equal(
    canClashPlay(crowded, 'player', 'merc-flashmob-diversion', 2),
    false,
    'full allied board denies deployment before the flashmob can summon',
  )

  const scaffold = cast(
    board([fighter('player', 2, 1)]),
    'merc-living-scaffold',
    2,
  )
  const wings = scaffold.units.filter((u) => u.side === 'player' && u.token)
  assert.ok(wings.length > 0, 'scaffold raises at least one wing')
  assert.ok(wings.every((u) => u.attack === 0 && u.hp === 4))
}

// --- Every crafted card runs through the real engine at every level and
// option, on crowded and empty boards, through a full exchange of strikes.
for (const id of Object.keys(CLASH_EVOLUTIONS)) {
  const card = cardById(id)
  const picks: (0 | 1)[] = clashEvolutionChoice(id, 3) ? [0, 1] : [0]
  for (const level of [1, 2, 3])
    for (const pick of picks)
      for (const crowded of [true, false]) {
        const s0 = board(
          crowded
            ? [
                fighter('player', 0, 1, { hp: 3 }),
                fighter('player', 1, 2),
                fighter('player', 3, 3, { hp: 2 }),
                fighter('enemy', 0, 7, { hp: 2 }),
                fighter('enemy', 1, 8, { attack: 6 }),
                fighter('enemy', 2, 9),
                fighter('enemy', 4, 10, { hp: 1 }),
              ]
            : [],
        )
        s0.teams.player = card.team === 'mercenary' ? 'catgirls' : card.team
        s0.fallen = { player: ['lynx'], enemy: ['scrapper'] }
        s0.hands.player = [id]
        s0.levels.player[id] = level
        let lane = -1
        for (const l of [2, 1, 3, 0, 4])
          if (lane < 0 && canClashPlay(s0, 'player', id, l)) lane = l
        if (lane < 0) continue
        let g = playClash(s0, 'player', id, lane, pick)
        assert.notEqual(g, s0, id + ' L' + level + ' plays')
        g = passClash(g, 'player')
        for (let i = 0; !g.victor && i < 400 && g.round < 6; i++)
          g = applyClashCommand(g, chooseClashCpu(g, g.active))
        for (const u of g.units)
          assert.ok(
            Number.isFinite(u.hp) && Number.isFinite(u.attack),
            id + ' keeps numbers finite',
          )
      }
}

// --- Evolution art: a level shows its painting once wired, else falls back.
assert.equal(
  slimeCardArtId('splice-runner', 1),
  slimeArtId('cards', 'splice-runner'),
)
assert.equal(
  slimeCardArtId('splice-runner', 3),
  slimeArtId('evolutions', 'splice-runner@3') ??
    slimeArtId('cards', 'splice-runner'),
)

assert.equal(
  slimeCardArtId('splice-runner', 3, 1),
  slimeArtId('evolutions', 'splice-runner@3b') ??
    slimeArtId('cards', 'splice-runner'),
  'each choose-one option has its own painting',
)

// --- Determinism with the pilot deck, choices included, from either seat.
for (const seed of [5, 9, 13, 21, 34, 55]) {
  for (const [a, b] of [
    ['catgirls', 'ironjaw'],
    ['riot', 'catgirls'],
  ] as const) {
    let g = createClash(a, b, seed)
    for (let i = 0; !g.victor && i < 2000; i++)
      g = applyClashCommand(g, chooseClashCpu(g, g.active))
    assert.ok(g.victor)
    const again = replayClash(a, b, seed, g.commands)
    assert.deepEqual(again.boss, g.boss)
    assert.deepEqual(again.units, g.units)
  }
}
// A recorded choice replays to the same state.
{
  const s0 = board([])
  s0.hands.player = ['mutual-aid']
  s0.levels.player['mutual-aid'] = 3
  s0.units.push(fighter('player', 1, 1, { hp: 2 }))
  const cmd = {
    t: 'play',
    side: 'player',
    card: 'mutual-aid',
    lane: 1,
    choice: 1,
  } as const
  assert.deepEqual(
    applyClashCommand(s0, cmd),
    playClash(s0, 'player', 'mutual-aid', 1, 1),
  )
}

console.log(
  'Slime City crafted evolutions: ' +
    Object.keys(CLASH_EVOLUTIONS).length +
    ' crafted cards through the real engine; 20-card Catgirls pilot deck, choose-one level threes, art fallback and replay OK',
)

// Silas, 2026-11-10 PT: "we need less random things, and less different
// random things." No evolution picks a random target, and seeded gambles
// are ANARKISS's daredevil signature alone.
for (const [id, evolution] of Object.entries(CLASH_EVOLUTIONS)) {
  const tree = JSON.stringify(evolution)
  assert.ok(!tree.includes('"randomFoe"'), id + ' picks a random target')
  if (tree.includes('"do":"chance"'))
    assert.equal(cardById(id).team, 'riot', id + ' gambles outside ANARKISS')
}
