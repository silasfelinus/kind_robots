// Slime City VS two-browser reconnect (slime-city/t-012 QA item "two-browser
// reconnect"). Drives the REAL server service (server/utils/slimeCityPvp.ts)
// for two accounts and three browsers through an in-memory Prisma double:
//
//   - host on a laptop and a phone, guest on one browser;
//   - every command is chosen from the true seeded state, sent through
//     commandSlimeCityDuel exactly as the /command route would;
//   - a browser that missed moves is rejected with 409 at its stale revision
//     and a reconnect (getSlimeCityDuel) returns the same seat board the
//     moving browser saw, with the rival's hand still hidden;
//   - two browsers racing the same revision: exactly one move lands;
//   - an outsider cannot read, move or forfeit;
//   - forfeit while the rival is offline settles once, is idempotent for the
//     loser, and the winner's reconnect shows the result;
//   - a duel idle past PVP_IDLE_EXPIRY_MS reconnects as 410, not a stale board.
//
// What this does NOT cover: real MariaDB row locks (the double serialises
// $transaction to stand in for SELECT ... FOR UPDATE), HTTP auth cookies and
// real browser polling. Those need a signed-in two-browser Playwright run.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import {
  PVP_IDLE_EXPIRY_MS,
  pvpRules,
  replayPvp,
  type PvpRecord,
  type PvpSnapshot,
} from '../slimeCity/pvp'
import { chooseClashCpu } from '../slimeCity/clash'
import type { TeamId } from '../slimeCity/prototypes'

type Row = {
  id: string
  userId: number
  teamId: string
  foeId: string
  mode: string
  seed: number
  commands: unknown
  startedAt: Date
  settledAt: Date | null
  result: string | null
}

const rows = new Map<string, Row>()
const users = new Map([
  [1, { id: 1, username: 'host-qa' }],
  [2, { id: 2, username: 'guest-qa' }],
  [3, { id: 3, username: 'outsider-qa' }],
])
const clone = <T>(value: T): T => structuredClone(value)

let lock: Promise<unknown> = Promise.resolve()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fake: any = {
  $extends: () => fake,
  $queryRaw: async () => [],
  // Serialise transactions: stands in for SELECT ... FOR UPDATE on one row.
  $transaction: <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => {
    const run = lock.then(() => fn(fake))
    lock = run.catch(() => undefined)
    return run
  },
  user: {
    findUnique: async ({ where }: { where: { id: number } }) =>
      clone(users.get(where.id) ?? null),
  },
  notification: { create: async () => ({}) },
  userRelation: { findFirst: async () => null },
  slimeCityMatch: {
    count: async () => 0,
    findUnique: async ({ where }: { where: { id: string } }) =>
      clone(rows.get(where.id) ?? null),
    create: async ({
      data,
    }: {
      data: Omit<Row, 'id' | 'startedAt' | 'settledAt' | 'result'> &
        Partial<Pick<Row, 'settledAt' | 'result'>>
    }) => {
      const row: Row = {
        ...clone(data),
        settledAt: data.settledAt ?? null,
        result: data.result ?? null,
        id: randomUUID(),
        startedAt: new Date(),
      }
      rows.set(row.id, row)
      return clone(row)
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string }
      data: Partial<Row>
    }) => {
      const row = rows.get(where.id)
      assert.ok(row, 'update of a missing duel row')
      Object.assign(row, clone(data))
      return clone(row)
    },
  },
}

process.env.DATABASE_URL ??= 'mysql://user:pass@127.0.0.1:3306/kindrobots'
;(globalThis as { prisma?: unknown }).prisma = fake

const {
  commandSlimeCityDuel,
  createSlimeCityDuel,
  forfeitSlimeCityDuel,
  getSlimeCityDuel,
  joinSlimeCityDuel,
} = await import('../../server/utils/slimeCityPvp')

