import { createError, type H3Event } from 'h3'
import { requireHumanApiUser } from './authGuard'
import { randomInt } from 'node:crypto'
import prisma from './prisma'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  CARDS, TEAMS, createMatch, replayMatch, type Command,
  type MatchState, type TeamId,
} from '~/utils/slimeCity/prototypes'
import {
  awardBattle, buyPack, canBuyPack, claimChallenge,
  newProgression, refreshPeriods, restoreProgression,
  type Progression,
} from '~/utils/slimeCity/progression'

/** /admin/slime-city is an internal preview. Keep rewards off the public API surface. */
export async function requireSlimeCityPreviewUser(event: H3Event) {
  const auth = await requireHumanApiUser(event)
  if (!auth.isAdmin || auth.user.isGuest)
    throw createError({ statusCode: 403, message: 'Slime City progression is admin-preview only.' })
  return auth
}

const toJson = (data: unknown) => JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue

/** All virtual Meat, XP, inventory and claims belong to a real User row. */
export async function getSlimeCityAccount(userId: number): Promise<Progression> {
  const row = await prisma.slimeCityAccount.findUnique({ where: { userId } })
  return row ? restoreProgression(row.data) : newProgression()
}

/** Optimistic compare-and-swap plus DB transaction protects competing tabs. */
async function changeAccount(
  userId: number, mutate: (state: Progression) => Progression,
): Promise<Progression> {
  return prisma.$transaction(async (tx) => {
    await tx.slimeCityAccount.upsert({
      where: { userId }, update: {},
      create: { userId, data: toJson(newProgression()) },
    })
    const row = await tx.slimeCityAccount.findUniqueOrThrow({ where: { userId } })
    const before = restoreProgression(row.data)
    const after = mutate(before)
    if (after === before) return before
    const updated = await tx.slimeCityAccount.updateMany({
      where: { userId, version: row.version },
      data: { data: toJson(after), version: { increment: 1 } },
    })
    if (updated.count !== 1)
      throw createError({ statusCode: 409, message: 'Wallet was updated by another request. Retry.' })
    return after
  })
}

export async function buySlimeCityPack(userId: number): Promise<Progression> {
  return changeAccount(userId, (state) => {
    if (!canBuyPack(state))
      throw createError({ statusCode: 409, message: 'Not enough virtual Meat, or no complete rare-guaranteed packs remain.' })
    return buyPack(state, randomInt(1, 0x7fffffff))
  })
}
export async function claimSlimeCityChallenge(userId: number, id: string): Promise<Progression> {
  const before = await getSlimeCityAccount(userId)
  const valid = claimChallenge(before, id)
  if (valid === before) throw createError({ statusCode: 409, message: 'Challenge is unavailable or already claimed.' })
  return changeAccount(userId, (state) => {
    const after = claimChallenge(state, id)
    if (after === state)
      throw createError({ statusCode: 409, message: 'Challenge is unavailable or already claimed.' })
    return after
  })
}

/** Issued server-side: clients cannot choose rewarding seeds or opponents. */
export async function startSlimeCityCpuMatch(userId: number, teamId: string) {
  if (!TEAMS.some((team) => team.id === teamId))
    throw createError({ statusCode: 400, message: 'Unknown Slime City crew.' })
  const seed = randomInt(100000, 1000000)
  const team = teamId as TeamId
  const foes = TEAMS.filter((t) => t.id !== team)
  const foeId = foes[randomInt(foes.length)]!.id
  const row = await prisma.slimeCityMatch.create({
    data: { userId, mode: 'blackout', teamId: team, foeId, seed },
  })
  return { id: row.id, mode: 'blackout' as const, teamId: team, foeId, seed }
}

