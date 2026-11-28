import { randomInt } from 'node:crypto'
import { createError } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { createNotification } from '~/server/utils/notify'
import {
  notifySlimeCityChallenge,
  notifySlimeCityTurn,
} from '~/server/utils/slimeCityTurnEmail'
import {
  PVP_MAX_COMMANDS,
  PVP_MODE,
  isPvpTeam,
  isPvpExpired,
  PVP_INVITE_EXPIRY_MS,
  parsePvpRecord,
  pvpBoard,
  pvpMeatRewards,
  pvpGameSummary,
  pvpSnapshotRival,
  sortPvpGames,
  pvpCommand,
  pvpRules,
  replayPvp,
  replayPvpTrail,
  pvpRevision,
  pvpTakeBack,
  pvpTakebacks,
  pvpTakebackState,
  PVP_TAKEBACK_CHOICES,
  PVP_TAKEBACKS_ANY,
  stepPvp,
  type PvpRecord,
  type PvpSnapshot,
} from '~/utils/slimeCity/pvp'
import { accountWithStory } from '~/utils/slimeCity/storySave'
import {
  newProgression,
  recordChallengeBattle,
  refreshPeriods,
  restoreProgression,
} from '~/utils/slimeCity/progression'
import type { ClashState } from '~/utils/slimeCity/clash'
import {
  clashRewardCards,
  clashRewardSetupProblem,
  type ClashRewardSetup,
} from '~/utils/slimeCity/clashRewards'
import { STARTER_CARD_IDS } from '~/utils/slimeCity/alliance'
import type { Side, TeamId } from '~/utils/slimeCity/prototypes'

function fail(statusCode: number, message: string): never {
  throw createError({ statusCode, message })
}

const asJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value))

function validId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  )
}

type Row = NonNullable<
  Awaited<ReturnType<typeof prisma.slimeCityMatch.findUnique>>
>

function activeRow(
  row: Row | null,
  id: string,
): {
  row: Row
  record: PvpRecord
} {
  if (!row || row.id !== id || row.mode !== PVP_MODE)
    return fail(404, 'Duel not found.')
  const record = parsePvpRecord(row.commands)
  if (!record) return fail(409, 'Duel record is invalid.')
  if (
    isPvpExpired(
      row.startedAt,
      record.lastActionAt,
      record.guestId !== null,
      row.settledAt !== null,
    )
  )
    return fail(410, 'This duel has expired after inactivity.')
  return { row, record }
}

function seatFor(row: Row, record: PvpRecord, userId: number): Side {
  if (row.userId === userId) return 'player'
  if (record.guestId === userId) return 'enemy'
  return fail(404, 'Duel not found.')
}

/**
 * Who may look at a waiting duel before answering it: the challenged friend,
 * or, for a duel sent to nobody in particular, anyone holding its link or
 * finding it in the open list. Nothing but the host's crew is visible yet.
 */
function canAnswer(row: Row, record: PvpRecord, userId: number): boolean {
  return (
    record.guestId === null &&
    row.userId !== userId &&
    (record.invitedId ? record.invitedId === userId : true)
  )
}

