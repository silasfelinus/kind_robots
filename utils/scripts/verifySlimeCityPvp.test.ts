import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  newPvpGame,
  parsePvpRecord,
  pvpBoard,
  pvpCommand,
  replayPvp,
  stepPvp,
} from '../slimeCity/pvp'
import {
  CLASH_DECK_SIZE,
  nextClashStrike,
  type ClashCommand,
} from '../slimeCity/clash'

const host = 'catgirls' as const
const guest = 'ironjaw' as const
const seed = 91827
const initial = newPvpGame(host, guest, seed)
assert.equal(
  initial.decks.player.length + initial.hands.player.length,
  CLASH_DECK_SIZE,
)
assert.equal(
  initial.decks.enemy.length + initial.hands.enemy.length,
  CLASH_DECK_SIZE,
)
assert.equal(initial.active, 'player')
assert.equal(initial.phase, 'play')

const view = pvpBoard(initial, 'player')
assert.deepEqual(view.hand, initial.hands.player)
assert.equal(view.opponentHandCount, initial.hands.enemy.length)
assert.equal(view.nextStrike, -1)
assert.equal('rng' in view, false, 'server RNG must never leave server')
assert.equal('seed' in view, false, 'seed must never leave server')
assert.equal('decks' in view, false, 'deck order must never leave server')
assert.equal('hands' in view, false, 'opponent hand must never leave server')
assert.equal(
  'enemy' in view.levels,
  false,
  'rival card progression stays secret',
)
const trapped = structuredClone(initial)
trapped.traps.push({ side: 'enemy', lane: 1, cardId: 'bloodwire', level: 2 })
trapped.traps.push({ side: 'player', lane: 2, cardId: 'scentmine', level: 1 })
const redacted = pvpBoard(trapped, 'player')
assert.equal(redacted.traps.length, 1, 'enemy traps may not leak')
assert.equal(redacted.traps[0]?.cardId, 'scentmine')
assert.equal(pvpBoard(trapped, 'enemy').traps[0]?.cardId, 'bloodwire')

assert.equal(pvpCommand({ t: 'pass', side: 'enemy' }, 'player'), null)
assert.equal(pvpCommand({ t: 'end', extra: 1 }, 'player'), null)
assert.equal(
  pvpCommand({ t: 'play', card: 'not-a-card', lane: 1 }, 'player'),
  null,
)
assert.equal(
  pvpCommand({ t: 'play', card: initial.hands.player[0], lane: -1 }, 'player'),
  null,
)
assert.equal(
  pvpCommand({ t: 'play', card: initial.hands.player[0], lane: 5 }, 'player'),
  null,
)
assert.equal(
  pvpCommand({ t: 'power', lane: 0, team: 'unknown' }, 'player'),
  null,
)
assert.equal(pvpCommand({ t: 'strike', lane: 0 }, 'player'), null)
assert.deepEqual(pvpCommand({ t: 'pass' }, 'player'), {
  t: 'pass',
  side: 'player',
})
assert.equal(
  stepPvp(initial, { t: 'pass', side: 'enemy' }),
  null,
  'opponent cannot submit a command on your turn',
)
assert.equal(
  stepPvp(initial, { t: 'play', side: 'player', card: 'scrapper', lane: 0 }),
  null,
  'cannot play from rival faction or outside the real hand',
)
const pass = pvpCommand({ t: 'pass' }, 'player')!
const inAttack = stepPvp(initial, pass)!
assert.equal(inAttack.phase, 'attack')
assert.equal(nextClashStrike(inAttack, 'player'), -1)
const finish = pvpCommand({ t: 'end' }, 'player')!
const after = stepPvp(inAttack, finish)!
assert.equal(after.active, 'enemy')
assert.equal(after.commands.length, 2)
assert.equal(
  stepPvp(after, { t: 'pass', side: 'player' }),
  null,
  'player cannot act again before rival finishes',
)
const replay = replayPvp(host, guest, seed, [pass, finish])
assert.deepEqual(
  after,
  replay,
  'a reconnect must recover the exact seeded state',
)
assert.deepEqual(
  replayPvp(host, guest, seed, replay.commands as ClashCommand[]),
  replay,
)

assert.equal(parsePvpRecord(null), null)
assert.equal(
  parsePvpRecord({ version: 1, guestId: null, commands: [] })?.guestId,
  null,
)
assert.equal(parsePvpRecord({ version: 1, guestId: 0, commands: [] }), null)
assert.equal(parsePvpRecord({ version: 2, guestId: 15, commands: [] }), null)
assert.equal(
  parsePvpRecord({ version: 1, guestId: 15, commands: 'pass' }),
  null,
)

const service = readFileSync('server/utils/slimeCityPvp.ts', 'utf8')
const handlerDir = 'server/api/slime-city/pvp/'
for (const path of [
  'index.post.ts',
  '[id].get.ts',
  '[id]/join.post.ts',
  '[id]/command.post.ts',
]) {
  const source = readFileSync(handlerDir + path, 'utf8')
  assert.match(source, /requireSlimeCityPreviewUser/)
}
assert.match(service, /FOR UPDATE/, 'concurrent turns must serialize')
assert.match(
  service,
  /record\.commands\.length !== revision/,
  'stale tabs must be rejected',
)
assert.match(service, /settledAt/, 'terminal duels must stop taking moves')
assert.doesNotMatch(
  service,
  /awardBattle|buyPack|claimChallenge/,
  'PvP must not grant Meat',
)

console.log(
  'Slime City private PvP: invite, secrecy, turn, replay and route contracts OK',
)