/** A server replay is required; a client-submitted winner/XP/Meat is ignored. */
export function validateSlimeCityBattle(
  setup: { mode: string; teamId: string; foeId: string; seed: number; startedAt: Date },
  commands: unknown,
  now = new Date(),
): MatchState {
  if (!Array.isArray(commands) || commands.length < 3 || commands.length > 600)
    throw createError({ statusCode: 400, message: 'Incomplete or oversized battle transcript.' })
  const ageMs = now.getTime() - setup.startedAt.getTime()
  if (ageMs < 5000 || ageMs > 86400000)
    throw createError({ statusCode: 409, message: 'CPU battle is too short or expired.' })
  if (setup.mode !== 'blackout' || !TEAMS.some((x) => x.id === setup.teamId) ||
    !TEAMS.some((x) => x.id === setup.foeId))
    throw createError({ statusCode: 400, message: 'Invalid server match setup.' })
  let ends = 0
  let plays = 0
  for (const action of commands) {
    if (!action || typeof action !== 'object' || typeof action.t !== 'string')
      throw createError({ statusCode: 400, message: 'Bad battle command.' })
    if (action.t === 'end') { ends++; continue }
    if (action.side !== 'player')
      throw createError({ statusCode: 403, message: 'Cannot submit CPU-owned commands.' })
    if (action.t === 'deploy') {
      if (!CARDS.some((c) => c.id === action.card) ||
        !Number.isSafeInteger(action.x) || !Number.isSafeInteger(action.y))
        throw createError({ statusCode: 400, message: 'Malformed deployment.' })
      plays++
    } else if (action.t === 'move') {
      if (![action.id, action.x, action.y].every(Number.isSafeInteger))
        throw createError({ statusCode: 400, message: 'Malformed movement.' })
    } else if (action.t === 'attack') {
      if (![action.id, action.target].every(Number.isSafeInteger))
        throw createError({ statusCode: 400, message: 'Malformed attack.' })
    } else if (action.t === 'reveal') {
      if (!Number.isSafeInteger(action.id))
        throw createError({ statusCode: 400, message: 'Malformed reveal.' })
    } else throw createError({ statusCode: 400, message: 'Unknown battle command.' })
  }
  if (ends < 2 || plays < 1)
    throw createError({ statusCode: 400, message: 'Battle needs played units and real turns.' })
  const verified = replayMatch({
    mode: 'blackout', teamId: setup.teamId as TeamId,
    foeId: setup.foeId as TeamId, seed: setup.seed,
  }, commands as Command[])
  if (!verified.victor || JSON.stringify(verified.commands) !== JSON.stringify(commands))
    throw createError({ statusCode: 409, message: 'Match is incomplete or actions failed replay validation.' })
  return verified
}

export async function finishSlimeCityCpuMatch(
  userId: number, id: string, commands: unknown,
): Promise<Progression> {
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id))
    throw createError({ statusCode: 400, message: 'Invalid match id.' })
  return prisma.$transaction(async (tx) => {
    const match = await tx.slimeCityMatch.findFirst({ where: { id, userId } })
    if (!match || match.settledAt)
      throw createError({ statusCode: 409, message: 'CPU match not found or already rewarded.' })
    const now = new Date()
    const verified = validateSlimeCityBattle(match, commands, now)
    const row = await tx.slimeCityAccount.upsert({
      where: { userId }, update: {},
      create: { userId, data: toJson(newProgression(now)) },
    })
    const before = refreshPeriods(restoreProgression(row.data, now), now)
    const after = awardBattle(before, verified, now)
    const updated = await tx.slimeCityAccount.updateMany({
      where: { userId, version: row.version },
      data: { data: toJson(after), version: { increment: 1 } },
    })
    if (updated.count !== 1)
      throw createError({ statusCode: 409, message: 'Wallet changed; please retry settlement.' })
    const settled = await tx.slimeCityMatch.updateMany({
      where: { id, userId, settledAt: null },
      data: { settledAt: now, result: verified.victor!, commands: toJson(commands) },
    })
    if (settled.count !== 1)
      throw createError({ statusCode: 409, message: 'Battle already settled.' })
    return after
  })
}