async function rejects(
  work: Promise<unknown>,
  status: number,
  why: string,
): Promise<void> {
  await assert.rejects(
    work,
    (error: { statusCode?: number }) => error?.statusCode === status,
    why,
  )
}

/** One open tab: an account plus the last snapshot that tab rendered. */
class Browser {
  view: PvpSnapshot | null = null
  constructor(
    readonly userId: number,
    readonly label: string,
  ) {}

  async reconnect(id: string): Promise<PvpSnapshot> {
    this.view = await getSlimeCityDuel(id, this.userId)
    return this.view
  }

  /** The legal move this seat would make from the true seeded state. */
  nextMove(): Record<string, unknown> {
    const view = this.view!
    const row = rows.get(view.id)!
    const record = row.commands as PvpRecord
    const state = replayPvp(
      row.teamId as TeamId,
      row.foeId as TeamId,
      row.seed,
      record.commands,
      pvpRules(record),
    )
    assert.equal(state.active, view.seat, `${this.label} moved out of turn`)
    const { side: _side, ...command } = chooseClashCpu(state, view.seat)
    return command
  }

  async move(command = this.nextMove()): Promise<PvpSnapshot> {
    const view = this.view!
    this.view = await commandSlimeCityDuel(
      view.id,
      this.userId,
      view.revision,
      command,
    )
    return this.view
  }
}

const laptop = new Browser(1, 'host laptop')
const phone = new Browser(1, 'host phone')
const guest = new Browser(2, 'guest')
const outsider = new Browser(3, 'outsider')

const created = await createSlimeCityDuel(1, 'riot', undefined, true)
assert.equal(created.stage, 'waiting')
const id = created.id
laptop.view = created
await phone.reconnect(id)
assert.equal(phone.view!.seat, 'player')
guest.view = await joinSlimeCityDuel(id, 2, 'undertow')
assert.equal(guest.view.seat, 'enemy')
assert.equal(guest.view.stage, 'battle')

// Both host tabs come back to the battle; they agree.
await laptop.reconnect(id)
await phone.reconnect(id)
assert.deepEqual(phone.view, laptop.view, 'both host tabs agree')

// Rejoining from the same account is idempotent; a third account is refused.
assert.equal((await joinSlimeCityDuel(id, 2, 'undertow')).revision, 0)
await rejects(
  joinSlimeCityDuel(id, 3, 'catgirls'),
  409,
  'third fighter refused',
)
await rejects(outsider.reconnect(id), 404, 'outsider cannot read the duel')

const hiddenHand = (view: PvpSnapshot, rivalHand: string[]) =>
  JSON.stringify(view.board).includes(JSON.stringify(rivalHand))

