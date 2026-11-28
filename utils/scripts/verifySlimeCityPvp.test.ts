import assert from 'node:assert/strict'
import { pvpMeatRewards } from '../slimeCity/pvp'
import { existsSync, readFileSync } from 'node:fs'
import {
  newPvpGame,
  isPvpExpired,
  PVP_IDLE_EXPIRY_MS,
  PVP_INVITE_EXPIRY_MS,
  parsePvpRecord,
  pvpBoard,
  pvpGameSummary,
  pvpRematch,
  pvpSnapshotRival,
  pvpTally,
  sortPvpGames,
  pvpCardRow,
  visibleClashTrapAt,
  pvpClashView,
  pvpRevision,
  pvpTakeBack,
  pvpTakebackState,
  replayPvpTrail,
  PVP_TAKEBACKS_ANY,
  type PvpRecord,
  pvpCommand,
  pvpRules,
  replayPvp,
  stepPvp,
} from '../slimeCity/pvp'
import { cardById } from '../slimeCity/prototypes'
import {
  allianceStarter,
  soloStarter,
  STARTER_CARD_IDS,
  STARTER_MATCHUPS,
} from '../slimeCity/alliance'
import {
  CLASH_DECK_SIZE,
  canClashPlay,
  clashPlayLimit,
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

const openingGuest = pvpBoard(initial, 'enemy')
assert.equal(openingGuest.playLimit, clashPlayLimit(initial, 'player'))
assert.equal(pvpBoard(initial, 'player').playLimit, openingGuest.playLimit)

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
assert.equal(pvpCardRow(cardById('scentmine')), 'rival')
assert.equal(pvpCardRow(cardById('bloodwire')), 'rival')
assert.equal(
  visibleClashTrapAt(trapped.traps, 'player', 'enemy', 2)?.cardId,
  'scentmine',
)
assert.equal(
  visibleClashTrapAt(trapped.traps, 'player', 'player', 2),
  undefined,
)
assert.equal(visibleClashTrapAt(trapped.traps, 'player', 'enemy', 1), undefined)
assert.equal(
  visibleClashTrapAt(trapped.traps, 'enemy', 'player', 1)?.cardId,
  'bloodwire',
)
assert.equal(visibleClashTrapAt(trapped.traps, 'enemy', 'enemy', 1), undefined)
assert.equal(visibleClashTrapAt(trapped.traps, 'enemy', 'player', 2), undefined)
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
assert.deepEqual(pvpCommand({ t: 'activate', uid: 21 }, 'enemy'), {
  t: 'activate',
  side: 'enemy',
  uid: 21,
})
for (const bad of [
  { t: 'activate', uid: -1 },
  { t: 'activate', uid: 0 },
  { t: 'activate', uid: 1.5 },
  { t: 'activate', uid: '1' },
  { t: 'activate', uid: 1, side: 'player' },
  { t: 'activate', uid: 1, lane: 0 },
])
  assert.equal(
    pvpCommand(bad, 'player'),
    null,
    'tap payload must be server-scoped',
  )
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
assert.match(
  readFileSync('pages/play/slime-city-pvp.vue', 'utf8'),
  /<SlimeCityPvpGame \/>/,
  'the two-player board has a public /play route',
)
// Silas, 2026-11-11 PT: the private-duel admin tile "isn't admin locked and
// shouldn't be there". The board is a player feature reached from VS; the old
// admin URL only redirects to it.
assert.ok(!existsSync('content/channels/admin/slime-city-pvp.md'))
assert.match(
  readFileSync('pages/admin/slime-city-pvp.vue', 'utf8'),
  /navigateTo\('\/play\/slime-city-pvp', \{ redirectCode: 301 \}\)/,
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
  /pvpRevision\(record\) !== revision/,
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

// Silas, 2026-11-11 PT: "finalize multiplayer and single player routes". A
// finished duel offers REMATCH to the same rival with the same crew, and VS
// shows the player's record.
{
  const joined = { guestId: 8 }
  assert.equal(pvpSnapshotRival(7, joined, 7), 8, 'the host sees the guest')
  assert.equal(pvpSnapshotRival(7, joined, 8), 7, 'the guest sees the host')
  assert.equal(
    pvpSnapshotRival(7, joined, 9),
    null,
    'nobody outside the duel learns either account',
  )
  assert.equal(
    pvpSnapshotRival(7, { guestId: null }, 9),
    null,
    'a link holder sizing up a waiting duel sees no account',
  )
  assert.equal(pvpSnapshotRival(7, { guestId: null }, 7), null)

  const final = {
    stage: 'finished' as const,
    hostTeam: 'catgirls' as const,
    guestTeam: 'riot' as const,
  }
  assert.deepEqual(
    pvpRematch({ ...final, seat: 'player', rivalId: 8 }),
    { team: 'catgirls', friendId: 8 },
    'the host rematches the guest with the host crew',
  )
  assert.deepEqual(
    pvpRematch({ ...final, seat: 'enemy', rivalId: 7 }),
    { team: 'riot', friendId: 7 },
    'the guest rematches the host with the guest crew',
  )
  assert.deepEqual(
    pvpRematch({ ...final, seat: 'player', rivalId: 8 }, 'undertow'),
    { team: 'undertow', friendId: 8 },
    'host can change crew without changing rival',
  )
  assert.deepEqual(
    pvpRematch({ ...final, seat: 'enemy', rivalId: 7 }, 'exchange'),
    { team: 'exchange', friendId: 7 },
    'guest can change crew without changing rival',
  )
  assert.equal(
    pvpRematch({ ...final, stage: 'battle', seat: 'player', rivalId: 8 }),
    null,
    'no rematch before the final bell',
  )
  assert.equal(
    pvpRematch({ ...final, seat: 'player', rivalId: null }),
    null,
    'no rematch without a known rival',
  )
  assert.equal(pvpRematch({ ...final, seat: 'player' }), null)

  assert.deepEqual(
    pvpTally([
      { stage: 'finished', result: 'win' },
      { stage: 'finished', result: 'win' },
      { stage: 'finished', result: 'loss' },
      { stage: 'finished', result: 'draw' },
      { stage: 'battle', result: null },
      { stage: 'waiting', result: null },
    ]),
    { win: 2, loss: 1, draw: 1 },
  )
  assert.deepEqual(pvpTally([]), { win: 0, loss: 0, draw: 0 })

  assert.match(
    service,
    /rivalId: pvpSnapshotRival\(row\.userId, record, userId\)/,
    'the duel snapshot names the rival only to its two players',
  )
  assert.match(
    client,
    /start\(next\.team, \{\s*friendId: next\.friendId,\s*deck\s*\}/,
    'REMATCH is a private friend challenge through the normal start path',
  )
  assert.match(client, /pvpTally\(games\.value\)/)
  const board = readFileSync('components/slime-city-pvp-game.vue', 'utf8')
  assert.match(board, /data-testid="slime-pvp-result"/)
  assert.match(board, /data-testid="slime-pvp-rematch"/)
  assert.match(board, /@click="chooseRematch"/)
  assert.match(board, /pvp\.rematch\(selectedTeam\.value, duelDeck\.value\)/)
  assert.match(board, /data-testid="slime-pvp-rematch-back"/)
  assert.match(board, /<details[^>]*data-testid="slime-pvp-share-menu"/)
  const bulletin = readFileSync('components/slime-city-vs.vue', 'utf8')
  assert.match(
    bulletin,
    /async function challengeFriend[\s\S]*?if \(duel\) await pvp\.loadGames\(\)/,
  )
  assert.doesNotMatch(bulletin, /if \(duel\) open\(duel\.id\)/)
  assert.match(board, /to="\/play\/slime-city\?vs=1"[\s\S]*?BACK TO VS/)
  assert.match(
    readFileSync('components/slime-city-vs.vue', 'utf8'),
    /data-testid="slime-vs-record"/,
  )
}
console.log('Slime City VS finish: result, rematch and record PASS')

{
  // Silas, 2026-11-22 PT: "Hands are hidden when it's not your turn in 2p
  // versus ... you should see your new hand at the end of a round."
  const early = newPvpGame(host, guest, seed, pvpRules({ dealEarly: true }))
  assert.equal(early.hands.player.length, 5, 'host holds an opening hand')
  assert.equal(
    early.hands.enemy.length,
    5,
    'the second seat sees its opening hand while the host plays',
  )
  assert.equal(pvpBoard(early, 'enemy').hand.length, 5)
  const finishTurn = (state: typeof early, side: 'player' | 'enemy') => {
    let s = stepPvp(state, { t: 'pass', side })!
    while (nextClashStrike(s, side) >= 0) s = stepPvp(s, { t: 'strike', side })!
    return stepPvp(s, { t: 'end', side })!
  }
  const afterHost = finishTurn(early, 'player')
  assert.equal(afterHost.active, 'enemy')
  assert.equal(
    pvpBoard(afterHost, 'player').hand.length,
    5,
    'the host sees its next hand during the rival turn',
  )
  const afterGuest = finishTurn(afterHost, 'enemy')
  assert.equal(afterGuest.round, 2)
  assert.equal(
    pvpBoard(afterGuest, 'enemy').hand.length,
    5,
    'the guest sees its next hand as soon as the round ends',
  )
  assert.equal(
    afterGuest.decks.player.length +
      afterGuest.hands.player.length +
      afterGuest.discards.player.length,
    CLASH_DECK_SIZE,
    'early deals never mint or lose cards',
  )
  assert.deepEqual(
    replayPvp(
      host,
      guest,
      seed,
      afterGuest.commands,
      pvpRules({ dealEarly: true }),
    ),
    afterGuest,
    'early-deal duels replay deterministically',
  )
  const legacy = replayPvp(host, guest, seed, afterGuest.commands)
  assert.equal(legacy.hands.enemy.length, 0, 'older duels keep their rules')
  assert.equal(
    parsePvpRecord({
      version: 1,
      guestId: null,
      dealEarly: 'yes',
      commands: [],
    }),
    null,
  )
  assert.equal(
    parsePvpRecord({ version: 1, guestId: null, dealEarly: true, commands: [] })
      ?.dealEarly,
    true,
  )
}
console.log('Slime City VS early deal: next hand visible between turns PASS')

{
  // Silas, 2026-11-22 PT: the duel board shares the CPU Clash hand (drag,
  // full-size cards, evolution tabs) through an engine-shaped view.
  let s = newPvpGame(host, guest, seed, pvpRules({ dealEarly: true }))
  s = stepPvp(s, { t: 'pass', side: 'player' })!
  while (nextClashStrike(s, 'player') >= 0)
    s = stepPvp(s, { t: 'strike', side: 'player' })!
  s = stepPvp(s, { t: 'end', side: 'player' })!
  const guestBoard = pvpBoard(s, 'enemy')
  const guestView = pvpClashView(guestBoard, 'enemy', host, guest)
  assert.deepEqual(guestView.hands.enemy, guestBoard.hand)
  assert.equal(guestView.hands.player.length, guestBoard.opponentHandCount)
  assert.ok(
    guestView.hands.player.every((id) => id === ''),
    'the rival hand stays hidden in the view',
  )
  assert.equal(guestView.decks.enemy.length, guestBoard.deckCount)
  assert.deepEqual(guestView.levels.enemy, guestBoard.levels)
  assert.deepEqual(guestView.levels.player, {}, 'rival levels stay secret')
  for (const id of guestBoard.hand)
    for (let lane = 0; lane < 5; lane++)
      assert.equal(
        canClashPlay(guestView, 'enemy', id, lane),
        canClashPlay(s, 'enemy', id, lane),
        `client legality matches the server for ${id} in alley ${lane}`,
      )
  assert.equal(clashPlayLimit(guestView, 'enemy'), clashPlayLimit(s, 'enemy'))
  assert.equal(pvpCardRow(cardById('lynx')), 'own')
  const board = readFileSync('components/slime-city-pvp-game.vue', 'utf8')
  assert.match(board, /<SlimeCityClashHand[\s\S]*?:side="pvp\.duel\.seat"/)
  assert.match(board, /@drop="onDrop"/, 'cards drag onto alleys')
  assert.match(board, /:data-clash-lane="lane"/)
  assert.match(board, /data-testid="slime-pvp-plays"/, 'floating play icons')
  assert.match(
    board,
    /t: 'pass'[\s\S]*?t: 'end'[\s\S]*?t: 'strike'/,
    'one FIGHT tap plays the whole strike sweep',
  )
  const store = readFileSync('stores/slimeCityPvp.ts', 'utf8')
  assert.match(
    store,
    /next\.revision < current\.revision/,
    'a late poll never rolls the board back',
  )
  assert.ok(
    existsSync('content/channels/arcade/slime-city-duels.md'),
    'the duel page has its own tutorial tab',
  )
}
console.log(
  'Slime City VS board: shared hand view, legality, drag and sweep PASS',
)

{
  // Silas, 2026-11-22 PT: "There should be a back button if it's your turn,
  // with options for more depending on game options at start."
  const rules = pvpRules({ dealEarly: true })
  const fresh = newPvpGame(host, guest, seed, rules)
  const card = fresh.hands.player.find((id) =>
    [0, 1, 2, 3, 4].some(
      (lane) => !!stepPvp(fresh, { t: 'play', side: 'player', card: id, lane }),
    ),
  )!
  const lane = [0, 1, 2, 3, 4].find(
    (l) => !!stepPvp(fresh, { t: 'play', side: 'player', card, lane: l }),
  )!
  const played = stepPvp(fresh, { t: 'play', side: 'player', card, lane })!
  const record = (takebacks?: number): PvpRecord => ({
    version: 1,
    guestId: 2,
    dealEarly: true,
    ...(takebacks === undefined ? {} : { takebacks }),
    commands: [...played.commands],
  })
  const quiet =
    played.rng === fresh.rng &&
    played.decks.player.length === fresh.decks.player.length
  if (quiet) {
    const taken = pvpTakeBack(host, guest, seed, record(), 'player')
    assert.ok('record' in taken, 'a quiet play can be taken back')
    if ('record' in taken) {
      assert.equal(taken.record.commands.length, 0)
      assert.deepEqual(
        replayPvp(host, guest, seed, taken.record.commands, rules).hands.player,
        fresh.hands.player,
        'the card returns to the hand',
      )
      assert.ok(
        pvpRevision(taken.record) > pvpRevision(record()),
        'a take-back still moves the revision forward',
      )
      const again: PvpRecord = {
        ...taken.record,
        commands: [...played.commands],
      }
      // Silas, 2026-11-24 PT: "We shouldn't be limiting undos." A second
      // take-back in the same turn is allowed, even in duels created with the
      // old OFF or 1 / TURN settings.
      for (const legacy of [undefined, 0, 1, PVP_TAKEBACKS_ANY]) {
        const old: PvpRecord = {
          ...again,
          ...(legacy === undefined ? {} : { takebacks: legacy }),
        }
        assert.equal(
          pvpTakebackState(host, guest, seed, old, 'player').blocked,
          null,
          'take-backs are unlimited (stored ' + legacy + ')',
        )
        assert.equal(
          pvpTakebackState(host, guest, seed, old, 'player').allowed,
          PVP_TAKEBACKS_ANY,
        )
      }
    }
  }
  assert.notEqual(
    pvpTakebackState(host, guest, seed, record(), 'enemy').blocked,
    null,
    'never on the rival turn',
  )
  assert.equal(
    parsePvpRecord({ version: 1, guestId: null, takebacks: 5, commands: [] }),
    null,
  )
  // A move that rolled dice or drew cards stands.
  let rolled = 0
  for (let probe = 1; probe < 400 && !rolled; probe++) {
    const g = newPvpGame(host, guest, probe, rules)
    for (const id of g.hands.player)
      for (let l = 0; l < 5; l++) {
        const n = stepPvp(g, { t: 'play', side: 'player', card: id, lane: l })
        if (
          !n ||
          (n.rng === g.rng && n.decks.player.length === g.decks.player.length)
        )
          continue
        const blocked = pvpTakebackState(
          host,
          guest,
          probe,
          {
            version: 1,
            guestId: 2,
            dealEarly: true,
            commands: [...n.commands],
          },
          'player',
        ).blocked
        assert.match(blocked ?? '', /stands/)
        rolled++
        break
      }
  }
  // The strike trail lists each resolved alley in order.
  let s = newPvpGame(host, guest, seed, rules)
  s = stepPvp(s, { t: 'pass', side: 'player' })!
  while (nextClashStrike(s, 'player') >= 0)
    s = stepPvp(s, { t: 'strike', side: 'player' })!
  s = stepPvp(s, { t: 'end', side: 'player' })!
  for (const id of s.hands.enemy) {
    const n = [0, 1, 2, 3, 4]
      .map((l) => stepPvp(s, { t: 'play', side: 'enemy', card: id, lane: l }))
      .find(Boolean)
    if (n) s = n
  }
  if (s.phase === 'play') s = stepPvp(s, { t: 'pass', side: 'enemy' })!
  while (nextClashStrike(s, 'enemy') >= 0)
    s = stepPvp(s, { t: 'strike', side: 'enemy' })!
  const trail = replayPvpTrail(host, guest, seed, s.commands, rules)
  assert.deepEqual(trail.state, replayPvp(host, guest, seed, s.commands, rules))
  assert.equal(
    trail.strikes.length,
    s.commands.filter((c) => c.t === 'strike').slice(-12).length,
  )
  assert.ok(
    trail.strikes.every((item, i, all) => i === 0 || item.at > all[i - 1]!.at),
  )
  const board = readFileSync('components/slime-city-pvp-game.vue', 'utf8')
  assert.match(board, /data-testid="slime-pvp-takeback"/)
  assert.match(board, /class="scpvp-rail"/, 'boss bars beside the lanes')
  assert.match(board, /'healed'/, 'heals animate')
  assert.match(board, /replay it alley by alley/)
  const service = readFileSync('server/utils/slimeCityPvp.ts', 'utf8')
  assert.match(service, /pvpTakeBack\(/)
  assert.match(service, /strikes: trail\?\.strikes/)
}
console.log('Slime City VS take-backs, strike trail and board animations PASS')
{
  const battle = readFileSync('components/slime-city-pvp-game.vue', 'utf8')
  const header = readFileSync(
    'components/navigation/workspace-header.vue',
    'utf8',
  )
  const picker = readFileSync(
    'components/navigation/channel-select.vue',
    'utf8',
  )
  // Wide screens (Chromebooks, tablets in landscape): the alleys take the
  // left column and the boss rail sits beside them on the right; the floating
  // hand never takes the board's space.
  assert.match(
    battle,
    /grid-template-areas:\s*'arena rail'\s*'console console';/,
  )
  assert.match(battle, /\.scpvp-rail \{\s*grid-area: rail;/)
  assert.doesNotMatch(battle, /\.scpvp-controls \{/)
  assert.match(header, /header-account shrink-0 xl:ml-auto/)
  assert.match(header, /route\.path === '\/play\/slime-city-pvp'/)
  assert.match(picker, /route\.path === '\/play\/slime-city-pvp'/)
  assert.doesNotMatch(picker, /isSlimeCityPage|slime-nav-title/)
  assert.match(picker, /\{\{ currentPageTitle \}\}/)
  assert.match(picker, /v-if="currentPageSubtitle"/)
}
console.log('Slime City Chromebook duel layout contract PASS')

// Slime City VS focus modes keep the battlefield clear when closed and
// center all enlarged previews between the two combat rows.
{
  const read = (file: string) =>
    readFileSync(new URL('../../components/' + file, import.meta.url), 'utf8')
  const duel = read('slime-city-pvp-game.vue')
  const hand = read('slime-city-clash-hand.vue')
  assert.match(duel, /<SlimeCityClashHand[^>]*\bdock-held\b/)
  assert.match(duel, /<SlimeCityClashHand[^>]*\bfocus-toggle\b/)
  assert.match(hand, /const userClosed = ref\(!!props\.focusToggle\)/)
  assert.match(hand, /if \(props\.focusToggle\) return/)
  assert.match(hand, /isOpen \? 'BATTLE' : 'CARDS'/)
  assert.match(
    duel,
    /\.cxh:not\(\.open\) \.cxh-card:not\(\.big\)\) \{\s*opacity: 0;\s*visibility: hidden;/,
  )
  assert.match(duel, /--pvp-preview-width: min\(18rem, 42cqw, 38cqh\)/)
  assert.match(duel, /--x: var\(--preview-offset\);/)
  assert.match(duel, /--y: calc\(var\(--pvp-preview-width\) \* 0\.75 - 50cqh\)/)
  assert.match(
    duel,
    /\.cxh-card\.cxh-inspect\) \{\s*left: var\(--preview-center\);/,
  )
  assert.match(
    duel,
    /\.cxh-levels\.docked\) \{\s*left: var\(--preview-center\);/,
  )
  assert.doesNotMatch(
    duel,
    /SlimeCityTakebackChoice/,
    'no take-back limit picker',
  )
}

// Silas, 2026-11-24 PT, tablet landscape: the hand starts at the very bottom,
// deck / log / turn button live on the right, and the duel's bar shares the
// nav and icon row unless the screen is portrait.
{
  const duel = readFileSync(
    new URL('../../components/slime-city-pvp-game.vue', import.meta.url),
    'utf8',
  )
  const shell = readFileSync(
    new URL(
      '../../components/navigation/workspace-header.vue',
      import.meta.url,
    ),
    'utf8',
  )
  // Silas, 2026-11-24 PT: "Most of that header for slime city can be
  // deleted entirely. Forfeit is a button in settings control." The site
  // header is the only header; back and forfeit live in the console gear.
  assert.doesNotMatch(duel, /<header-page-bar/)
  assert.match(
    duel,
    /<SlimeCityQuickSettings[^>]*>[\s\S]*?data-testid="slime-pvp-forfeit"[\s\S]*?<\/SlimeCityQuickSettings>/,
    'forfeit lives in the settings panel',
  )
  assert.match(shell, /'landscape:contents': navStore\.pageBarInlineLandscape/)
  assert.match(
    duel,
    /grid-template-areas:\s*'arena rail'\s*'arena console';/,
    'beside a rail the board spans the full height and the console sits under the bosses',
  )
}

// Silas, 2026-11-24 PT: "There needs to be a visual for levels 1 2 and 3."
// Card faces and fighters on both boards wear a per-level frame.
for (const file of [
  'slime-city-clash-card-face.vue',
  'slime-city-pvp-game.vue',
  'slime-city-clash.vue',
])
  assert.match(
    readFileSync(new URL('../../components/' + file, import.meta.url), 'utf8'),
    /<SlimeCityLevelFrame :level="/,
    file + ' frames each level',
  )

{
  const duel = readFileSync(
    new URL('../../components/slime-city-pvp-game.vue', import.meta.url),
    'utf8',
  )
  assert.match(
    duel,
    /@media \(min-width: 691px\) and \(orientation: landscape\)/,
  )
  assert.match(duel, /'arena arena'\s*'rail console'/)
  assert.match(duel, /'arena'\s*'rail'\s*'console'/)
  assert.match(duel, /--W: min\(20rem, 36cqw, 20cqh\)/)
  assert.match(duel, /--rest: 1;/)
  assert.match(duel, /--y: calc\(-0\.4rem \+ var\(--drop\) \* 0\.2\)/)
  assert.match(duel, /--r: calc\(var\(--rot\) \* 0\.35\)/)
  assert.match(
    duel,
    /--hand-width: min\([\s\S]*?\(100cqw - 1rem - var\(--n1\) \* var\(--hand-gap\)\) \/ \(var\(--n1\) \+ 1\)/,
    'resting cards reserve separate full-width slots',
  )
  assert.match(
    duel,
    /--x: calc\(var\(--o\) \* \(var\(--hand-width\) \+ var\(--hand-gap\)\)\);/,
    'adjacent faces do not overlap',
  )
  assert.match(duel, /--rules-open: 1;/, 'resting cards expose ability text')
  assert.match(
    duel,
    /\.ccf-badge\) \{\s*white-space: normal;\s*overflow: visible;/,
    'combat stats cannot be ellipsized',
  )
  assert.match(
    duel,
    /\.scpvp-unit-label \{\s*position: absolute;\s*inset: calc\(0\.8rem/,
  )
}

const armorView = readFileSync('components/slime-city-pvp-game.vue', 'utf8')
assert.match(armorView, /<SlimeCityArmorStat/)
assert.match(armorView, /:armor="unit\(side, lane\)!\.armor"/)

// Rewards need a real exchange of plays, rounds and time after joining.
{
  const commands = (['player', 'enemy'] as const).flatMap((side) =>
    Array.from({ length: 3 }, () => ({
      t: 'play' as const,
      side,
      card: 'test',
      lane: 0,
    })),
  )
  const joined = '2026-11-25T00:00:00Z'
  const now = Date.parse(joined) + 300_000
  const state = { round: 4, commands }
  assert.deepEqual(pvpMeatRewards(state, 'player', joined, now), {
    player: 30,
    enemy: 10,
  })
  assert.deepEqual(pvpMeatRewards(state, 'draw', joined, now), {
    player: 15,
    enemy: 15,
  })
  assert.deepEqual(
    pvpMeatRewards({ ...state, round: 1 }, 'player', joined, now),
    {
      player: 0,
      enemy: 0,
    },
  )
  assert.deepEqual(pvpMeatRewards(state, 'enemy', joined, now - 1), {
    player: 0,
    enemy: 0,
  })
  assert.deepEqual(
    pvpMeatRewards({ ...state, commands: [] }, 'enemy', joined, now),
    {
      player: 0,
      enemy: 0,
    },
  )
}

// Replay independently selected Solo and Alliance decks without exposing cards.
{
  const solo = soloStarter('catgirls')
  const alliance = allianceStarter('ironjaw', 'riot')
  const rules = pvpRules({
    dealEarly: true,
    deckSetups: {
      player: { format: 'solo', cards: solo },
      enemy: { format: 'alliance', deck: alliance },
    },
  })
  const state = newPvpGame('catgirls', 'ironjaw', 42, rules)
  assert.deepEqual(state.allies, { player: null, enemy: 'riot' })
  assert.deepEqual(
    [...state.decks.player, ...state.hands.player].sort(),
    [...solo].sort(),
  )
  assert.deepEqual(
    [...state.decks.enemy, ...state.hands.enemy].sort(),
    [...alliance.cards].sort(),
  )
  const board = pvpBoard(state, 'player')
  assert.deepEqual(board.allies, state.allies)
  assert.deepEqual(
    pvpClashView(board, 'player', 'catgirls', 'ironjaw').allies,
    state.allies,
  )
  assert.equal('deckSetups' in board, false)
  assert.deepEqual(replayPvp('catgirls', 'ironjaw', 42, [], rules), state)
}

// Every curated Alliance starter is legal for a fresh account and is dealt
// unchanged into a human duel.
{
  assert.equal(STARTER_MATCHUPS.length, 6)
  assert.equal(new Set(STARTER_MATCHUPS.map(([general]) => general)).size, 6)
  for (const [general, ally] of STARTER_MATCHUPS) {
    const deck = allianceStarter(general, ally)
    assert.equal(deck.cards.length, CLASH_DECK_SIZE)
    assert.ok(deck.cards.every((id) => STARTER_CARD_IDS.has(id)))
    const state = newPvpGame(
      general,
      ally,
      42,
      pvpRules({ deckSetups: { player: { format: 'alliance', deck } } }),
    )
    assert.equal(state.allies?.player, ally)
    assert.deepEqual(
      [...state.decks.player, ...state.hands.player].sort(),
      [...deck.cards].sort(),
    )
  }
}

// Every human duel entry point uses the same four-way deck picker.
{
  const picker = readFileSync(
    'components/slime-city-duel-deck-picker.vue',
    'utf8',
  )
  assert.match(picker, /id: 'faction', name: 'Faction'/)
  assert.match(picker, /id: 'alliance', name: 'Alliance'/)
  assert.doesNotMatch(picker, /name: 'Faction Classic'|name: 'Faction Constructed'/)
  assert.match(picker, /v-model="factionDeck"/)
  assert.match(picker, /Your saved deck/)
  assert.match(picker, /Faction starter/)
  for (const path of [
    'components/slime-city-vs.vue',
    'components/slime-city-pvp-game.vue',
  ])
    assert.match(readFileSync(path, 'utf8'), /<SlimeCityDuelDeckPicker/)
  const store = readFileSync('stores/slimeCity.ts', 'utf8')
  assert.match(
    store,
    /mode === 'faction-classic'\)\s*return \{ format: 'solo', cards: soloStarter\(team\) \}/,
  )
  assert.doesNotMatch(picker, /alliance-classic|alliance-constructed/)
  assert.doesNotMatch(store, /alliance-classic|alliance-constructed/)
  assert.match(picker, /name: 'Alliance'/)
  assert.match(picker, /\('alliance'\)/)
  assert.match(picker, /lab\.starterDecks\s*\.filter/)
  assert.match(picker, /lab\.duelDeck\(props\.team, 'alliance', deck\.id\)/)
  assert.match(store, /allianceStarter\(team, starter\.ally\)/)
  assert.match(store, /deck\.cards\.every\(isCardUnlocked\)/)
  assert.match(picker, /deck\.cards\.every\(lab\.isCardUnlocked\)/)
}

// Turn email is explicit opt-in, authenticated, verified and sent after commit.
{
  const service = readFileSync('server/utils/slimeCityPvp.ts', 'utf8')
  const mail = readFileSync('server/utils/slimeCityTurnEmail.ts', 'utf8')
  assert.match(service, /!after\.victor && before\.active !== after\.active/)
  assert.match(service, /await notifySlimeCityTurn\(nextTurnUserId, id\)/)
  assert.match(mail, /raw\.pvpTurnEmail === true/)
  assert.match(mail, /user\.emailVerified/)
  assert.match(mail, /if \(!optedIn\(row\?\.data\)\)/)
  assert.match(mail, /if \(result\.sent\)/)
  for (const status of ['ineligible', 'disabled', 'accepted', 'not accepted'])
    assert.ok(mail.includes('turn email ' + status))
  const join = service.slice(
    service.indexOf('export async function joinSlimeCityDuel'),
    service.indexOf('type DuelTransaction'),
  )
  assert.match(join, /firstTurnUserId: null/)
  assert.match(join, /duel\.board\?\.active === 'player'/)
  assert.match(
    join,
    /\}\)\s*if \(outcome\.firstTurnUserId !== null\)\s*await notifySlimeCityTurn\(outcome\.firstTurnUserId, id\)/,
  )
  assert.match(mail, /version: row\.version/)
  for (const route of ['get', 'patch'])
    assert.match(
      readFileSync(
        'server/api/slime-city/pvp/turn-email.' + route + '.ts',
        'utf8',
      ),
      /requireSlimeCityPlayer\(event\)/,
    )
}

// Existing duel records replay the original tuning; new records retain v2.
assert.equal(pvpRules({}).balanceVersion, 1)
assert.equal(pvpRules({ balanceVersion: 2 }).balanceVersion, 2)
