import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  newPvpGame,
  isPvpExpired,
  PVP_IDLE_EXPIRY_MS,
  PVP_INVITE_EXPIRY_MS,
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

const created = new Date('2026-01-01T00:00:00.000Z')
const recentlyActive = new Date(
  created.getTime() + 25 * 24 * 60 * 60 * 1000,
).toISOString()
assert.equal(
  isPvpExpired(
    created,
    undefined,
    false,
    false,
    created.getTime() + PVP_INVITE_EXPIRY_MS + 1,
  ),
  true,
)
assert.equal(
  isPvpExpired(
    created,
    undefined,
    false,
    false,
    created.getTime() + PVP_INVITE_EXPIRY_MS,
  ),
  false,
)
assert.equal(
  isPvpExpired(
    created,
    recentlyActive,
    true,
    false,
    created.getTime() + PVP_IDLE_EXPIRY_MS + 1,
  ),
  false,
  'an active match must not expire based on creation date',
)
assert.equal(
  isPvpExpired(
    created,
    recentlyActive,
    true,
    false,
    Date.parse(recentlyActive) + PVP_IDLE_EXPIRY_MS + 1,
  ),
  true,
)
assert.equal(
  isPvpExpired(
    created,
    undefined,
    true,
    true,
    created.getTime() + PVP_IDLE_EXPIRY_MS * 5,
  ),
  false,
  'settled matches remain available for history',
)
assert.equal(isPvpExpired(created, 'not-a-date', true, false), true)
assert.equal(
  parsePvpRecord({
    version: 1,
    guestId: 1,
    lastActionAt: 'not-a-date',
    commands: [],
  }),
  null,
)
assert.equal(
  parsePvpRecord({
    version: 1,
    guestId: 1,
    lastActionAt: recentlyActive,
    commands: [],
  })?.lastActionAt,
  recentlyActive,
)

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
trapped.log.push({
  round: 1,
  kind: 'trap',
  text: 'SECRET bloodwire in alley 2',
})
trapped.log.push({
  round: 1,
  kind: 'play',
  text: 'SECRET bloodwire evolves',
})
assert.equal(
  pvpBoard(trapped, 'player').log.some((entry) =>
    entry.text.includes('SECRET'),
  ),
  false,
  'untriggered traps and their evolution cannot leak through logs',
)

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
  '[id]/forfeit.post.ts',
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
assert.match(
  service,
  /forfeitSlimeCityDuel/,
  'forfeit endpoint must settle matches',
)
assert.match(
  service,
  /record\.forfeitedBy === seat/,
  'same-seat retry must be idempotent',
)
assert.match(
  service,
  /const seat = seatFor\(row, record, userId\)/,
  'forfeit must authorize a participant',
)
assert.match(service, /result: winner/, 'forfeit must preserve the winner')
assert.equal(
  parsePvpRecord({
    version: 1,
    guestId: 2,
    forfeitedBy: 'player',
    commands: [],
  })?.forfeitedBy,
  'player',
)
assert.equal(
  parsePvpRecord({
    version: 1,
    guestId: 2,
    forfeitedBy: 'intruder',
    commands: [],
  }),
  null,
)
assert.match(
  service,
  /isPvpExpired/,
  'match expiry must use activity timestamps',
)
assert.match(
  service,
  /lastActionAt: new Date\(\)\.toISOString\(\)/,
  'moves must refresh activity',
)
assert.doesNotMatch(
  service,
  /awardBattle|buyPack|claimChallenge/,
  'PvP must not grant Meat',
)

console.log(
  'Slime City private PvP: invite, secrecy, turn, replay and route contracts OK',
)

const inboxSource = readFileSync(
  'server/api/slime-city/pvp/inbox.get.ts',
  'utf8',
)
assert.match(inboxSource, /requireSlimeCityPreviewUser\(event\)/)
assert.match(inboxSource, /record\.guestId === userId/)
assert.match(inboxSource, /row\.userId === userId/)
assert.match(inboxSource, /state\?\.active === seat/)
assert.match(inboxSource, /isPvpExpired\(/)
assert.doesNotMatch(inboxSource, /commands:\s*record\.commands/)
const headerSource = readFileSync(
  'components/navigation/workspace-header.vue',
  'utf8',
)
assert.match(headerSource, /header-slime-city-turns/)
assert.match(headerSource, /slimeCityPendingTurns/)
assert.match(headerSource, /slime-city-inbox/)

const gamePage = readFileSync('pages/admin/slime-city.vue', 'utf8')
assert.match(gamePage, /data-testid="slime-vs-tab"/)
assert.match(gamePage, /data-testid="slime-vs-cpu"/)
assert.match(gamePage, /data-testid="slime-vs-human"/)
assert.doesNotMatch(gamePage, /data-testid="slime-clash-tab"/)
assert.doesNotMatch(gamePage, />\s*PRACTICE\s*</)
const gameStore = readFileSync('stores/slimeCity.ts', 'utf8')
assert.match(gameStore, /\| 'vs'/)