function snapshot(row: Row, record: PvpRecord, userId: number): PvpSnapshot {
  const seat: Side = canAnswer(row, record, userId)
    ? 'enemy'
    : seatFor(row, record, userId)
  const joined = record.guestId !== null
  const trail = joined
    ? replayPvpTrail(
        row.teamId as TeamId,
        row.foeId as TeamId,
        row.seed,
        record.commands,
        pvpRules(record),
      )
    : null
  const state = trail?.state ?? null
  const mine =
    !!state && !state.victor && !row.settledAt && state.active === seat
  return {
    id: row.id,
    seat,
    hostTeam: row.teamId as TeamId,
    guestTeam: joined ? (row.foeId as TeamId) : null,
    stage: !joined
      ? 'waiting'
      : row.settledAt || state?.victor
        ? 'finished'
        : 'battle',
    challenge: !!record.invitedId,
    open: !!record.isPublic,
    board: state ? pvpBoard(state, seat) : null,
    revision: pvpRevision(record),
    takebacks: pvpTakebacks(record),
    takeback: mine
      ? pvpTakebackState(
          row.teamId as TeamId,
          row.foeId as TeamId,
          row.seed,
          record,
          seat,
          state,
        )
      : null,
    strikes: trail?.strikes ?? [],
    outcome: row.settledAt
      ? (row.result as PvpSnapshot['outcome'])
      : (state?.victor ?? null),
    forfeitedBy: record.forfeitedBy ?? null,
    meatReward: record.meatRewards?.[seat] ?? 0,
    rivalId: pvpSnapshotRival(row.userId, record, userId),
  }
}

/** Add the rival's username for the two players' finished-duel panel. */
async function withRivalName(duel: PvpSnapshot): Promise<PvpSnapshot> {
  if (!duel.rivalId) return duel
  const rival = await prisma.user.findUnique({
    where: { id: duel.rivalId },
    select: { username: true },
  })
  return { ...duel, rivalName: rival?.username ?? null }
}

async function validateDuelDeck(
  userId: number,
  team: TeamId,
  raw: unknown,
): Promise<ClashRewardSetup | undefined> {
  if (raw === undefined) return undefined
  const problem = clashRewardSetupProblem(team, raw)
  if (problem) return fail(400, problem)
  const setup = raw as ClashRewardSetup
  if (setup.bout) return fail(400, 'Story modifiers are not legal in duels.')
  const wallet = await prisma.slimeCityAccount.findUnique({ where: { userId } })
  const owned = new Set(restoreProgression(wallet?.data).cards)
  if (
    clashRewardCards(setup).some(
      (id) => !STARTER_CARD_IDS.has(id) && !owned.has(id),
    )
  )
    return fail(403, 'Unlock every card in your duel deck first.')
  return setup.format === 'solo'
    ? { format: 'solo', cards: [...setup.cards] }
    : {
        format: 'alliance',
        deck: {
          general: setup.deck.general,
          ally: setup.deck.ally,
          cards: [...setup.deck.cards],
        },
      }
}

/**
 * Invite duels for signed-in players. No matchmaking, wallet, payout or
 * production economy changes. Only the inviter and the first authenticated
 * invitee can see or mutate the transcript.
 */