let moves = 0
let staleRejections = 0
let races = 0
let hostTurns = 0
const host: [Browser, Browser] = [laptop, phone]
while (moves < 400) {
  const live = await getSlimeCityDuel(id, 1)
  if (live.stage !== 'battle') break
  if (live.board!.active === 'player') {
    // Alternate host devices; the other one is left on its stale view.
    const mover = host[moves % 2]!
    const idle = host[(moves + 1) % 2]!
    if (mover.view!.revision !== live.revision) {
      await rejects(
        mover.move(),
        409,
        'a stale tab must not overwrite moves made on another device',
      )
      staleRejections += 1
      await mover.reconnect(id)
    }
    // Schedule collisions by HOST turns, not all turns. The relative number
    // of guest actions depends on the seeded game; total-move scheduling
    // can leave a valid 40-turn run with only one race exercised.
    if (hostTurns % 5 === 0) {
      // Both host tabs fire at the same revision: exactly one lands.
      await idle.reconnect(id)
      const command = mover.nextMove()
      const results = await Promise.allSettled([
        mover.move(command),
        idle.move(command),
      ])
      const landed = results.filter((r) => r.status === 'fulfilled').length
      assert.equal(landed, 1, 'one of two racing tabs may move')
      races += 1
      await idle.reconnect(id)
      await mover.reconnect(id)
    } else {
      const after = await mover.move()
      // A fresh read (a third tab opening the link) sees the same board; the
      // idle tab is left stale so its next move must reconnect first.
      const again = await getSlimeCityDuel(id, 1)
      // Mid-battle command replies omit rivalName (added on the GET and once
      // finished); everything the board renders must match exactly.
      const { rivalName: _name, ...shown } = again
      assert.deepEqual(shown, after, 'reconnect shows the mover’s exact board')
    }
    hostTurns += 1
  } else {
    // The guest was "offline" for the host's turn; it reconnects, then moves.
    const back = await guest.reconnect(id)
    assert.equal(back.revision, live.revision, 'guest catches up on reconnect')
    const after = await guest.move()
    if (after.stage === 'battle') {
      const hostView = await laptop.reconnect(id)
      assert.equal(hostView.revision, after.revision)
      assert.equal(hostView.board!.active, after.board!.active)
      const row = rows.get(id)!
      const state = replayPvp(
        row.teamId as TeamId,
        row.foeId as TeamId,
        row.seed,
        (row.commands as PvpRecord).commands,
        pvpRules(row.commands as PvpRecord),
      )
      assert.equal(
        hiddenHand(hostView, state.hands.enemy) && state.hands.enemy.length > 1,
        false,
        'reconnecting must not reveal the rival hand',
      )
      assert.equal(hostView.board!.opponentHandCount, state.hands.enemy.length)
    }
  }
  outsider.view = laptop.view
  await rejects(outsider.move({ t: 'end' }), 404, 'outsider cannot move')
  moves += 1
  if (moves === 40) break
}
assert.ok(moves >= 40, `played ${moves} reconnecting turns`)
assert.ok(staleRejections >= 10, `stale-tab rejections ${staleRejections}`)
assert.ok(hostTurns >= 6, `host turns available for collisions ${hostTurns}`)
assert.ok(races >= 2, `same-revision races ${races}`)

// Forfeit while the host is offline; the host's reconnect shows the result.
await rejects(
  forfeitSlimeCityDuel(id, 3),
  404,
  'outsider cannot forfeit someone else’s duel',
)
const conceded = await forfeitSlimeCityDuel(id, 2)
assert.equal(conceded.stage, 'finished')
assert.equal(conceded.outcome, 'player')
assert.equal(conceded.forfeitedBy, 'enemy')
assert.deepEqual(
  (await forfeitSlimeCityDuel(id, 2)).revision,
  conceded.revision,
  'forfeit retry from a reconnecting tab is idempotent',
)
await rejects(forfeitSlimeCityDuel(id, 1), 409, 'winner cannot also forfeit')
const winnerBack = await phone.reconnect(id)
assert.equal(winnerBack.stage, 'finished')
assert.equal(winnerBack.outcome, 'player')
assert.equal(winnerBack.forfeitedBy, 'enemy')
assert.equal(winnerBack.rivalName, 'guest-qa')
await rejects(laptop.move({ t: 'end' }), 409, 'no move after a forfeit')

// A duel abandoned past the idle window reconnects as expired, not stale.
const idleDuel = await createSlimeCityDuel(1, 'catgirls')
await joinSlimeCityDuel(idleDuel.id, 2, 'exchange')
const idleRow = rows.get(idleDuel.id)!
const record = idleRow.commands as PvpRecord
record.lastActionAt = new Date(
  Date.now() - PVP_IDLE_EXPIRY_MS - 60_000,
).toISOString()
await rejects(getSlimeCityDuel(idleDuel.id, 1), 410, 'idle duel expires')
await rejects(
  commandSlimeCityDuel(idleDuel.id, 2, 0, { t: 'pass' }),
  410,
  'no move into an expired duel',
)

console.log(
  `Slime City VS reconnect: ${moves} turns over 3 browsers, ${staleRejections} stale-tab 409s, ${races} same-revision races, forfeit and expiry PASS`,
)
