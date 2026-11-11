import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  newPvpGame,
  isPvpExpired,
  PVP_IDLE_EXPIRY_MS,
  PVP_INVITE_EXPIRY_MS,
  parsePvpRecord,
  pvpBoard,
  pvpGameSummary,
  sortPvpGames,
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

// Friend challenges: one invited player, a positive account id or nothing.
assert.equal(
  parsePvpRecord({ version: 1, guestId: null, invitedId: 9, commands: [] })
    ?.invitedId,
  9,
)
assert.ok(
  parsePvpRecord({ version: 1, guestId: null, invitedId: null, commands: [] }),
)
assert.equal(
  parsePvpRecord({ version: 1, guestId: null, invitedId: 0, commands: [] }),
  null,
)
assert.equal(
  parsePvpRecord({ version: 1, guestId: null, invitedId: '9', commands: [] }),
  null,
)

// Open or private (Silas, 2026-11-11 PT: "Invites should be private or open
// and seen by other visitors if public and joinable").
assert.equal(
  parsePvpRecord({ version: 1, guestId: null, isPublic: true, commands: [] })
    ?.isPublic,
  true,
)
assert.equal(
  parsePvpRecord({ version: 1, guestId: null, isPublic: 'yes', commands: [] }),
  null,
)

const service = readFileSync('server/utils/slimeCityPvp.ts', 'utf8')
assert.match(
  service,
  /commands: \{ path: '\$\.isPublic', equals: true \}/,
  'the open list only shows duels their host made public',
)
assert.match(
  service,
  /if \(isPublic && friendId !== undefined && friendId !== null\)\s*return fail\(400/,
  'a friend challenge is never listed publicly',
)
// "Invites should be cancellable."
assert.match(
  service,
  /if \(!host && !declining\) return fail\(404/,
  'only the host or the challenged friend can call off a duel',
)
assert.match(
  service,
  /if \(record\.guestId !== null\)\s*return fail\(409, 'The duel has started\. Forfeit it instead\.'\)/,
  'a started duel is forfeited, not cancelled',
)
assert.match(
  service,
  /record\.invitedId \? record\.invitedId === userId : true/,
  'a friend challenge is visible only to that friend before they join',
)
assert.match(
  readFileSync('server/api/slime-city/pvp/open.get.ts', 'utf8'),
  /getOptionalApiUser\(/,
  'open duels are visible to signed-out visitors',
)
// Silas, 2026-11-11 PT: "You should be able to challenge players on your
// friends list. And they should get notified."
assert.match(
  service,
  /relatedUserId: Number\(friendId\),\s*type: 'FRIEND',\s*status: 'ACCEPTED'/,
  'only accepted friends can be challenged',
)
assert.match(
  service,
  /createNotification\(\{\s*userId: invitedId,[\s\S]*?linkPath: '\/play\/slime-city-pvp\?duel=' \+ row\.id/,
  'the challenged friend is notified with a link to the duel',
)
assert.match(
  service,
  /record\.invitedId && record\.invitedId !== userId\)\s*return fail\(403/,
  'only the challenged friend may join',
)
assert.match(service, /path: '\$\.invitedId', equals: userId/)
const handlerDir = 'server/api/slime-city/pvp/'
for (const path of [
  'index.post.ts',
  'index.get.ts',
  'friends.get.ts',
  '[id]/cancel.post.ts',
  '[id].get.ts',
  '[id]/join.post.ts',
  '[id]/command.post.ts',
  '[id]/forfeit.post.ts',
]) {
  const source = readFileSync(handlerDir + path, 'utf8')
  // Silas, 2026-11-11 PT: "Remove admin limitation" on player games.
  assert.match(source, /requireSlimeCityPlayer\(/)
  assert.doesNotMatch(source, /requireSlimeCityPreviewUser/)
}
assert.ok(
  readFileSync('pages/play/slime-city-pvp.vue', 'utf8').includes(
    "from '~/pages/admin/slime-city-pvp.vue'",
  ),
  'the two-player board has a public /play route',
)
const client = readFileSync('stores/slimeCityPvp.ts', 'utf8')
assert.match(
  client,
  /if \(sending\.value && !recoverRejectedMove\) return/,
  'normal polling must not overwrite a pending command',
)
assert.equal(
  [...client.matchAll(/await load\(current\.id, true, true\)/g)].length,
  2,
  'rejected commands and forfeits must both reload the server snapshot',
)
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

// Silas, 2026-11-11 PT: VS "lets a user to manage games between other users
// or cpu". Each player sees their own seat, whose turn it is and the result.
{
  const startedAt = new Date('2026-11-11T00:00:00.000Z')
  const now = startedAt.getTime() + 60_000
  const row = {
    id: '00000000-0000-4000-8000-000000000001',
    userId: 7,
    teamId: 'catgirls',
    foeId: 'riot',
    seed: 99,
    startedAt,
    settledAt: null as Date | null,
    result: null as string | null,
  }
  const open = { version: 1 as const, guestId: null, commands: [] }
  const waiting = pvpGameSummary(row, open, 7, now)!
  assert.equal(waiting.stage, 'waiting')
  assert.equal(waiting.rivalTeam, null)
  assert.equal(waiting.myTurn, false)
  assert.equal(pvpGameSummary(row, open, 8, now), null, 'strangers see nothing')

  const joined = { ...open, guestId: 8 }
  const host = pvpGameSummary(row, joined, 7, now)!
  const guest = pvpGameSummary(row, joined, 8, now)!
  assert.equal(host.stage, 'battle')
  assert.equal(host.myTurn, true, 'the host opens the duel')
  assert.equal(guest.myTurn, false)
  assert.equal(guest.myTeam, 'riot')
  assert.equal(guest.rivalTeam, 'catgirls')
  assert.deepEqual(host.bosses, { mine: 40, rival: 40 })

  const done = { ...row, settledAt: new Date(now), result: 'enemy' }
  assert.equal(pvpGameSummary(done, joined, 7, now)!.result, 'loss')
  assert.equal(pvpGameSummary(done, joined, 8, now)!.result, 'win')
  assert.equal(pvpGameSummary(done, joined, 8, now)!.stage, 'finished')

  assert.equal(
    pvpGameSummary(
      row,
      open,
      7,
      startedAt.getTime() + PVP_INVITE_EXPIRY_MS + 1,
    )!.stage,
    'expired',
  )
  const sorted = sortPvpGames([
    pvpGameSummary(done, joined, 7, now)!,
    waiting,
    guest,
    host,
  ])
  assert.equal(sorted[0], host, 'games waiting on you come first')
  assert.equal(sorted.at(-1)!.stage, 'finished')

  const challenge = { ...open, invitedId: 8 }
  const incoming = pvpGameSummary(row, challenge, 8, now)!
  assert.equal(incoming.incoming, true, 'the friend sees the challenge')
  assert.equal(incoming.seat, 'enemy')
  assert.equal(incoming.rivalTeam, 'catgirls')
  assert.equal(incoming.rivalId, 7)
  assert.equal(incoming.open, false)
  assert.equal(
    pvpGameSummary(row, { ...open, isPublic: true }, 7, now)!.open,
    true,
  )
  const sent = pvpGameSummary(row, challenge, 7, now)!
  assert.equal(sent.incoming, false)
  assert.equal(sent.rivalId, 8, 'the host sees who was challenged')
  assert.equal(pvpGameSummary(row, challenge, 9, now), null)
  assert.equal(
    pvpGameSummary(row, { ...challenge, guestId: 8 }, 8, now)!.incoming,
    false,
    'an answered challenge is an ordinary game',
  )
  assert.equal(
    sortPvpGames([host, incoming])[0],
    incoming,
    'challenges waiting for an answer come first',
  )
}
console.log(
  'Slime City VS game list: seats, turns, results, expiry and order PASS',
)