export async function createSlimeCityDuel(
  userId: number,
  team: unknown,
  friendId?: unknown,
  isPublic?: unknown,
  takebacks?: unknown,
  rawDeck?: unknown,
) {
  if (!isPvpTeam(team)) return fail(400, 'Choose a Slime City crew.')
  if (takebacks !== undefined && !PVP_TAKEBACK_CHOICES.includes(takebacks as 0))
    return fail(400, 'Choose how many take-backs a turn allows.')
  if (isPublic !== undefined && typeof isPublic !== 'boolean')
    return fail(400, 'Choose an open or private duel.')
  if (isPublic && friendId !== undefined && friendId !== null)
    return fail(400, 'A friend challenge is private.')
  let invitedId: number | null = null
  if (friendId !== undefined && friendId !== null) {
    if (!Number.isSafeInteger(friendId) || Number(friendId) <= 0)
      return fail(400, 'Choose a friend to challenge.')
    if (friendId === userId) return fail(400, 'You cannot challenge yourself.')
    const friendship = await prisma.userRelation.findFirst({
      where: {
        userId,
        relatedUserId: Number(friendId),
        type: 'FRIEND',
        status: 'ACCEPTED',
      },
      select: { id: true },
    })
    if (!friendship)
      return fail(403, 'You can only challenge players on your friends list.')
    invitedId = Number(friendId)
  }
  const setup = await validateDuelDeck(userId, team, rawDeck)
  const recent = await prisma.slimeCityMatch.count({
    where: {
      userId,
      mode: PVP_MODE,
      startedAt: { gte: new Date(Date.now() - PVP_INVITE_EXPIRY_MS) },
      settledAt: null,
    },
  })
  if (recent >= 12)
    return fail(429, 'Finish a waiting duel before starting more.')
  const row = await prisma.slimeCityMatch.create({
    data: {
      userId,
      teamId: team,
      foeId: 'catgirls',
      mode: PVP_MODE,
      seed: randomInt(1, 0x7fffffff),
      commands: asJson({
        version: 1,
        guestId: null,
        ...(setup ? { deckSetups: { player: setup } } : {}),
        dealEarly: true,
        balanceVersion: 2,
        takebacks: PVP_TAKEBACKS_ANY,
        ...(invitedId ? { invitedId } : {}),
        ...(isPublic ? { isPublic: true } : {}),
        lastActionAt: new Date().toISOString(),
        commands: [],
      } satisfies PvpRecord),
    },
  })
  if (invitedId) {
    const host = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    })
    await createNotification({
      userId: invitedId,
      type: 'SYSTEM',
      title: `${host?.username ?? 'A friend'} challenged you to Slime City`,
      body: 'Pick a crew and answer the challenge.',
      linkPath: '/play/slime-city-pvp?duel=' + row.id,
      actorId: userId,
    })
    await notifySlimeCityChallenge(
      invitedId,
      row.id,
      host?.username ?? 'A friend',
    )
  }
  return snapshot(row, parsePvpRecord(row.commands)!, userId)
}

/**
 * The VS hub's game list: duels this player started or joined, waiting on
 * them first. Expired invites and abandoned games drop out of the list.
 */
export async function listSlimeCityDuels(userId: number) {
  const rows = await prisma.slimeCityMatch.findMany({
    where: {
      mode: PVP_MODE,
      OR: [
        { userId },
        { commands: { path: '$.guestId', equals: userId } },
        { commands: { path: '$.invitedId', equals: userId } },
      ],
    },
    orderBy: { startedAt: 'desc' },
    take: 40,
  })
  const games = rows.flatMap((row) => {
    const record = parsePvpRecord(row.commands)
    const game = record ? pvpGameSummary(row, record, userId) : null
    return game && game.stage !== 'expired' ? [game] : []
  })
  const rivalIds = [
    ...new Set(games.flatMap((game) => (game.rivalId ? [game.rivalId] : []))),
  ]
  const rivals = rivalIds.length
    ? await prisma.user.findMany({
        where: { id: { in: rivalIds } },
        select: { id: true, username: true },
      })
    : []
  const names = new Map(rivals.map((user) => [user.id, user.username]))
  return sortPvpGames(
    games.map((game) => ({
      ...game,
      rivalName: game.rivalId ? (names.get(game.rivalId) ?? null) : null,
    })),
  )
}

/**
 * Open duels other players can join, newest first. Readable by any visitor:
 * the host chose to list it, and only their username and crew are shown.
 */
export async function listOpenSlimeCityDuels(viewerId: number | null) {
  const now = Date.now()
  const rows = await prisma.slimeCityMatch.findMany({
    where: {
      mode: PVP_MODE,
      settledAt: null,
      startedAt: { gte: new Date(now - PVP_INVITE_EXPIRY_MS) },
      commands: { path: '$.isPublic', equals: true },
      ...(viewerId ? { NOT: { userId: viewerId } } : {}),
    },
    orderBy: { startedAt: 'desc' },
    take: 40,
  })
  const open = rows.flatMap((row) => {
    const record = parsePvpRecord(row.commands)
    if (
      !record?.isPublic ||
      record.guestId !== null ||
      !isPvpTeam(row.teamId) ||
      isPvpExpired(row.startedAt, record.lastActionAt, false, false, now)
    )
      return []
    return [{ id: row.id, hostId: row.userId, hostTeam: row.teamId as TeamId }]
  })
  const hosts = open.length
    ? await prisma.user.findMany({
        where: { id: { in: [...new Set(open.map((duel) => duel.hostId))] } },
        select: { id: true, username: true },
      })
    : []
  const names = new Map(hosts.map((user) => [user.id, user.username]))
  return open.slice(0, 20).map((duel) => ({
    id: duel.id,
    hostTeam: duel.hostTeam,
    hostName: names.get(duel.hostId) ?? 'A player',
  }))
}

