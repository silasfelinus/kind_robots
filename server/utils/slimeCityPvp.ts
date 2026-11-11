import { randomInt } from 'node:crypto'
import { createError } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import {
  PVP_MAX_COMMANDS,
  PVP_MODE,
  isPvpTeam,
  isPvpExpired,
  PVP_INVITE_EXPIRY_MS,
  parsePvpRecord,
  pvpBoard,
  pvpGameSummary,
  sortPvpGames,
  pvpCommand,
  replayPvp,
  stepPvp,
  type PvpRecord,
  type PvpSnapshot,
} from '~/utils/slimeCity/pvp'
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

function snapshot(row: Row, record: PvpRecord, userId: number): PvpSnapshot {
  const seat = seatFor(row, record, userId)
  const joined = record.guestId !== null
  const state = joined
    ? replayPvp(
        row.teamId as TeamId,
        row.foeId as TeamId,
        row.seed,
        record.commands,
      )
    : null
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
    board: state ? pvpBoard(state, seat) : null,
    revision: record.commands.length,
    outcome: row.settledAt
      ? (row.result as PvpSnapshot['outcome'])
      : (state?.victor ?? null),
    forfeitedBy: record.forfeitedBy ?? null,
  }
}

/**
 * Admin-only invite preview. No matchmaking, wallet, payout or production
 * economy changes. Only the inviter and the first authenticated invitee
 * can see or mutate the transcript.
 */
export async function createSlimeCityDuel(userId: number, team: unknown) {
  if (!isPvpTeam(team)) return fail(400, 'Choose a Slime City crew.')
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
        lastActionAt: new Date().toISOString(),
        commands: [],
      } satisfies PvpRecord),
    },
  })
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
      OR: [{ userId }, { commands: { path: '$.guestId', equals: userId } }],
    },
    orderBy: { startedAt: 'desc' },
    take: 40,
  })
  return sortPvpGames(
    rows.flatMap((row) => {
      const record = parsePvpRecord(row.commands)
      const game = record ? pvpGameSummary(row, record, userId) : null
      return game && game.stage !== 'expired' ? [game] : []
    }),
  )
}

export async function getSlimeCityDuel(id: string, userId: number) {
  if (!validId(id)) return fail(404, 'Duel not found.')
  const { row, record } = activeRow(
    await prisma.slimeCityMatch.findUnique({ where: { id } }),
    id,
  )
  return snapshot(row, record, userId)
}

export async function joinSlimeCityDuel(
  id: string,
  userId: number,
  team: unknown,
) {
  if (!isPvpTeam(team)) return fail(400, 'Choose a Slime City crew.')
  return prisma.$transaction(async (tx) => {
    if (!validId(id)) return fail(404, 'Duel not found.')
    await tx.$queryRaw`SELECT id FROM SlimeCityMatch WHERE id = ${id} FOR UPDATE`
    const { row, record } = activeRow(
      await tx.slimeCityMatch.findUnique({ where: { id } }),
      id,
    )
    if (row.userId === userId)
      return fail(403, 'You cannot fight yourself. Invite another account.')
    if (record.guestId !== null && record.guestId !== userId)
      return fail(409, 'This duel already has two fighters.')
    if (record.guestId === userId) return snapshot(row, record, userId)
    const next: PvpRecord = {
      ...record,
      guestId: userId,
      lastActionAt: new Date().toISOString(),
    }
    const updated = await tx.slimeCityMatch.update({
      where: { id },
      data: { foeId: team, commands: asJson(next) },
    })
    return snapshot(updated, next, userId)
  })
}

export async function commandSlimeCityDuel(
  id: string,
  userId: number,
  revision: unknown,
  raw: unknown,
) {
  if (!Number.isSafeInteger(revision) || Number(revision) < 0)
    return fail(400, 'Invalid match revision.')
  return prisma.$transaction(async (tx) => {
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
    if (record.commands.length !== revision)
      return fail(409, 'The duel advanced on another device. Reload the turn.')
    if (record.commands.length >= PVP_MAX_COMMANDS)
      return fail(409, 'Duel command limit reached.')
    const command = pvpCommand(raw, seat)
    if (!command) return fail(400, 'Invalid battle command.')
    const before = replayPvp(
      row.teamId as TeamId,
      row.foeId as TeamId,
      row.seed,
      record.commands,
    )
    const after = stepPvp(before, command)
    if (!after) return fail(409, 'That move is illegal or out of turn.')
    const next: PvpRecord = {
      ...record,
      commands: [...record.commands, command],
      lastActionAt: new Date().toISOString(),
    }
    const updated = await tx.slimeCityMatch.update({
      where: { id },
      data: {
        commands: asJson(next),
        ...(after.victor
          ? { settledAt: new Date(), result: after.victor }
          : {}),
      },
    })
    return snapshot(updated, next, userId)
  })
}

/** Atomic, idempotent forfeit. Only an authenticated participant may concede. */
export async function forfeitSlimeCityDuel(id: string, userId: number) {
  if (!validId(id)) return fail(404, 'Duel not found.')
  return prisma.$transaction(async (tx) => {
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
    )
    if (state.victor) return fail(409, 'This duel has already ended.')
    const winner: Side = seat === 'player' ? 'enemy' : 'player'
    const next: PvpRecord = {
      ...record,
      forfeitedBy: seat,
      lastActionAt: new Date().toISOString(),
    }
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
}