/**
 * Silas, 2026-11-11 PT: "Invites should be cancellable." The host withdraws a
 * waiting duel, or the challenged friend declines it; either way it is gone.
 */
export async function cancelSlimeCityDuel(id: string, userId: number) {
  if (!validId(id)) return fail(404, 'Duel not found.')
  const outcome = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM SlimeCityMatch WHERE id = ${id} FOR UPDATE`
    const row = await tx.slimeCityMatch.findUnique({ where: { id } })
    if (!row || row.mode !== PVP_MODE) return fail(404, 'Duel not found.')
    const record = parsePvpRecord(row.commands)
    if (!record) return fail(409, 'Duel record is invalid.')
    const host = row.userId === userId
    const declining = !host && !!record.invitedId && record.invitedId === userId
    if (!host && !declining) return fail(404, 'Duel not found.')
    if (record.guestId !== null)
      return fail(409, 'The duel has started. Forfeit it instead.')
    await tx.slimeCityMatch.delete({ where: { id } })
    return {
      hostId: row.userId,
      invitedId: record.invitedId ?? null,
      declining,
    }
  })
  const link = '/play/slime-city-pvp?duel=' + id
  if (outcome.invitedId) {
    try {
      await prisma.notification.deleteMany({
        where: { userId: outcome.invitedId, linkPath: link },
      })
    } catch (err) {
      console.error('[slime-city] could not clear challenge notice:', err)
    }
  }
  if (outcome.declining) {
    const friend = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    })
    await createNotification({
      userId: outcome.hostId,
      type: 'SYSTEM',
      title: `${friend?.username ?? 'Your friend'} declined your Slime City challenge`,
      linkPath: '/play/slime-city?vs=1',
      actorId: userId,
    })
  }
  return { id, cancelled: true }
}

/** Accepted friends, the first people a player can challenge. */
export async function listSlimeCityFriends(userId: number) {
  const relations = await prisma.userRelation.findMany({
    where: { userId, type: 'FRIEND', status: 'ACCEPTED' },
    select: {
      RelatedUser: {
        select: {
          id: true,
          username: true,
          designerName: true,
          avatarImage: true,
        },
      },
    },
    take: 100,
  })
  return relations
    .map((relation) => relation.RelatedUser)
    .sort((a, b) => a.username.localeCompare(b.username))
}

export async function getSlimeCityDuel(id: string, userId: number) {
  if (!validId(id)) return fail(404, 'Duel not found.')
  const { row, record } = activeRow(
    await prisma.slimeCityMatch.findUnique({ where: { id } }),
    id,
  )
  return withRivalName(snapshot(row, record, userId))
}

export async function joinSlimeCityDuel(
  id: string,
  userId: number,
  team: unknown,
  rawDeck?: unknown,
) {
  if (!isPvpTeam(team)) return fail(400, 'Choose a Slime City crew.')
  const setup = await validateDuelDeck(userId, team, rawDeck)
  const outcome = await prisma.$transaction(async (tx) => {
    if (!validId(id)) return fail(404, 'Duel not found.')
    await tx.$queryRaw`SELECT id FROM SlimeCityMatch WHERE id = ${id} FOR UPDATE`
    const { row, record } = activeRow(
      await tx.slimeCityMatch.findUnique({ where: { id } }),
      id,
    )
    if (row.userId === userId)
      return fail(403, 'You cannot fight yourself. Invite another account.')
    if (record.invitedId && record.invitedId !== userId)
      return fail(403, 'This challenge was sent to another player.')
    if (record.guestId !== null && record.guestId !== userId)
      return fail(409, 'This duel already has two fighters.')
    if (record.guestId === userId)
      return { duel: snapshot(row, record, userId), firstTurnUserId: null }
    const next: PvpRecord = {
      ...record,
      guestId: userId,
      joinedAt: new Date().toISOString(),
      ...(setup ? { deckSetups: { ...record.deckSetups, enemy: setup } } : {}),
      lastActionAt: new Date().toISOString(),
    }
    const updated = await tx.slimeCityMatch.update({
      where: { id },
      data: { foeId: team, commands: asJson(next) },
    })
    const duel = snapshot(updated, next, userId)
    return {
      duel,
      firstTurnUserId:
        duel.stage === 'battle' && duel.board?.active === 'player'
          ? row.userId
          : null,
    }
  })
  if (outcome.firstTurnUserId !== null)
    await notifySlimeCityTurn(outcome.firstTurnUserId, id)
  return outcome.duel
}

type DuelTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

async function settleDuelMeat(
  tx: DuelTransaction,
  row: Row,
  record: PvpRecord,
  state: ClashState,
  outcome: NonNullable<ClashState['victor']>,
) {
  const rewards = pvpMeatRewards(state, outcome, record.joinedAt, Date.now())
  if (record.guestId === null) return rewards
  const seats = [
    { userId: row.userId, amount: rewards.player, seat: 'player' as const },
    { userId: record.guestId, amount: rewards.enemy, seat: 'enemy' as const },
  ].sort((a, b) => a.userId - b.userId)
  for (const { userId, amount, seat } of seats) {
    if (!amount) continue
    const wallet = await tx.slimeCityAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, data: asJson(newProgression()) },
    })
    const before = refreshPeriods(restoreProgression(wallet.data))
    const receipt = 'pvp:' + row.id
    if (before.receipts.includes(receipt)) continue
    const questOutcome = {
      victor:
        outcome === 'draw'
          ? ('draw' as const)
          : outcome === seat
            ? ('player' as const)
            : ('enemy' as const),
      mode: 'clash',
      format: state.allies?.[seat] ? ('alliance' as const) : ('solo' as const),
      teamId: state.teams[seat],
      plays: state.commands.flatMap((command) =>
        command.t === 'play' && command.side === seat ? [command.card] : [],
      ),
    }
    const after = {
      ...before,
      daily: recordChallengeBattle(before.daily, questOutcome),
      weekly: recordChallengeBattle(before.weekly, questOutcome),
      meat: before.meat + amount,
      receipts: [...before.receipts.slice(-255), receipt],
      lastReward: 'VS duel · +' + amount + ' Meat',
    }
    const updated = await tx.slimeCityAccount.updateMany({
      where: { userId, version: wallet.version },
      data: {
        data: asJson(accountWithStory(wallet.data, after)),
        version: { increment: 1 },
      },
    })
    if (updated.count !== 1)
      return fail(409, 'Wallet changed. Retry your duel action.')
  }
  return rewards
}

export async function commandSlimeCityDuel(
  id: string,
  userId: number,
  revision: unknown,
  raw: unknown,
) {
  if (!Number.isSafeInteger(revision) || Number(revision) < 0)
    return fail(400, 'Invalid match revision.')
  let nextTurnUserId: number | null = null
  const duel = await prisma.$transaction(async (tx) => {
    if (!validId(id)) return fail(404, 'Duel not found.')
    await tx.$queryRaw`SELECT id FROM SlimeCityMatch WHERE id = ${id} FOR UPDATE`
    const { row, record } = activeRow(
      await tx.slimeCityMatch.findUnique({ where: { id } }),
      id,
    )
    const seat = seatFor(row, record, userId)
    if (record.guestId === null) return fail(409, 'Waiting for a rival.')
    if (row.settledAt || record.forfeitedBy)
      return fail(409, 'This duel has already ended.')
    if (pvpRevision(record) !== revision)
      return fail(409, 'The duel advanced on another device. Reload the turn.')
    if (record.commands.length >= PVP_MAX_COMMANDS)
      return fail(409, 'Duel command limit reached.')
    if (
      raw &&
      typeof raw === 'object' &&
      (raw as Record<string, unknown>).t === 'undo'
    ) {
      if (Object.keys(raw).length !== 1)
        return fail(400, 'Invalid battle command.')
      const taken = pvpTakeBack(
        row.teamId as TeamId,
        row.foeId as TeamId,
        row.seed,
        record,
        seat,
      )
      if ('error' in taken) return fail(409, taken.error)
      const undone: PvpRecord = {
        ...taken.record,
        lastActionAt: new Date().toISOString(),
      }
      const updated = await tx.slimeCityMatch.update({
        where: { id },
        data: { commands: asJson(undone) },
      })
      return snapshot(updated, undone, userId)
    }
    const command = pvpCommand(raw, seat)
    if (!command) return fail(400, 'Invalid battle command.')
    const before = replayPvp(
      row.teamId as TeamId,
      row.foeId as TeamId,
      row.seed,
      record.commands,
      pvpRules(record),
    )
    const after = stepPvp(before, command)
    if (!after) return fail(409, 'That move is illegal or out of turn.')
    const next: PvpRecord = {
      ...record,
      commands: [...record.commands, command],
      lastActionAt: new Date().toISOString(),
    }
    if (after.victor)
      next.meatRewards = await settleDuelMeat(
        tx,
        row,
        next,
        after,
        after.victor,
      )
    const updated = await tx.slimeCityMatch.update({
      where: { id },
      data: {
        commands: asJson(next),
        ...(after.victor
          ? { settledAt: new Date(), result: after.victor }
          : {}),
      },
    })
    if (!after.victor && before.active !== after.active)
      nextTurnUserId = after.active === 'player' ? row.userId : record.guestId
    return snapshot(updated, next, userId)
  })
  if (nextTurnUserId !== null) await notifySlimeCityTurn(nextTurnUserId, id)
  return duel.stage === 'finished' ? withRivalName(duel) : duel
}

/** Atomic, idempotent forfeit. Only an authenticated participant may concede. */
export async function forfeitSlimeCityDuel(id: string, userId: number) {
  if (!validId(id)) return fail(404, 'Duel not found.')
  const duel = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM SlimeCityMatch WHERE id = ${id} FOR UPDATE`
    const { row, record } = activeRow(
      await tx.slimeCityMatch.findUnique({ where: { id } }),
      id,
    )
    const seat = seatFor(row, record, userId)
    if (record.guestId === null)
      return fail(409, 'A waiting invitation must be cancelled, not forfeited.')
    if (row.settledAt) {
      if (record.forfeitedBy === seat) return snapshot(row, record, userId)
      return fail(409, 'This duel has already ended.')
    }
    const state = replayPvp(
      row.teamId as TeamId,
      row.foeId as TeamId,
      row.seed,
      record.commands,
      pvpRules(record),
    )
    if (state.victor) return fail(409, 'This duel has already ended.')
    const winner: Side = seat === 'player' ? 'enemy' : 'player'
    const next: PvpRecord = {
      ...record,
      forfeitedBy: seat,
      lastActionAt: new Date().toISOString(),
    }
    next.meatRewards = await settleDuelMeat(tx, row, next, state, winner)
    const updated = await tx.slimeCityMatch.update({
      where: { id },
      data: {
        commands: asJson(next),
        settledAt: new Date(),
        result: winner,
      },
    })
    return snapshot(updated, next, userId)
  })
  return withRivalName(duel)
}
